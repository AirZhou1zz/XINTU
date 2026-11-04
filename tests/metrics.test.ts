import { describe, expect, it } from "vitest";
import { evaluateImage } from "@/lib/color/metrics";
import type { RgbaImage } from "@/lib/color/types";

const image = (pixels: number[]): RgbaImage => ({
  width: 2,
  height: 2,
  data: new Uint8ClampedArray(pixels),
});

const neutral = image([
  100, 100, 100, 255,
  120, 120, 120, 255,
  140, 140, 140, 255,
  160, 160, 160, 255,
]);

describe("image metrics", () => {
  it("passes an identical deterministic result", () => {
    const result = evaluateImage(neutral, neutral, null);
    expect(result.pass).toBe(true);
    expect(result.structureScore).toBe(1);
    expect(result.skinShift).toBe(0);
    expect(result.skyShift).toBe(0);
  });

  it("computes zero deltaE against an identical reference", () => {
    const result = evaluateImage(neutral, neutral, neutral);
    expect(result.deltaE).toBeCloseTo(0, 5);
  });

  it("detects strong clipping", () => {
    const clipped = image([
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ]);
    const result = evaluateImage(neutral, clipped, null);
    expect(result.clippingRatio).toBe(1);
    expect(result.pass).toBe(false);
  });

  it("rejects a non-identical transformed structure", () => {
    const reverse = image([
      200, 50, 50, 255,
      20, 200, 20, 255,
      40, 40, 220, 255,
      20, 20, 20, 255,
    ]);
    const result = evaluateImage(neutral, reverse, null);
    expect(result.structureScore).toBeLessThan(0.82);
    expect(result.pass).toBe(false);
  });
});
