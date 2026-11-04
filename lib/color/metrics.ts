import type { EvaluationResult, RgbaImage } from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lumaOf = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function isSkin(r: number, g: number, b: number) {
  return r > 60 && r > g * 1.04 && r > b * 1.08 && g > b * 0.72 && r - Math.min(g, b) > 14;
}

function isSky(r: number, g: number, b: number) {
  return b > 64 && b > r * 1.04 && b > g * 0.94;
}

function toLinear(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function rgbToLab(r: number, g: number, b: number) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const pivot = (value: number) => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116);
  const fx = pivot(x);
  const fy = pivot(y);
  const fz = pivot(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function deltaE76(a: { l: number; a: number; b: number }, b: { l: number; a: number; b: number }) {
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

export function evaluateImage(
  original: RgbaImage,
  result: RgbaImage,
  reference: RgbaImage | null,
  schemaValid = true,
): EvaluationResult {
  const originalData = original.data;
  const resultData = result.data;
  const refData = reference?.data ?? null;
  const sampleStep = 4;
  let sampled = 0;
  let skinCount = 0;
  let skyCount = 0;
  let skinDelta = 0;
  let skyDelta = 0;
  let clipped = 0;
  let deltaESum = 0;
  let deltaECount = 0;
  let originalLumaSum = 0;
  let resultLumaSum = 0;
  let originalLumaSq = 0;
  let resultLumaSq = 0;
  let lumaProduct = 0;

  for (let index = 0; index < resultData.length; index += 4 * sampleStep) {
    const r0 = originalData[index];
    const g0 = originalData[index + 1];
    const b0 = originalData[index + 2];
    const r1 = resultData[index];
    const g1 = resultData[index + 1];
    const b1 = resultData[index + 2];
    const l0 = lumaOf(r0, g0, b0);
    const l1 = lumaOf(r1, g1, b1);
    sampled += 1;
    originalLumaSum += l0;
    resultLumaSum += l1;
    originalLumaSq += l0 * l0;
    resultLumaSq += l1 * l1;
    lumaProduct += l0 * l1;

    if (r1 <= 2 || g1 <= 2 || b1 <= 2 || r1 >= 253 || g1 >= 253 || b1 >= 253) clipped += 1;

    if (isSkin(r0, g0, b0)) {
      skinCount += 1;
      skinDelta += (Math.abs(r1 - r0) + Math.abs(g1 - g0) + Math.abs(b1 - b0)) / 3;
    }

    if (isSky(r0, g0, b0)) {
      skyCount += 1;
      skyDelta += (Math.abs(r1 - r0) + Math.abs(g1 - g0) + Math.abs(b1 - b0)) / 3;
    }

    if (refData) {
      const refIndex = Math.min(index, refData.length - 4);
      deltaESum += deltaE76(
        rgbToLab(refData[refIndex], refData[refIndex + 1], refData[refIndex + 2]),
        rgbToLab(r1, g1, b1),
      );
      deltaECount += 1;
    }
  }

  const mean0 = originalLumaSum / Math.max(1, sampled);
  const mean1 = resultLumaSum / Math.max(1, sampled);
  const variance0 = originalLumaSq / Math.max(1, sampled) - mean0 * mean0;
  const variance1 = resultLumaSq / Math.max(1, sampled) - mean1 * mean1;
  const covariance = lumaProduct / Math.max(1, sampled) - mean0 * mean1;
  const denominator = Math.sqrt(Math.max(0, variance0) * Math.max(0, variance1));
  const structureScore = clamp01(denominator > 1e-8 ? covariance / denominator : mean0 === mean1 ? 1 : 0);
  const skinShift = (skinDelta / Math.max(1, skinCount)) / 2.55;
  const skyShift = (skyDelta / Math.max(1, skyCount)) / 2.55;
  const clippingRatio = clipped / Math.max(1, sampled);
  const deltaE = deltaECount > 0 ? deltaESum / deltaECount : null;
  const findings: string[] = [];

  if (!schemaValid) findings.push("参数 schema 未通过，已触发安全降级。");
  if (skinShift > 18) findings.push("肤色区域偏移偏大，需要降低橙色饱和度和暖色偏移。");
  if (skyShift > 18) findings.push("天空区域偏移偏大，需要收敛蓝色通道和色温。");
  if (clippingRatio > 0.08) findings.push("高光或阴影剪切偏多，需要降低曝光和对比。");
  if (structureScore < 0.82) findings.push("结构保持不足，需要降低清晰度和强对比调整。");
  if (deltaE !== null && deltaE > 24) findings.push("与参考图的色彩距离偏大，需要继续向参考氛围收敛。");

  const pass = findings.length === 0;
  return {
    pass,
    deltaE,
    skinShift,
    skyShift,
    structureScore,
    clippingRatio,
    schemaValid,
    findings,
    nextAction: pass ? "accept" : "refine",
  };
}

export function getSceneHints(image: RgbaImage) {
  let luma = 0;
  let clipped = 0;
  let sampled = 0;
  for (let index = 0; index < image.data.length; index += 16) {
    const r = image.data[index];
    const g = image.data[index + 1];
    const b = image.data[index + 2];
    luma += lumaOf(r, g, b);
    if (r <= 2 || g <= 2 || b <= 2 || r >= 253 || g >= 253 || b >= 253) clipped += 1;
    sampled += 1;
  }
  return {
    averageLuma: luma / Math.max(1, sampled),
    clippingRatio: clipped / Math.max(1, sampled),
  };
}
