import type { EvaluationResult, RgbaImage, SceneHints } from "./types";

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

export function deltaE2000(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number },
) {
  const pow25to7 = 25 ** 7;
  const c1 = Math.hypot(lab1.a, lab1.b);
  const c2 = Math.hypot(lab2.a, lab2.b);
  const cBar = (c1 + c2) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + pow25to7)));
  const a1p = (1 + g) * lab1.a;
  const a2p = (1 + g) * lab2.a;
  const c1p = Math.hypot(a1p, lab1.b);
  const c2p = Math.hypot(a2p, lab2.b);
  const h1p = (Math.atan2(lab1.b, a1p) * 180 / Math.PI + 360) % 360;
  const h2p = (Math.atan2(lab2.b, a2p) * 180 / Math.PI + 360) % 360;
  const deltaLp = lab2.l - lab1.l;
  const deltaCp = c2p - c1p;
  const deltaHp = c1p * c2p === 0
    ? 0
    : Math.abs(h2p - h1p) <= 180
      ? h2p - h1p
      : h2p <= h1p
        ? h2p - h1p + 360
        : h2p - h1p - 360;
  const deltaHpPrime = 2 * Math.sqrt(c1p * c2p) * Math.sin((deltaHp * Math.PI) / 360);
  const lBarP = (lab1.l + lab2.l) / 2;
  const cBarP = (c1p + c2p) / 2;
  const hBarP = c1p * c2p === 0
    ? h1p + h2p
    : Math.abs(h1p - h2p) <= 180
      ? (h1p + h2p) / 2
      : h1p + h2p < 360
        ? (h1p + h2p + 360) / 2
        : (h1p + h2p - 360) / 2;
  const t = 1
    - 0.17 * Math.cos(((hBarP - 30) * Math.PI) / 180)
    + 0.24 * Math.cos((2 * hBarP * Math.PI) / 180)
    + 0.32 * Math.cos(((3 * hBarP + 6) * Math.PI) / 180)
    - 0.20 * Math.cos(((4 * hBarP - 63) * Math.PI) / 180);
  const deltaTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt(cBarP ** 7 / (cBarP ** 7 + pow25to7));
  const sl = 1 + (0.015 * (lBarP - 50) ** 2) / Math.sqrt(20 + (lBarP - 50) ** 2);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin((2 * deltaTheta * Math.PI) / 180) * rc;
  return Math.sqrt(
    (deltaLp / sl) ** 2
    + (deltaCp / sc) ** 2
    + (deltaHpPrime / sh) ** 2
    + rt * (deltaCp / sc) * (deltaHpPrime / sh),
  );
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
      deltaESum += deltaE2000(
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

export function getSceneHints(image: RgbaImage): SceneHints {
  let luma = 0;
  let clipped = 0;
  let sampled = 0;
  let skin = 0;
  let sky = 0;
  let nature = 0;
  let water = 0;

  for (let index = 0; index < image.data.length; index += 16) {
    const pixel = index / 4;
    const y = Math.floor(pixel / image.width);
    const r = image.data[index];
    const g = image.data[index + 1];
    const b = image.data[index + 2];
    luma += lumaOf(r, g, b);
    if (r <= 2 || g <= 2 || b <= 2 || r >= 253 || g >= 253 || b >= 253) clipped += 1;
    if (isSkin(r, g, b)) skin += 1;
    if (y < image.height * 0.55 && isSky(r, g, b)) sky += 1;
    if (g > 62 && g > r * 1.06 && g > b * 1.01) nature += 1;
    if (b > 70 && b > r * 1.1 && b > g * 1.025) water += 1;
    sampled += 1;
  }

  const total = Math.max(1, sampled);
  return {
    averageLuma: luma / total,
    clippingRatio: clipped / total,
    skinRatio: skin / total,
    skyRatio: sky / total,
    natureRatio: nature / total,
    waterRatio: water / total,
    aspectRatio: image.width / Math.max(1, image.height),
  };
}
