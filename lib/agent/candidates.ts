import type { ColorParams } from "@/lib/color/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function tune(base: ColorParams, patch: Partial<ColorParams>): ColorParams {
  return {
    exposure: clamp(base.exposure + (patch.exposure ?? 0), -100, 100),
    contrast: clamp(base.contrast + (patch.contrast ?? 0), -100, 100),
    temperature: clamp(base.temperature + (patch.temperature ?? 0), -100, 100),
    tint: clamp(base.tint + (patch.tint ?? 0), -100, 100),
    saturation: clamp(base.saturation + (patch.saturation ?? 0), -100, 100),
    highlights: clamp(base.highlights + (patch.highlights ?? 0), -100, 100),
    shadows: clamp(base.shadows + (patch.shadows ?? 0), -100, 100),
    clarity: clamp(base.clarity + (patch.clarity ?? 0), -100, 100),
    dehaze: clamp(base.dehaze + (patch.dehaze ?? 0), -100, 100),
    grain: clamp(base.grain + (patch.grain ?? 0), 0, 100),
    vignette: clamp(base.vignette + (patch.vignette ?? 0), -100, 100),
    skinWarmth: clamp(base.skinWarmth + (patch.skinWarmth ?? 0), -100, 100),
    skyTemperature: clamp(base.skyTemperature + (patch.skyTemperature ?? 0), -100, 100),
  };
}

export const buildCandidateVariants = (base: ColorParams) => [
  {
    id: "A" as const,
    label: "自然平衡",
    description: "优先保护肤色和结构，整体更耐看。",
    params: tune(base, { saturation: -2, clarity: -1 }),
  },
  {
    id: "B" as const,
    label: "参考氛围",
    description: "更贴近参考图的色温与色彩关系。",
    params: tune(base, { temperature: 4, tint: 2, saturation: 3, contrast: 2 }),
  },
  {
    id: "C" as const,
    label: "柔光电影",
    description: "更柔和的高光与更轻的中间调对比。",
    params: tune(base, { highlights: -4, shadows: 3, clarity: -4, grain: 2, vignette: -2 }),
  },
];
