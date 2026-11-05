import { describe, expect, it } from "vitest";
import { renderColorGrade } from "@/lib/color/engine";
import { buildCandidateVariants } from "@/lib/agent/candidates";
import type { ColorParams, RgbaImage } from "@/lib/color/types";

const baseParams: ColorParams = {
  exposure: 0,
  contrast: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  clarity: 0,
  dehaze: 0,
  grain: 0,
  vignette: 0,
  skinWarmth: 0,
  skyTemperature: 0,
};

function image(): RgbaImage {
  return {
    width: 3,
    height: 2,
    data: new Uint8ClampedArray([
      120, 90, 70, 255,
      70, 100, 150, 255,
      110, 110, 110, 255,
      240, 200, 180, 255,
      50, 60, 70, 255,
      128, 128, 128, 255,
    ]),
  };
}

describe("color engine", () => {
  it("is identity when params are zero", () => {
    const source = image();
    const result = renderColorGrade(source, baseParams);
    expect(Array.from(result.data)).toEqual(Array.from(source.data));
  });

  it("is deterministic", () => {
    const source = image();
    const params = { ...baseParams, exposure: 8, saturation: 10, grain: 12 };
    expect(Array.from(renderColorGrade(source, params).data)).toEqual(Array.from(renderColorGrade(source, params).data));
  });

  it("changes warm skin pixels more than neutral pixels for skin warmth", () => {
    const source = image();
    const result = renderColorGrade(source, { ...baseParams, skinWarmth: 20 });
    const skinDiff = result.data[0] - source.data[0];
    const neutralDiff = result.data[20] - source.data[20];
    expect(Math.abs(skinDiff)).toBeGreaterThan(Math.abs(neutralDiff));
  });

  it("renders candidate directions with a visibly stronger difference", () => {
    const source = image();
    const variants = buildCandidateVariants(baseParams);
    const rendered = variants.map((variant) => renderColorGrade(source, variant.params));
    const channelDistance = (left: RgbaImage, right: RgbaImage) => {
      let total = 0;
      let channels = 0;
      for (let index = 0; index < left.data.length; index += 4) {
        total += Math.abs(left.data[index] - right.data[index]);
        total += Math.abs(left.data[index + 1] - right.data[index + 1]);
        total += Math.abs(left.data[index + 2] - right.data[index + 2]);
        channels += 3;
      }
      return total / Math.max(1, channels);
    };

    for (const result of rendered) {
      expect(channelDistance(source, result)).toBeGreaterThan(2.5);
    }
    expect(channelDistance(rendered[0], rendered[1])).toBeGreaterThan(3);
    expect(channelDistance(rendered[1], rendered[2])).toBeGreaterThan(3);
  });
  it("preserves alpha", () => {
    const source = image();
    const result = renderColorGrade(source, { ...baseParams, exposure: 10 });
    for (let index = 3; index < result.data.length; index += 4) {
      expect(result.data[index]).toBe(255);
    }
  });
});
