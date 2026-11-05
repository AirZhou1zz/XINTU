import type { AgentPlan, ColorParams, SceneHints, Strength } from "@/lib/color/types";
import { reconcileScenePlan } from "@/lib/agent/scene";
import { MockProvider } from "./mock-provider";
import { hasLiveProviderCredentials, OpenAICompatibleProvider } from "./openai-compatible";
import type { ReviewInput, VisualReview } from "@/lib/agent/visual-review";

export type ProviderName = "mock" | "openai-compatible";

export type AnalyzeInput = {
  prompt: string;
  strength: Strength;
  imageDataUrl: string;
  referenceDataUrl?: string;
  sceneHints?: SceneHints;
  forceMock?: boolean;
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
  review(input: ReviewInput): Promise<VisualReview>;
}

export function getProvider(): ColorProvider {
  if (process.env.AI_PROVIDER === "openai" && hasLiveProviderCredentials()) {
    return new OpenAICompatibleProvider();
  }
  return new MockProvider();
}

function applySceneGuard(result: AnalyzeOutput, input: AnalyzeInput): AnalyzeOutput {
  return {
    ...result,
    plan: reconcileScenePlan(result.plan, input.sceneHints, input.prompt),
  };
}

export async function analyzeWithFallback(input: AnalyzeInput): Promise<AnalyzeOutput> {
  if (input.forceMock) {
    return applySceneGuard(await new MockProvider().analyze(input), input);
  }
  try {
    return applySceneGuard(await getProvider().analyze(input), input);
  } catch (error) {
    console.warn("Live provider failed, falling back to mock:", error instanceof Error ? error.message : "unknown");
    return applySceneGuard(await new MockProvider().analyze(input), input);
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

export async function reviewWithFallback(input: ReviewInput): Promise<VisualReview> {
  try {
    return await getProvider().review(input);
  } catch (error) {
    console.warn("Live visual review failed, falling back to mock:", error instanceof Error ? error.message : "unknown");
    return new MockProvider().review(input);
  }
}