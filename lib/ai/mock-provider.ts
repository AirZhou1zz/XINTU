import type { AgentPlan, ColorParams, Strength } from "@/lib/color/types";
import { colorParamsSchema } from "@/lib/color/schema";
import type { AnalyzeInput, AnalyzeOutput, ColorProvider, RefineInput, RefineOutput } from "./provider";

const scale: Record<Strength, number> = { low: 0.55, medium: 1, high: 1.25 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function planFor(input: AnalyzeInput): AgentPlan {
  const prompt = input.prompt.toLowerCase();
  const tools = new Set<AgentPlan["tools"][number]>(["global_grade", "skin_protect"]);
  if (prompt.includes("天空") || prompt.includes("风景") || prompt.includes("旅行")) tools.add("sky_balance");
  if (prompt.includes("胶片") || prompt.includes("电影") || prompt.includes("参考")) tools.add("lut");
  if (prompt.includes("通透") || prompt.includes("去雾") || prompt.includes("雾")) tools.add("texture");
  if (prompt.includes("日系") || prompt.includes("清新") || prompt.includes("色彩")) tools.add("hsl");
  const scene = input.sceneHints;
  const sceneSummary = scene
    ? `平均亮度 ${(scene.averageLuma * 100).toFixed(0)}%，高光/阴影剪切 ${(scene.clippingRatio * 100).toFixed(1)}%。`
    : "等待画面分析，先采用稳健的全局校色策略。";

  return {
    intent: input.prompt.slice(0, 180),
    sceneSummary,
    tools: Array.from(tools).slice(0, 4),
    constraints: ["不生成新像素", "保护画面结构", "最多修正 2 轮"],
  };
}

function baseParams(input: AnalyzeInput): ColorParams {
  const factor = scale[input.strength];
  const hints = input.sceneHints;
  const exposure = hints && hints.averageLuma < 0.38 ? 6 : hints && hints.averageLuma > 0.68 ? -4 : 1;
  const highlight = hints && hints.clippingRatio > 0.04 ? -10 : -5;
  const shadows = hints && hints.averageLuma < 0.38 ? 10 : 5;
  return colorParamsSchema.parse({
    exposure: exposure * factor,
    contrast: -1 * factor,
    temperature: 4 * factor,
    tint: 1 * factor,
    saturation: 3 * factor,
    highlights: highlight * factor,
    shadows: shadows * factor,
    clarity: 2 * factor,
    dehaze: input.prompt.includes("通") ? 5 * factor : 2 * factor,
    grain: input.prompt.includes("胶片") ? 5 * factor : 2 * factor,
    vignette: -2 * factor,
    skinWarmth: 2 * factor,
    skyTemperature: -2 * factor,
  });
}

export class MockProvider implements ColorProvider {
  readonly name = "mock" as const;

  async analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    return { plan: planFor(input), params: baseParams(input), provider: this.name };
  }

  async refine(input: RefineInput): Promise<RefineOutput> {
    const next = { ...input.params };
    const joined = input.findings.join(" ");
    const manualFeedback = input.mode === "manual"
      ? input.prompt.split("追加反馈：").at(-1)?.trim() ?? input.prompt
      : "";

    if (manualFeedback) {
      if (manualFeedback.includes("暖")) {
        next.temperature = clamp(next.temperature + 7, -100, 100);
        next.skinWarmth = clamp(next.skinWarmth + 4, -100, 100);
      }
      if (manualFeedback.includes("冷")) {
        next.temperature = clamp(next.temperature - 7, -100, 100);
        next.tint = clamp(next.tint + 2, -100, 100);
      }
      if (manualFeedback.includes("自然")) {
        next.saturation = clamp(next.saturation - 5, -100, 100);
        next.contrast = clamp(next.contrast - 3, -100, 100);
        next.clarity = clamp(next.clarity - 3, -100, 100);
      }
      if (manualFeedback.includes("通透")) {
        next.dehaze = clamp(next.dehaze + 7, -100, 100);
        next.exposure = clamp(next.exposure + 2, -100, 100);
        next.clarity = clamp(next.clarity + 3, -100, 100);
      }
      if (manualFeedback.includes("胶片")) {
        next.grain = clamp(next.grain + 7, 0, 100);
        next.saturation = clamp(next.saturation - 3, -100, 100);
        next.highlights = clamp(next.highlights - 3, -100, 100);
      }
      if (manualFeedback.includes("高光")) next.highlights = clamp(next.highlights - 7, -100, 100);
      if (manualFeedback.includes("阴影")) next.shadows = clamp(next.shadows + 6, -100, 100);
      if (manualFeedback.includes("肤色") || manualFeedback.includes("皮肤")) {
        next.skinWarmth = clamp(next.skinWarmth - 5, -100, 100);
        next.saturation = clamp(next.saturation - 3, -100, 100);
      }
      if (manualFeedback.includes("颗粒")) next.grain = clamp(next.grain + 5, 0, 100);
      if (manualFeedback.includes("饱和")) {
        next.saturation = clamp(next.saturation + (manualFeedback.includes("不要") || manualFeedback.includes("降低") ? -7 : 5), -100, 100);
      }
      if (manualFeedback.includes("对比")) {
        next.contrast = clamp(next.contrast + (manualFeedback.includes("不要") || manualFeedback.includes("降低") ? -6 : 5), -100, 100);
      }
    }    if (joined.includes("肤色")) {
      next.skinWarmth = clamp(next.skinWarmth - 8, -100, 100);
      next.saturation = clamp(next.saturation - 6, -100, 100);
      next.temperature = clamp(next.temperature - 2, -100, 100);
    }
    if (joined.includes("天空")) {
      next.skyTemperature = clamp(next.skyTemperature - 8, -100, 100);
      next.saturation = clamp(next.saturation - 4, -100, 100);
    }
    if (joined.includes("剪切")) {
      next.exposure = clamp(next.exposure - 6, -100, 100);
      next.highlights = clamp(next.highlights - 8, -100, 100);
      next.shadows = clamp(next.shadows + 4, -100, 100);
      next.contrast = clamp(next.contrast - 3, -100, 100);
    }
    if (joined.includes("结构")) {
      next.clarity = clamp(next.clarity - 8, -100, 100);
      next.contrast = clamp(next.contrast - 3, -100, 100);
    }
    if (joined.includes("参考图")) {
      next.saturation = clamp(next.saturation - 3, -100, 100);
      next.contrast = clamp(next.contrast - 2, -100, 100);
    }
    return {
      params: colorParamsSchema.parse(next),
      rationale: input.mode === "manual" && manualFeedback
        ? `已根据“${manualFeedback.slice(0, 42)}”调整参数并重新评估。`
        : `第 ${input.iteration + 1} 轮修正：根据评估结果收敛了 ${input.findings[0] ?? "主要偏差"}。`,
      provider: this.name,
    };
  }
}
