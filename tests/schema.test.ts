import { describe, expect, it } from "vitest";
import { analyzeRequestSchema } from "@/lib/agent/schema";
import { colorParamsSchema } from "@/lib/color/schema";

const params = {
  exposure: 0,
  contrast: 4,
  temperature: 2,
  tint: 0,
  saturation: 3,
  highlights: -5,
  shadows: 5,
  clarity: 2,
  dehaze: 1,
  grain: 2,
  vignette: -2,
  skinWarmth: 1,
  skyTemperature: -1,
};

describe("color schema", () => {
  it("accepts valid parameters", () => {
    expect(colorParamsSchema.parse(params)).toEqual(params);
  });

  it("rejects out-of-range parameters", () => {
    expect(() => colorParamsSchema.parse({ ...params, exposure: 101 })).toThrow();
    expect(() => colorParamsSchema.parse({ ...params, grain: -1 })).toThrow();
  });

  it("rejects unknown payload fields", () => {
    expect(() =>
      analyzeRequestSchema.parse({
        prompt: "日系通透",
        strength: "medium",
        imageDataUrl: `data:image/jpeg;base64,${Buffer.from("test").toString("base64")}`,
        extra: true,
      }),
    ).toThrow();
  });
});
