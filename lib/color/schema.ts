import { z } from "zod";
import { TOOL_IDS } from "./types";

const bounded = (min: number, max: number) => z.coerce.number().min(min).max(max);

const sceneCategorySchema = z.enum(["portrait", "landscape", "ocean", "mountain", "night", "city", "still_life", "other"]);
const candidateStyleSchema = z.enum(["natural", "warm_film", "airy", "cinematic", "vivid", "soft"]);
const candidateDirectionSchema = z.object({
  id: z.enum(["A", "B", "C"]),
  label: z.string().min(1).max(40),
  description: z.string().min(1).max(160),
  style: candidateStyleSchema,
}).strict();
export const colorParamsSchema = z
  .object({
    exposure: bounded(-100, 100),
    contrast: bounded(-100, 100),
    temperature: bounded(-100, 100),
    tint: bounded(-100, 100),
    saturation: bounded(-100, 100),
    highlights: bounded(-100, 100),
    shadows: bounded(-100, 100),
    clarity: bounded(-100, 100),
    dehaze: bounded(-100, 100),
    grain: bounded(0, 100),
    vignette: bounded(-100, 100),
    skinWarmth: bounded(-100, 100),
    skyTemperature: bounded(-100, 100),
  })
  .strict();

export const toolIdSchema = z.enum(TOOL_IDS);

export const agentPlanSchema = z
  .object({
    intent: z.string().min(1).max(240),
    sceneSummary: z.string().min(1).max(500),
    sceneCategory: sceneCategorySchema,
    sceneConfidence: z.number().min(0).max(1),
    directions: z.array(candidateDirectionSchema).length(3),
    tools: z.array(toolIdSchema).min(1).max(4),
    constraints: z.array(z.string().min(1).max(180)).max(8),
  })
  .strict();

export const analyzeResponseSchema = z
  .object({
    plan: agentPlanSchema,
    params: colorParamsSchema,
    provider: z.enum(["mock", "openai-compatible"]),
  })
  .strict();

export const refineResponseSchema = z
  .object({
    params: colorParamsSchema,
    rationale: z.string().min(1).max(600),
    provider: z.enum(["mock", "openai-compatible"]),
  })
  .strict();

export function clampColorParams(input: unknown) {
  return colorParamsSchema.parse(input);
}
