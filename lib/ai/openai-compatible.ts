import { analyzeResponseSchema, colorParamsSchema, refineResponseSchema } from "@/lib/color/schema";
import { visualReviewSchema } from "@/lib/agent/visual-review";
import type { ReviewInput, VisualReview } from "@/lib/agent/visual-review";
import type { AnalyzeInput, AnalyzeOutput, ColorProvider, RefineInput, RefineOutput } from "./provider";
import { REVIEW_SYSTEM_PROMPT, SYSTEM_PROMPT, buildAnalyzePrompt, buildRefinePrompt, buildReviewPrompt } from "./prompt";

type ChatMessage = {
  role: "system" | "user";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

type ProviderConfig = {
  token: string;
  baseUrl: string;
  model: string;
};

function environmentValue(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function isVercelGateway(baseUrl: string) {
  return baseUrl.includes("ai-gateway.vercel.sh");
}

export function hasLiveProviderCredentials() {
  const apiKey = environmentValue("OPENAI_API_KEY");
  const gatewayApiKey = environmentValue("AI_GATEWAY_API_KEY");
  const oidcToken = environmentValue("VERCEL_OIDC_TOKEN");
  const configuredBaseUrl = environmentValue("OPENAI_BASE_URL");
  return Boolean(apiKey || gatewayApiKey || (oidcToken && (!configuredBaseUrl || isVercelGateway(configuredBaseUrl))));
}

export function getProviderConfig(): ProviderConfig {
  const apiKey = environmentValue("OPENAI_API_KEY");
  const gatewayApiKey = environmentValue("AI_GATEWAY_API_KEY");
  const oidcToken = environmentValue("VERCEL_OIDC_TOKEN");
  const configuredBaseUrl = environmentValue("OPENAI_BASE_URL");
  const canUseGatewayOidc = !apiKey && !gatewayApiKey && Boolean(oidcToken) && (!configuredBaseUrl || isVercelGateway(configuredBaseUrl));
  const token = apiKey || gatewayApiKey || (canUseGatewayOidc ? oidcToken : undefined);
  if (!token) throw new Error("No matching live AI provider credentials are configured");

  const usingGateway = Boolean(gatewayApiKey) || canUseGatewayOidc;
  const baseUrl = (configuredBaseUrl || (usingGateway ? "https://ai-gateway.vercel.sh/v1" : "https://api.openai.com/v1")).replace(/\/+$/, "");
  const usingDashScope = baseUrl.includes("dashscope.aliyuncs.com");
  const model = environmentValue("OPENAI_MODEL")
    || (usingGateway ? "alibaba/qwen3.8-flash" : usingDashScope ? "qwen3.8-flash" : "gpt-4.1-mini");

  return { token, baseUrl, model };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return JSON");
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

function providerErrorMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } | string };
    const message = typeof parsed.error === "string" ? parsed.error : parsed.error?.message;
    if (typeof message === "string" && message.trim()) return message.trim().slice(0, 240);
  } catch {
    // Fall back to a compact text excerpt below.
  }
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function requestJson(messages: ChatMessage[]) {
  const { token, baseUrl, model } = getProviderConfig();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (!response.ok) {
      const detail = providerErrorMessage(await response.text());
      throw new Error(`Provider returned ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Provider returned empty content");
    return extractJson(content);
  } finally {
    clearTimeout(timeout);
  }
}

export class OpenAICompatibleProvider implements ColorProvider {
  readonly name = "openai-compatible" as const;

  async analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    const userContent: ChatMessage["content"] = [
      { type: "text", text: buildAnalyzePrompt(input.prompt, input.strength, input.sceneHints) },
      { type: "image_url", image_url: { url: input.imageDataUrl } },
    ];
    if (input.referenceDataUrl) {
      userContent.push({ type: "text", text: "Reference image follows." });
      userContent.push({ type: "image_url", image_url: { url: input.referenceDataUrl } });
    }
    const raw = await requestJson([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]);
    if (typeof raw !== "object" || raw === null) throw new Error("Provider returned invalid JSON");
    return analyzeResponseSchema.parse({ ...(raw as Record<string, unknown>), provider: this.name });
  }

  async refine(input: RefineInput): Promise<RefineOutput> {
    const raw = await requestJson([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildRefinePrompt(input.prompt, input.params, input.findings) },
    ]);
    const record = raw as { params?: unknown; rationale?: unknown };
    return refineResponseSchema.parse({
      params: colorParamsSchema.parse(record.params),
      rationale: typeof record.rationale === "string" ? record.rationale : "已根据评估结果修正参数。",
      provider: this.name,
    });
  }
  async review(input: ReviewInput): Promise<VisualReview> {
    const content: ChatMessage["content"] = [
      { type: "text", text: buildReviewPrompt(input.prompt, input.heuristics) },
      { type: "image_url", image_url: { url: input.imageDataUrl } },
    ];
    if (input.referenceDataUrl) {
      content.push({ type: "text", text: "Reference image follows." });
      content.push({ type: "image_url", image_url: { url: input.referenceDataUrl } });
    }
    const raw = await requestJson([
      { role: "system", content: REVIEW_SYSTEM_PROMPT },
      { role: "user", content },
    ]);
    return visualReviewSchema.parse({ ...(raw as Record<string, unknown>), provider: this.name });
  }}
