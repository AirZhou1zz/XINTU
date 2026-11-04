import type { ColorParams, RgbaImage } from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

function grainAt(x: number, y: number) {
  let n = Math.imul(x + 17, 374761393) + Math.imul(y + 31, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function isSkin(r: number, g: number, b: number) {
  return r > 60 && r > g * 1.04 && r > b * 1.08 && g > b * 0.72 && r - Math.min(g, b) > 14;
}

function isSky(r: number, g: number, b: number) {
  return b > 64 && b > r * 1.04 && b > g * 0.94;
}

export function renderColorGrade(source: RgbaImage, params: ColorParams): RgbaImage {
  const { width, height, data } = source;
  const output = new Uint8ClampedArray(data.length);
  const exposure = Math.pow(2, params.exposure / 100);
  const contrast = 1 + (params.contrast / 100) * 0.55;
  const saturation = 1 + (params.saturation / 100) * 0.8;
  const temperature = params.temperature / 100;
  const tint = params.tint / 100;
  const highlights = params.highlights / 100;
  const shadows = params.shadows / 100;
  const clarity = 1 + (params.clarity / 100) * 0.32;
  const dehaze = params.dehaze / 100;
  const grain = params.grain / 100;
  const vignette = params.vignette / 100;
  const skinWarmth = params.skinWarmth / 100;
  const skyTemperature = params.skyTemperature / 100;

  for (let index = 0; index < data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const sourceR = data[index] / 255;
    const sourceG = data[index + 1] / 255;
    const sourceB = data[index + 2] / 255;

    let r = sourceR * exposure;
    let g = sourceG * exposure;
    let b = sourceB * exposure;

    r += temperature * 0.11;
    g += temperature * 0.015;
    b -= temperature * 0.11;
    r += tint * 0.035;
    g -= tint * 0.06;
    b += tint * 0.035;

    r = (r - 0.5) * contrast + 0.5;
    g = (g - 0.5) * contrast + 0.5;
    b = (b - 0.5) * contrast + 0.5;

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const highlightWeight = smoothstep(0.48, 1, luma);
    const shadowWeight = 1 - smoothstep(0, 0.52, luma);
    const tonal = 1 + highlights * highlightWeight * 0.2 + shadows * shadowWeight * 0.24;
    r *= tonal;
    g *= tonal;
    b *= tonal;

    const midWeight = 1 - Math.min(1, Math.abs(luma - 0.5) * 1.7);
    const midTone = 1 + (clarity - 1) * midWeight + dehaze * 0.12;
    r = (r - 0.5) * midTone + 0.5 + dehaze * 0.025;
    g = (g - 0.5) * midTone + 0.5 + dehaze * 0.025;
    b = (b - 0.5) * midTone + 0.5 + dehaze * 0.025;

    const nextLuma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const saturationFactor = saturation + dehaze * 0.18;
    r = nextLuma + (r - nextLuma) * saturationFactor;
    g = nextLuma + (g - nextLuma) * saturationFactor;
    b = nextLuma + (b - nextLuma) * saturationFactor;

    if (isSkin(data[index], data[index + 1], data[index + 2])) {
      r += skinWarmth * 0.08;
      g += skinWarmth * 0.025;
      b -= skinWarmth * 0.035;
    }

    if (isSky(data[index], data[index + 1], data[index + 2])) {
      b -= skyTemperature * 0.075;
      r += skyTemperature * 0.035;
      g -= skyTemperature * 0.015;
    }

    if (vignette !== 0) {
      const nx = (x / Math.max(1, width - 1) - 0.5) * 2;
      const ny = (y / Math.max(1, height - 1) - 0.5) * 2;
      const radius = Math.min(1, Math.sqrt(nx * nx + ny * ny) / 1.414);
      const falloff = Math.max(0, (radius - 0.22) / 0.78);
      const factor = 1 - vignette * 0.42 * falloff * falloff;
      r *= factor;
      g *= factor;
      b *= factor;
    }

    if (grain > 0) {
      const noise = (grainAt(x, y) - 0.5) * grain * 0.075;
      r += noise;
      g += noise;
      b += noise;
    }

    output[index] = Math.round(clamp01(r) * 255);
    output[index + 1] = Math.round(clamp01(g) * 255);
    output[index + 2] = Math.round(clamp01(b) * 255);
    output[index + 3] = data[index + 3];
  }

  return { width, height, data: output };
}
