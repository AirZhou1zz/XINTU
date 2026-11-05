import type { SceneHints } from "@/lib/color/types";

export const SYSTEM_PROMPT = `You are a bounded color grading planner. You never generate pixels or change image content. Analyze the user intent and image, infer the scene, choose at most 4 tools, and return strict JSON only.

Scene categories: portrait, landscape, ocean, mountain, night, city, still_life, other.
Candidate styles: natural, warm_film, airy, cinematic, vivid, soft.
If the user intent is vague, rely primarily on the image. A small person inside a street, road, car or building scene does not make the photo a portrait; classify it as city when the environment is the dominant subject. Portrait is only for images where a person is clearly the main subject. The three directions must fit the detected scene and remain meaningfully different.

Allowed tools: global_grade, skin_protect, sky_balance, hsl, curve, lut, texture.

Return exactly this shape:
{
  "plan": {
    "intent": "short summary",
    "sceneSummary": "short image assessment",
    "sceneCategory": "portrait",
    "sceneConfidence": 0.85,
    "directions": [
      { "id": "A", "label": "自然肤质", "description": "short direction", "style": "natural" },
      { "id": "B", "label": "暖调胶片", "description": "short direction", "style": "warm_film" },
      { "id": "C", "label": "清透柔光", "description": "short direction", "style": "soft" }
    ],
    "tools": ["global_grade"],
    "constraints": ["no pixel generation"]
  },
  "params": {
    "exposure": 0,
    "contrast": 0,
    "temperature": 0,
    "tint": 0,
    "saturation": 0,
    "highlights": 0,
    "shadows": 0,
    "clarity": 0,
    "dehaze": 0,
    "grain": 0,
    "vignette": 0,
    "skinWarmth": 0,
    "skyTemperature": 0
  }
}

Directions must contain exactly A, B and C. All numeric parameters must be between -100 and 100, except grain which is 0 to 100. Keep edits conservative and preserve structure.`;

export function buildAnalyzePrompt(prompt: string, strength: string, hints?: SceneHints) {
  const auxiliaryHints = hints
    ? {
        averageLuma: hints.averageLuma,
        clippingRatio: hints.clippingRatio,
        skyRatio: hints.skyRatio,
        natureRatio: hints.natureRatio,
        waterRatio: hints.waterRatio,
        aspectRatio: hints.aspectRatio,
        temperatureBias: hints.temperatureBias,
      }
    : {};
  return `User intent: ${prompt}\nStrength: ${strength}\nAuxiliary image hints: ${JSON.stringify(auxiliaryHints)}\nSkin-color ratios are intentionally omitted because they are unreliable for subject classification. Decide the scene and dominant subject from the image itself. A person inside a street, car or building scene must not make it a portrait unless the person is visually dominant.\nReturn only the JSON object.`;
}

export function buildRefinePrompt(prompt: string, params: unknown, findings: string[]) {
  return `User intent: ${prompt}\nCurrent params: ${JSON.stringify(params)}\nEvaluation findings: ${JSON.stringify(findings)}\nReturn only JSON with {"params": {...}, "rationale": "..."}. Stay within the same parameter ranges.`;
}

export const REVIEW_SYSTEM_PROMPT = `You are a bounded visual color-grading reviewer. Do not generate or edit pixels. Review the rendered result against the user intent and optional reference. Return strict JSON only with this shape:
{
  "verdict": "pass" or "needs_work",
  "score": 0-100,
  "summary": "short assessment",
  "strengths": ["up to 3"],
  "issues": ["up to 3"],
  "nextActions": ["up to 3"]
}
Focus on color harmony, skin preservation, sky handling, clipping, structure, and whether the result matches the intent.`;

export function buildReviewPrompt(
  prompt: string,
  heuristics: unknown,
) {
  return `User intent: ${prompt}\nDeterministic metrics: ${JSON.stringify(heuristics)}\nThe first image is the rendered result. Return only the JSON object.`;
}