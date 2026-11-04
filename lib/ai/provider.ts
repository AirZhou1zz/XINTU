import type { AgentPlan, ColorParams, Strength } from "@/lib/color/types";
import { MockProvider } from "./mock-provider";
import { hasLiveProviderCredentials, OpenAICompatibleProvider } from "./openai-compatible";

export type ProviderName = "mock" | "openai-compatible";

export type AnalyzeInput = {
  prompt: string;
  strength: Strength;
  imageDataUrl: string;
  referenceDataUrl?: string;
  sceneHints?: {
    averageLuma: number;
    clippingRatio: number;
  };
};

export type RefineInput = {
  prompt: string;
  strength: Strength;
  params: ColorParams;
  findings: string[];
  iteration: number;
  mode?: "auto" | "manual";
};

export type AnalyzeOutput = {
  plan: AgentPlan;
  params: ColorParams;
  provider: ProviderName;
};

export type RefineOutput = {
  params: ColorParams;
  rationale: string;
  provider: ProviderName;
};

export interface ColorProvider {
  readonly name: ProviderName;
  analyze(input: AnalyzeInput): Promise<AnalyzeOutput>;
  refine(input: RefineInput): Promise<RefineOutput>;
}

export function getProvider(): ColorProvider {
  if (process.env.AI_PROVIDER === "openai" && hasLiveProviderCredentials()) {
    return new OpenAICompatibleProvider();
  }
  return new MockProvider();
}

export async function analyzeWithFallback(input: AnalyzeInput): Promise<AnalyzeOutput> {
  try {
    return await getProvider().analyze(input);
  } catch (error) {
    console.warn("Live provider failed, falling back to mock:", error instanceof Error ? error.message : "unknown");
    return new MockProvider().analyze(input);
  }
}

export async function refineWithFallback(input: RefineInput): Promise<RefineOutput> {
  try {
    return await getProvider().refine(input);
  } catch (error) {
    console.warn("Live refine failed, falling back to mock:", error instanceof Error ? error.message : "unknown");
    return new MockProvider().refine(input);
  }
}