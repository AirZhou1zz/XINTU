import { z } from "zod";

const imageDataUrl = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i, "Unsupported image payload");

export const reviewRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(500),
  imageDataUrl,
  referenceDataUrl: imageDataUrl.optional(),
  heuristics: z.object({
    pass: z.boolean(),
    deltaE: z.number().nullable(),
    skinShift: z.number(),
    skyShift: z.number(),
    structureScore: z.number(),
    clippingRatio: z.number(),
    schemaValid: z.boolean(),
    findings: z.array(z.string()).max(8),
  }).strict(),
}).strict();

export const visualReviewSchema = z.object({
  provider: z.enum(["mock", "openai-compatible"]),
  verdict: z.enum(["pass", "needs_work"]),
  score: z.number().min(0).max(100),
  summary: z.string().min(1).max(500),
  strengths: z.array(z.string().min(1).max(180)).max(4),
  issues: z.array(z.string().min(1).max(180)).max(4),
  nextActions: z.array(z.string().min(1).max(180)).max(4),
}).strict();

export type ReviewInput = z.infer<typeof reviewRequestSchema>;
export type VisualReview = z.infer<typeof visualReviewSchema>;