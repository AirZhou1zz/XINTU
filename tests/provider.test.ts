import { describe, expect, it, vi } from "vitest";
import { buildCandidateVariants } from "@/lib/agent/candidates";
import { MockProvider } from "@/lib/ai/mock-provider";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-compatible";
import { getProvider } from "@/lib/ai/provider";
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
      sceneHints: { averageLuma: 0.45, clippingRatio: 0.02 },
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