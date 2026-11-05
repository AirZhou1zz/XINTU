import type { CandidateDirection, CandidateStyle, ColorParams } from "@/lib/color/types";

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

const stylePatches: Record<CandidateStyle, Partial<ColorParams>> = {
  natural: { exposure: 5, contrast: 7, saturation: 8, clarity: 4, highlights: -6, shadows: 6 },
  warm_film: { temperature: 24, tint: 8, saturation: 20, contrast: 5, highlights: -14, shadows: 12, grain: 9, vignette: -10 },
  airy: { exposure: 12, contrast: -2, temperature: -6, saturation: 10, highlights: -8, shadows: 10, dehaze: 22, clarity: 10, vignette: -4 },
  cinematic: { temperature: -6, contrast: 18, highlights: -28, shadows: 22, clarity: -10, grain: 8, vignette: -14, saturation: -8, tint: 10 },
  vivid: { temperature: 7, contrast: 16, saturation: 34, clarity: 12, dehaze: 10, highlights: -8, shadows: 6 },
  soft: { exposure: 5, contrast: -8, highlights: -20, shadows: 18, clarity: -11, grain: 4, saturation: 4 },
};

const fallbackDirections: CandidateDirection[] = [
  { id: "A", label: "自然平衡", description: "优先保护肤色和结构，整体更耐看。", style: "natural" },
  { id: "B", label: "参考氛围", description: "更贴近参考图的色温与色彩关系。", style: "warm_film" },
  { id: "C", label: "柔光电影", description: "更柔和的高光与更轻的中间调对比。", style: "cinematic" },
];

export const buildCandidateVariants = (base: ColorParams, directions: CandidateDirection[] = fallbackDirections) => {
  const selected = directions.length === 3 ? directions : fallbackDirections;
  return selected.map((direction) => ({
    id: direction.id,
    label: direction.label,
    description: direction.description,
    params: tune(base, stylePatches[direction.style]),
  }));
};