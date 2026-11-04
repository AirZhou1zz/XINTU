import type { ColorParams, EvaluationResult } from "@/lib/color/types";

export type AgentLoopStep = {
  iteration: number;
  params: ColorParams;
  evaluation: EvaluationResult;
  rationale?: string;
};

export type AgentLoopResult = {
  params: ColorParams;
  evaluation: EvaluationResult;
  iterations: number;
  steps: AgentLoopStep[];
};

type RefineResult = {
  params: ColorParams;
  rationale: string;
};

type RunBoundedAgentInput = {
  initialParams: ColorParams;
  evaluate: (params: ColorParams) => EvaluationResult;
  refine: (params: ColorParams, evaluation: EvaluationResult, iteration: number) => Promise<RefineResult>;
  maxRefinements?: number;
  onEvaluate?: (evaluation: EvaluationResult, iteration: number) => void;
  onRefine?: (result: RefineResult, iteration: number) => void;
};

export async function runBoundedAgent({
  initialParams,
  evaluate,
  refine,
  maxRefinements = 2,
  onEvaluate,
  onRefine,
}: RunBoundedAgentInput): Promise<AgentLoopResult> {
  let params = initialParams;
  let evaluation = evaluate(params);
  let iterations = 0;
  const steps: AgentLoopStep[] = [{ iteration: iterations, params, evaluation }];
  onEvaluate?.(evaluation, iterations);

  while (!evaluation.pass && iterations < maxRefinements) {
    const refined = await refine(params, evaluation, iterations);
    params = refined.params;
    iterations += 1;
    evaluation = evaluate(params);
    onRefine?.(refined, iterations);
    onEvaluate?.(evaluation, iterations);
    steps.push({
      iteration: iterations,
      params,
      evaluation,
      rationale: refined.rationale,
    });
  }

  return { params, evaluation, iterations, steps };
}

