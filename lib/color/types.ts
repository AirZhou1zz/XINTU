
export const TOOL_IDS = [
  "global_grade",
  "skin_protect",
  "sky_balance",
  "hsl",
  "curve",
  "lut",
  "texture",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type Strength = "low" | "medium" | "high";

export type ColorParams = {
  exposure: number;
  contrast: number;
  temperature: number;
  tint: number;
  saturation: number;
  highlights: number;
  shadows: number;
  clarity: number;
  dehaze: number;
  grain: number;
  vignette: number;
  skinWarmth: number;
  skyTemperature: number;
};

export const COLOR_PARAM_KEYS: Array<keyof ColorParams> = [
  "exposure",
  "contrast",
  "temperature",
  "tint",
  "saturation",
  "highlights",
  "shadows",
  "clarity",
  "dehaze",
  "grain",
  "vignette",
  "skinWarmth",
  "skyTemperature",
];

export type AgentPlan = {
  intent: string;
  sceneSummary: string;
  tools: ToolId[];
  constraints: string[];
};

export type EvaluationResult = {
  pass: boolean;
  deltaE: number | null;
  skinShift: number;
  skyShift: number;
  structureScore: number;
  clippingRatio: number;
  schemaValid: boolean;
  findings: string[];
  nextAction: "accept" | "refine" | "degrade";
};

export type Candidate = {
  id: "A" | "B" | "C";
  label: string;
  description: string;
  params: ColorParams;
  aiParams: ColorParams;
  pixels: RgbaImage;
  imageUrl: string;
  evaluation: EvaluationResult;
};

export type TraceStatus = "idle" | "running" | "passed" | "warning" | "error";

export type TraceStep = {
  id: "plan" | "apply" | "evaluate" | "refine";
  label: string;
  status: TraceStatus;
  detail: string;
};

export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};



