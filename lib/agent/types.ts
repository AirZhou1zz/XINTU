import type { z } from "zod";
import type { analyzeResponseSchema } from "@/lib/color/schema";

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
