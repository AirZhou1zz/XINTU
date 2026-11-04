import { z } from "zod";
import { colorParamsSchema } from "@/lib/color/schema";

const imageDataUrl = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i, "Unsupported image payload");

export const analyzeRequestSchema = z
  .object({
    prompt: z.string().trim().min(2).max(500),
    strength: z.enum(["low", "medium", "high"]),
    imageDataUrl,
    referenceDataUrl: imageDataUrl.optional(),
    sceneHints: z
      .object({
        averageLuma: z.number().min(0).max(1),
        clippingRatio: z.number().min(0).max(1),
      })
      .optional(),
  })
  .strict();

export const refineRequestSchema = z
  .object({
    prompt: z.string().trim().min(2).max(500),
    strength: z.enum(["low", "medium", "high"]),
    params: colorParamsSchema,
    findings: z.array(z.string().min(1).max(220)).min(1).max(8),
    iteration: z.number().int().min(0).max(2),
    mode: z.enum(["auto", "manual"]).optional(),
  })
  .strict();

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type RefineRequest = z.infer<typeof refineRequestSchema>;
