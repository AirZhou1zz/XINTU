import { describe, expect, it } from "vitest";
import { runBoundedAgent } from "@/lib/agent/loop";
import type { ColorParams, EvaluationResult } from "@/lib/color/types";

const params = (exposure: number): ColorParams => ({
  exposure,
  contrast: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  clarity: 0,
  dehaze: 0,
  grain: 0,
  vignette: 0,
  skinWarmth: 0,
  skyTemperature: 0,
});

const evaluation = (pass: boolean): EvaluationResult => ({
  pass,
  deltaE: pass ? 2 : 30,
  skinShift: 0,
  skyShift: 0,
  structureScore: 1,
  clippingRatio: 0,
  schemaValid: true,
  findings: pass ? [] : ["需要修正"],
  nextAction: pass ? "accept" : "refine",
});

describe("bounded agent loop", () => {
  it("stops immediately when the first evaluation passes", async () => {
    let refineCalls = 0;
    const result = await runBoundedAgent({
      initialParams: params(0),
      evaluate: () => evaluation(true),
      refine: async () => {
        refineCalls += 1;
        return { params: params(0), rationale: "should not run" };
      },
    });
    expect(result.iterations).toBe(0);
    expect(refineCalls).toBe(0);
  });

  it("refines until passing", async () => {
    let current = 0;
    const result = await runBoundedAgent({
      initialParams: params(0),
      evaluate: () => evaluation(current >= 1),
      refine: async () => {
        current += 1;
        return { params: params(current), rationale: "收敛参数" };
      },
    });
    expect(result.iterations).toBe(1);
    expect(result.params.exposure).toBe(1);
    expect(result.evaluation.pass).toBe(true);
  });

  it("never exceeds the maximum refinement count", async () => {
    let current = 0;
    const result = await runBoundedAgent({
      initialParams: params(0),
      evaluate: () => evaluation(false),
      refine: async () => {
        current += 1;
        return { params: params(current), rationale: "继续修正" };
      },
      maxRefinements: 2,
    });
    expect(result.iterations).toBe(2);
    expect(current).toBe(2);
    expect(result.evaluation.pass).toBe(false);
  });
});
