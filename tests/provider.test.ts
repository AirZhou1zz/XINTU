import { describe, expect, it, vi } from "vitest";
import { buildCandidateVariants, scaleParamsForStrength } from "@/lib/agent/candidates";
import { MockProvider } from "@/lib/ai/mock-provider";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-compatible";
import { getProvider } from "@/lib/ai/provider";
import { reconcileScenePlan } from "@/lib/agent/scene";
import { colorParamsSchema } from "@/lib/color/schema";

const testParams = {
  exposure: 2,
  contrast: 0,
  temperature: 4,
  tint: 1,
  saturation: 8,
  highlights: -5,
  shadows: 5,
  clarity: 2,
  dehaze: 2,
  grain: 2,
  vignette: -2,
  skinWarmth: 10,
  skyTemperature: -2,
};

const envKeys = ["AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL", "VERCEL_OIDC_TOKEN"] as const;

function snapshotEnvironment() {
  return new Map(envKeys.map((key) => [key, process.env[key]]));
}

function restoreEnvironment(snapshot: Map<(typeof envKeys)[number], string | undefined>) {
  for (const [key, value] of snapshot) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("mock provider and candidates", () => {
  it("returns a valid plan and params", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "日系、通透、天空自然",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.45,
        clippingRatio: 0.02,
        skinRatio: 0.16,
        skyRatio: 0.03,
        natureRatio: 0.02,
        waterRatio: 0,
        aspectRatio: 0.72,
        temperatureBias: 0.02,
      },
    });
    expect(output.provider).toBe("mock");
    expect(output.plan.tools.length).toBeGreaterThan(0);
    expect(() => colorParamsSchema.parse(output.params)).not.toThrow();
  });

  it("reduces skin warmth when skin findings are present", async () => {
    const provider = new MockProvider();
    const output = await provider.refine({
      prompt: "日系",
      strength: "medium",
      params: testParams,
      findings: ["肤色区域偏移偏大，需要降低橙色饱和度和暖色偏移。"],
      iteration: 0,
    });
    expect(output.params.skinWarmth).toBeLessThan(10);
    expect(output.rationale).toContain("修正");
  });

  it("maps manual language feedback into bounded refinements", async () => {
    const provider = new MockProvider();
    const output = await provider.refine({
      prompt: "冷调夜景\n追加反馈：更暖一点，高光柔和一点",
      strength: "medium",
      params: testParams,
      findings: ["用户追加反馈：更暖一点，高光柔和一点"],
      iteration: 0,
      mode: "manual",
    });
    expect(output.params.temperature).toBeGreaterThan(testParams.temperature);
    expect(output.params.highlights).toBeLessThan(testParams.highlights);
    expect(output.rationale).toContain("根据");
  });
  it("selects scene-appropriate directions when the prompt is vague", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "帮我修得高级一点",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.48,
        clippingRatio: 0.01,
        skinRatio: 0.18,
        skyRatio: 0.01,
        natureRatio: 0.03,
        waterRatio: 0,
        aspectRatio: 0.75,
        temperatureBias: 0.02,
      },
    });
    expect(output.plan.sceneCategory).toBe("portrait");
    expect(output.plan.directions).toHaveLength(3);
    expect(output.plan.directions.map((item) => item.id)).toEqual(["A", "B", "C"]);
    expect(output.plan.directions[0].label).toContain("肤质");
  });

  it("does not reuse portrait directions for a coastal scene", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "帮我修得高级一点",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.64,
        clippingRatio: 0.02,
        skinRatio: 0.01,
        skyRatio: 0.22,
        natureRatio: 0.08,
        waterRatio: 0.34,
        aspectRatio: 1.6,
        temperatureBias: -0.03,
      },
    });
    expect(output.plan.sceneCategory).toBe("ocean");
    expect(output.plan.directions.map((item) => item.label)).toContain("清透水色");
  });
  it("keeps a landscape out of portrait directions even when warm terrain resembles skin", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "自然、通透，保留真实质感与画面层次",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.386,
        clippingRatio: 0.144,
        skinRatio: 0.091,
        centralSkinRatio: 0.047,
        skyRatio: 0.105,
        natureRatio: 0.094,
        waterRatio: 0.079,
        aspectRatio: 0.8,
        temperatureBias: 0,
      },
    });
    expect(output.plan.sceneCategory).not.toBe("portrait");
    expect(output.plan.directions.map((item) => `${item.label} ${item.description}`).join(" ")).not.toMatch(/肤色|皮肤|肤质/);
  });

  it("treats a street and car scene as city even when people are present", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "街道和汽车是主体，画面里有人，做成电影感",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.52,
        clippingRatio: 0.03,
        skinRatio: 0.09,
        centralSkinRatio: 0.05,
        skyRatio: 0.06,
        natureRatio: 0.04,
        waterRatio: 0,
        aspectRatio: 1.5,
        temperatureBias: 0.01,
      },
    });
    expect(output.plan.sceneCategory).toBe("city");
    expect(output.plan.directions.map((item) => `${item.label} ${item.description}`).join(" ")).not.toMatch(/肤色|皮肤|肤质/);
  });
  it("keeps a centered portrait classified as portrait", async () => {
    const provider = new MockProvider();
    const output = await provider.analyze({
      prompt: "自然、通透，保留真实质感与画面层次",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.474,
        clippingRatio: 0.107,
        skinRatio: 0.102,
        centralSkinRatio: 0.061,
        skyRatio: 0.107,
        natureRatio: 0.136,
        waterRatio: 0.127,
        aspectRatio: 0.714,
        temperatureBias: 0,
      },
    });
    expect(output.plan.sceneCategory).toBe("portrait");
  });

  it("guards against portrait directions returned by a vision model for a landscape", async () => {
    const provider = new MockProvider();
    const portraitOutput = await provider.analyze({
      prompt: "帮我修得高级一点",
      strength: "medium",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      sceneHints: {
        averageLuma: 0.47,
        clippingRatio: 0.02,
        skinRatio: 0.18,
        centralSkinRatio: 0.09,
        skyRatio: 0.01,
        natureRatio: 0.03,
        waterRatio: 0,
        aspectRatio: 0.75,
        temperatureBias: 0.02,
      },
    });
    const guarded = reconcileScenePlan(portraitOutput.plan, {
      averageLuma: 0.386,
      clippingRatio: 0.144,
      skinRatio: 0.091,
      centralSkinRatio: 0.047,
      skyRatio: 0.105,
      natureRatio: 0.094,
      waterRatio: 0.079,
      aspectRatio: 0.8,
      temperatureBias: 0,
    }, "自然、通透，保留真实质感与画面层次");
    expect(guarded.sceneCategory).not.toBe("portrait");
    expect(guarded.directions.map((item) => `${item.label} ${item.description}`).join(" ")).not.toMatch(/肤色|皮肤|肤质/);
  });
  it("returns a bounded local visual review", async () => {
    const provider = new MockProvider();
    const review = await provider.review({
      prompt: "自然一点",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      heuristics: {
        pass: true,
        deltaE: 3,
        skinShift: 2,
        skyShift: 1,
        structureScore: 0.98,
        clippingRatio: 0.01,
        schemaValid: true,
        findings: [],
      },
    });
    expect(review.provider).toBe("mock");
    expect(review.score).toBeGreaterThanOrEqual(0);
    expect(review.score).toBeLessThanOrEqual(100);
    expect(review.verdict).toBe("pass");
  });
  it("keeps the three candidates visibly distinct", () => {
    const variants = buildCandidateVariants(testParams);
    expect(new Set(variants.map((item) => JSON.stringify(item.params))).size).toBe(3);
    const temperatures = variants.map((item) => item.params.temperature);
    const saturation = variants.map((item) => item.params.saturation);
    expect(Math.max(...temperatures) - Math.min(...temperatures)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...saturation) - Math.min(...saturation)).toBeGreaterThanOrEqual(10);
  });
  it("scales every candidate parameter between weak, medium and strong intensity", () => {
    const low = scaleParamsForStrength(testParams, "low");
    const medium = scaleParamsForStrength(testParams, "medium");
    const high = scaleParamsForStrength(testParams, "high");
    expect(low.exposure).toBeLessThan(medium.exposure);
    expect(medium.exposure).toBeLessThan(high.exposure);
    expect(low.dehaze).toBeLessThan(medium.dehaze);
    expect(medium.dehaze).toBeLessThan(high.dehaze);
  });
  it("builds three bounded variants", () => {
    const base = testParams;
    const variants = buildCandidateVariants(base);
    expect(variants.map((item) => item.id)).toEqual(["A", "B", "C"]);
    for (const variant of variants) {
      expect(() => colorParamsSchema.parse(variant.params)).not.toThrow();
    }
  });
});

describe("live provider configuration", () => {
  it("enables the live provider when Vercel OIDC is available", () => {
    const snapshot = snapshotEnvironment();
    try {
      process.env.AI_PROVIDER = "openai";
      delete process.env.OPENAI_API_KEY;
      process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";
      expect(getProvider().name).toBe("openai-compatible");
    } finally {
      restoreEnvironment(snapshot);
    }
  });

  it("uses Vercel AI Gateway and Qwen 3.8 Flash with OIDC", async () => {
    const snapshot = snapshotEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ params: testParams, rationale: "测试修正" }) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      process.env.AI_PROVIDER = "openai";
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_BASE_URL;
      delete process.env.OPENAI_MODEL;
      process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";

      const output = await new OpenAICompatibleProvider().refine({
        prompt: "电影感绿调",
        strength: "medium",
        params: testParams,
        findings: ["降低高光溢出。"],
        iteration: 0,
      });

      expect(output.provider).toBe("openai-compatible");
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://ai-gateway.vercel.sh/v1/chat/completions");
      expect(new Headers(init.headers).get("Authorization")).toBe("Bearer test-oidc-token");
      expect(JSON.parse(String(init.body))).toMatchObject({
        model: "alibaba/qwen3.8-flash",
        response_format: { type: "json_object" },
      });
    } finally {
      vi.unstubAllGlobals();
      restoreEnvironment(snapshot);
    }
  });
  it("does not reuse Vercel OIDC for DashScope without an API key", () => {
    const snapshot = snapshotEnvironment();
    try {
      process.env.AI_PROVIDER = "openai";
      delete process.env.OPENAI_API_KEY;
      process.env.OPENAI_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
      process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";
      expect(getProvider().name).toBe("mock");
    } finally {
      restoreEnvironment(snapshot);
    }
  });

  it("uses a DashScope API key and model in direct mode", async () => {
    const snapshot = snapshotEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ params: testParams, rationale: "直连测试" }) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      process.env.AI_PROVIDER = "openai";
      process.env.OPENAI_API_KEY = "test-dashscope-key";
      process.env.OPENAI_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
      process.env.OPENAI_MODEL = "qwen3.8-flash";
      process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";

      await new OpenAICompatibleProvider().refine({
        prompt: "日系通透",
        strength: "medium",
        params: testParams,
        findings: ["降低高光。"],
        iteration: 0,
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
      expect(new Headers(init.headers).get("Authorization")).toBe("Bearer test-dashscope-key");
      expect(JSON.parse(String(init.body))).toMatchObject({ model: "qwen3.8-flash" });
    } finally {
      vi.unstubAllGlobals();
      restoreEnvironment(snapshot);
    }
  });});