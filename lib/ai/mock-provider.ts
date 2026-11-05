import type { AgentPlan, ColorParams, Strength } from "@/lib/color/types";
import { colorParamsSchema } from "@/lib/color/schema";
import { detectScene, directionsForScene, sceneLabels } from "@/lib/agent/scene";
import type { AnalyzeInput, AnalyzeOutput, ColorProvider, RefineInput, RefineOutput } from "./provider";
import type { ReviewInput, VisualReview } from "@/lib/agent/visual-review";

const scale: Record<Strength, number> = { low: 0.55, medium: 1, high: 1.25 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function planFor(input: AnalyzeInput, detected: ReturnType<typeof detectScene>): AgentPlan {
  const prompt = input.prompt.toLowerCase();
  const tools = new Set<AgentPlan["tools"][number]>(["global_grade"]);

  if (detected.category === "portrait") tools.add("skin_protect");
  if (["landscape", "ocean", "mountain", "night", "city"].includes(detected.category)) tools.add("sky_balance");
  if (["ocean", "mountain", "landscape"].includes(detected.category)) tools.add("hsl");
  if (prompt.includes("胶片") || prompt.includes("电影") || prompt.includes("参考")) tools.add("lut");
  if (prompt.includes("通透") || prompt.includes("去雾") || prompt.includes("雾") || detected.category === "night") tools.add("texture");

  const scene = input.sceneHints;
  const sceneSummary = scene
    ? `${sceneLabels[detected.category]}场景，平均亮度 ${(scene.averageLuma * 100).toFixed(0)}%，肤色区域 ${(scene.skinRatio * 100).toFixed(1)}%，天空区域 ${(scene.skyRatio * 100).toFixed(1)}%。`
    : `${sceneLabels[detected.category]}场景，依据画面语义采用稳健的全局校色策略。`;

  return {
    intent: input.prompt.slice(0, 180),
    sceneSummary,
    sceneCategory: detected.category,
    sceneConfidence: detected.confidence,
    directions: directionsForScene(detected.category, input.sceneHints, input.prompt),
    tools: Array.from(tools).slice(0, 4),
    constraints: ["不生成新像素", "保护画面结构", "最多修正 2 轮"],
  };
}

function baseParams(input: AnalyzeInput, category: AgentPlan["sceneCategory"]): ColorParams {
  const factor = scale[input.strength];
  const hints = input.sceneHints;
  const exposure = hints && hints.averageLuma < 0.38 ? 6 : hints && hints.averageLuma > 0.68 ? -4 : 1;
  const highlight = hints && hints.clippingRatio > 0.04 ? -10 : -5;
  const shadows = hints && hints.averageLuma < 0.38 ? 10 : 5;
  const portrait = category === "portrait";
  const outdoor = category === "landscape" || category === "ocean" || category === "mountain";
  const night = category === "night";
  const city = category === "city";
  return colorParamsSchema.parse({
    exposure: exposure * factor,
    contrast: (city ? 2 : -1) * factor,
    temperature: (night ? -2 : 4) * factor,
    tint: (night ? 4 : 1) * factor,
    saturation: (portrait ? 1 : outdoor ? 4 : 3) * factor,
    highlights: (night ? highlight - 4 : highlight) * factor,
    shadows: (night ? shadows + 4 : shadows) * factor,
    clarity: (portrait ? 0 : 2) * factor,
    dehaze: (outdoor || input.prompt.includes("通") ? 5 : 2) * factor,
    grain: (input.prompt.includes("胶片") || night ? 5 : 2) * factor,
    vignette: -2 * factor,
    skinWarmth: (portrait ? 3 : 0) * factor,
    skyTemperature: (outdoor || city ? -4 : -2) * factor,
  });
}

export class MockProvider implements ColorProvider {
  readonly name = "mock" as const;

  async analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    const detected = detectScene(input.sceneHints, input.prompt);
    return { plan: planFor(input, detected), params: baseParams(input, detected.category), provider: this.name };
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
    }
    if (joined.includes("肤色")) {
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

async review(input: ReviewInput): Promise<VisualReview> {
    const h = input.heuristics;
    const score = Math.round(clamp(
      100
        - h.skinShift * 1.25
        - h.skyShift * 1.05
        - (1 - h.structureScore) * 80
        - h.clippingRatio * 120
        - (h.deltaE ?? 0) * 1.2,
      0,
      100,
    ));
    const strengths = [
      h.structureScore >= 0.9 ? "画面结构保持良好" : "",
      h.skinShift <= 5 ? "肤色区域变化克制" : "",
      h.skyShift <= 5 ? "天空色彩关系稳定" : "",
      h.clippingRatio <= 0.03 ? "高光与阴影控制良好" : "",
    ].filter(Boolean);
    const issues = h.findings.length > 0
      ? h.findings.slice(0, 4)
      : score < 78 ? ["整体效果仍需进一步收敛"] : [];
    const nextActions = issues.length === 0
      ? ["可以继续微调，或直接导出当前候选"]
      : issues.slice(0, 3).map((issue) => `针对“${issue.slice(0, 48)}”继续降低调整幅度`);

    return {
      provider: "mock",
      verdict: h.pass && score >= 78 ? "pass" : "needs_work",
      score,
      summary: issues.length === 0
        ? "本地评估显示画面关系稳定，没有发现明显技术性偏差。"
        : "本地评估发现需要关注的画面关系，建议先处理最明显的一项偏差。",
      strengths: strengths.slice(0, 4),
      issues,
      nextActions,
    };
  }
}
