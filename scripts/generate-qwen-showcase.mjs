import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  REVIEW_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildAnalyzePrompt,
  buildRefinePrompt,
  buildReviewPrompt,
} from "../lib/ai/prompt.ts";
import { renderColorGrade } from "../lib/color/engine.ts";
import { evaluateImage, getSceneHints } from "../lib/color/metrics.ts";
import {
  buildCandidateVariants,
  paramsAtReferenceStrength,
  scaleParamsForStrength,
} from "../lib/agent/candidates.ts";

const root = process.cwd();
const sourceDir = "C:/Users/Administrator/Desktop/sucai";
const outputDir = path.join(root, "public", "portfolio", "showcase");
const metadataPath = path.join(outputDir, "qwen-cases.json");
const maxRenderDimension = 1200;
const analysisDimension = 900;

const cases = [
  {
    id: "street",
    title: "电影照片 · 油画感街道",
    prompt: "电影照片-油画感街道",
    file: "电影.jpg",
    strength: "high",
  },
  {
    id: "portrait",
    title: "人像照片 · 日系明亮柔和",
    prompt: "人像照片-日系明亮柔和人像",
    file: "人像.jpg",
    strength: "medium",
  },
  {
    id: "landscape",
    title: "山湖风光 · 震撼感",
    prompt: "风景-山湖风光，震撼感",
    file: "风景.jpg",
    strength: "high",
  },
];

const parameterKeys = [
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
const sceneCategories = new Set(["portrait", "landscape", "ocean", "mountain", "night", "city", "still_life", "other"]);
const candidateStyles = new Set(["natural", "warm_film", "airy", "cinematic", "vivid", "soft"]);

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2];
  }
}

function env(name) {
  return process.env[name]?.trim() || undefined;
}

function providerConfig() {
  const token = env("OPENAI_API_KEY");
  const baseUrl = (env("OPENAI_BASE_URL") || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");
  const model = env("OPENAI_MODEL") || "qwen3.8-flash";
  if (!token) throw new Error("OPENAI_API_KEY is not configured");
  if (!baseUrl.includes("dashscope.aliyuncs.com")) throw new Error("This showcase must run through DashScope");
  if (model !== "qwen3.8-flash") throw new Error(`Unexpected model: ${model}`);
  return { token, baseUrl, model };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return a JSON object");
  return JSON.parse(raw.slice(start, end + 1));
}

function providerError(body) {
  try {
    const parsed = JSON.parse(body);
    const message = typeof parsed.error === "string" ? parsed.error : parsed.error?.message;
    if (message) return String(message).slice(0, 300);
  } catch {}
  return body.replace(/\s+/g, " ").trim().slice(0, 300);
}

async function requestJson(messages) {
  const { token, baseUrl, model } = providerConfig();
  const timeoutMs = Number(env("AI_TIMEOUT_MS") || 55000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (!response.ok) {
      throw new Error(`Qwen returned ${response.status}: ${providerError(await response.text())}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Qwen returned empty content");
    return extractJson(content);
  } finally {
    clearTimeout(timeout);
  }
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric parameter: ${value}`);
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeParams(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Missing parameter object");
  return Object.fromEntries(parameterKeys.map((key) => {
    const value = Number(raw[key]);
    return [key, clamp(value, key === "grain" ? 0 : -100, 100)];
  }));
}

function normalizeAnalyze(raw) {
  const plan = raw?.plan;
  if (!plan || typeof plan !== "object") throw new Error("Qwen response is missing plan");
  if (!sceneCategories.has(plan.sceneCategory)) throw new Error(`Invalid scene category: ${plan.sceneCategory}`);
  if (!Array.isArray(plan.directions) || plan.directions.length !== 3) throw new Error("Qwen must return exactly 3 directions");
  if (!Array.isArray(plan.tools) || plan.tools.length < 1 || plan.tools.length > 4) throw new Error("Qwen must return 1-4 tools");
  const ids = plan.directions.map((item) => item?.id).sort().join("");
  if (ids !== "ABC") throw new Error("Qwen direction ids must be A, B and C");
  for (const direction of plan.directions) {
    if (!candidateStyles.has(direction.style)) throw new Error(`Invalid candidate style: ${direction.style}`);
  }
  return {
    plan: {
      intent: String(plan.intent || ""),
      sceneSummary: String(plan.sceneSummary || ""),
      sceneCategory: plan.sceneCategory,
      sceneConfidence: Number(plan.sceneConfidence),
      directions: plan.directions.map((direction) => ({
        id: direction.id,
        label: String(direction.label),
        description: String(direction.description),
        style: direction.style,
      })),
      tools: plan.tools.map(String),
      constraints: Array.isArray(plan.constraints) ? plan.constraints.map(String) : [],
    },
    params: normalizeParams(raw.params),
  };
}

function normalizeReview(raw) {
  return {
    verdict: raw?.verdict === "pass" ? "pass" : "needs_work",
    score: clamp(Number(raw?.score), 0, 100),
    summary: String(raw?.summary || ""),
    strengths: Array.isArray(raw?.strengths) ? raw.strengths.slice(0, 4).map(String) : [],
    issues: Array.isArray(raw?.issues) ? raw.issues.slice(0, 4).map(String) : [],
    nextActions: Array.isArray(raw?.nextActions) ? raw.nextActions.slice(0, 4).map(String) : [],
  };
}

async function analyze(prompt, imageDataUrl, strength) {
  return normalizeAnalyze(await requestJson([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: buildAnalyzePrompt(prompt, strength) },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ]));
}

async function refine(prompt, params, findings, iteration) {
  const raw = await requestJson([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildRefinePrompt(prompt, params, findings) },
  ]);
  return {
    params: normalizeParams(raw?.params),
    rationale: String(raw?.rationale || `第 ${iteration + 1} 轮参数修正`),
  };
}

async function review(prompt, imageDataUrl, evaluation) {
  const raw = await requestJson([
    { role: "system", content: REVIEW_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: buildReviewPrompt(prompt, evaluation) },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ]);
  return normalizeReview(raw);
}

async function imagePayload(image) {
  return sharp(Buffer.from(image.data), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .resize({ width: analysisDimension, height: analysisDimension, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
    .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`);
}

async function writeWebp(image, file) {
  await sharp(Buffer.from(image.data), {
    raw: { width: image.width, height: image.height, channels: 4 },
  }).webp({ quality: 90, effort: 6 }).toFile(file);
}

async function loadCase(sourceFile) {
  const sourcePath = path.join(sourceDir, sourceFile);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing source image: ${sourcePath}`);
  const normalized = await sharp(sourcePath)
    .rotate()
    .resize({ width: maxRenderDimension, height: maxRenderDimension, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();
  const { data, info } = await sharp(normalized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    image: {
      width: info.width,
      height: info.height,
      data: new Uint8ClampedArray(data),
    },
  };
}

async function main() {
  loadEnv(path.join(root, ".env.local"));
  const { model } = providerConfig();
  fs.mkdirSync(outputDir, { recursive: true });
  const results = [];

  for (const item of cases) {
    console.log(`\n[${item.id}] Analyzing ${item.file} with ${model}...`);
    const { image } = await loadCase(item.file);
    const beforePath = path.join(outputDir, `${item.id}-before.webp`);
    await writeWebp(image, beforePath);
    const analysisImage = await imagePayload(image);
    const hints = getSceneHints(image);
    const analyzed = await analyze(item.prompt, analysisImage, item.strength);

    let params = analyzed.params;
    let evaluation = evaluateImage(image, renderColorGrade(image, params), null, true, analyzed.plan.sceneCategory);
    let iterations = 0;
    const refinementHistory = [];
    while (!evaluation.pass && iterations < 2) {
      console.log(`[${item.id}] refinement ${iterations + 1}/2: ${evaluation.findings[0] || "converge parameters"}`);
      const refined = await refine(item.prompt, params, evaluation.findings, iterations);
      params = refined.params;
      iterations += 1;
      evaluation = evaluateImage(image, renderColorGrade(image, params), null, true, analyzed.plan.sceneCategory);
      refinementHistory.push({ iteration: iterations, rationale: refined.rationale, findings: evaluation.findings });
    }

    const referenceBase = paramsAtReferenceStrength(params, item.strength);
    const variants = buildCandidateVariants(referenceBase, analyzed.plan.directions).map((variant) => {
      const finalParams = scaleParamsForStrength(variant.params, item.strength);
      const pixels = renderColorGrade(image, finalParams);
      const candidateEvaluation = evaluateImage(image, pixels, null, true, analyzed.plan.sceneCategory);
      return { ...variant, params: finalParams, pixels, evaluation: candidateEvaluation };
    });

    const candidates = [];
    for (const variant of variants) {
      const letter = variant.id.toLowerCase();
      const imagePath = path.join(outputDir, `${item.id}-${letter}.webp`);
      await writeWebp(variant.pixels, imagePath);
      const candidateImagePayload = await imagePayload(variant.pixels);
      console.log(`[${item.id}] Qwen visual review ${variant.id}: ${variant.label}`);
      const visualReview = await review(item.prompt, candidateImagePayload, variant.evaluation);
      candidates.push({
        id: variant.id,
        label: variant.label,
        description: variant.description,
        style: variant.style,
        params: variant.params,
        evaluation: variant.evaluation,
        review: visualReview,
        image: `/portfolio/showcase/${item.id}-${letter}.webp`,
      });
    }

    const recommended = [...candidates].sort((a, b) => b.review.score - a.review.score)[0];
    const result = {
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      strength: item.strength,
      provider: "qwen-openai-compatible",
      model,
      endpoint: "DashScope",
      generatedAt: new Date().toISOString(),
      sceneHints: hints,
      plan: analyzed.plan,
      autoRefinements: iterations,
      finalEvaluation: evaluation,
      refinementHistory,
      candidates,
      recommendedCandidateId: recommended.id,
      before: `/portfolio/showcase/${item.id}-before.webp`,
    };
    results.push(result);
    console.log(`[${item.id}] Recommended ${recommended.id} · score ${recommended.review.score}`);
  }

  fs.writeFileSync(metadataPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    model: providerConfig().model,
    endpoint: "DashScope",
    cases: results,
  }, null, 2));
  console.log(`\nShowcase written to ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
