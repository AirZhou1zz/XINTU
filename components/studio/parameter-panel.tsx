"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { ColorParams } from "@/lib/color/types";

const controls: Array<{ key: keyof ColorParams; label: string; min: number; max: number }> = [
  { key: "exposure", label: "曝光", min: -100, max: 100 },
  { key: "contrast", label: "对比度", min: -100, max: 100 },
  { key: "temperature", label: "色温", min: -100, max: 100 },
  { key: "tint", label: "色调", min: -100, max: 100 },
  { key: "saturation", label: "饱和度", min: -100, max: 100 },
  { key: "highlights", label: "高光", min: -100, max: 100 },
  { key: "shadows", label: "阴影", min: -100, max: 100 },
  { key: "clarity", label: "清晰度", min: -100, max: 100 },
  { key: "dehaze", label: "去朦胧", min: -100, max: 100 },
  { key: "grain", label: "颗粒", min: 0, max: 100 },
  { key: "vignette", label: "暗角", min: -100, max: 100 },
  { key: "skinWarmth", label: "肤色暖度", min: -100, max: 100 },
  { key: "skyTemperature", label: "天空色温", min: -100, max: 100 },
];

type ParameterPanelProps = {
  params: ColorParams;
  aiParams: ColorParams;
  onChange: (key: keyof ColorParams, value: number) => void;
  onReset: () => void;
};

export function ParameterPanel({ params, aiParams, onChange, onReset }: ParameterPanelProps) {
  return (
    <section className="panel-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">MANUAL CONTROL</span>
          <h2>继续微调</h2>
        </div>
        <SlidersHorizontal size={17} className="heading-icon" />
      </div>
      <div className="parameter-list">
        {controls.map((control) => {
          const value = params[control.key];
          return (
            <label key={control.key} className="parameter-row">
              <span>
                {control.label}
                <em>{Math.round(value)}</em>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={1}
                value={value}
                onChange={(event) => onChange(control.key, Number(event.target.value))}
                aria-label={control.label}
              />
            </label>
          );
        })}
      </div>
      <button
        type="button"
        className="ghost-button full-width"
        onClick={onReset}
        disabled={Object.keys(params).every((key) => params[key as keyof ColorParams] === aiParams[key as keyof ColorParams])}
      >
        <RotateCcw size={15} />
        恢复 AI 原值
      </button>
    </section>
  );
}
