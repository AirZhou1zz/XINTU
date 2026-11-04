"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, SlidersHorizontal, Timer, X } from "lucide-react";
import type { ColorParams, EvaluationResult } from "@/lib/color/types";
import type { StudioConversationMessage } from "@/components/studio/use-studio";

const groups: Array<{
  label: string;
  controls: Array<{ key: keyof ColorParams; label: string; min: number; max: number }>;
}> = [
  {
    label: "光线与色彩",
    controls: [
      { key: "exposure", label: "曝光", min: -100, max: 100 },
      { key: "contrast", label: "对比度", min: -100, max: 100 },
      { key: "temperature", label: "色温", min: -100, max: 100 },
      { key: "tint", label: "色调", min: -100, max: 100 },
      { key: "saturation", label: "饱和度", min: -100, max: 100 },
      { key: "highlights", label: "高光", min: -100, max: 100 },
      { key: "shadows", label: "阴影", min: -100, max: 100 },
    ],
  },
  {
    label: "细节与质感",
    controls: [
      { key: "clarity", label: "清晰度", min: -100, max: 100 },
      { key: "dehaze", label: "去朦胧", min: -100, max: 100 },
      { key: "grain", label: "颗粒", min: 0, max: 100 },
      { key: "vignette", label: "暗角", min: -100, max: 100 },
    ],
  },
  {
    label: "区域保护",
    controls: [
      { key: "skinWarmth", label: "肤色暖度", min: -100, max: 100 },
      { key: "skyTemperature", label: "天空色温", min: -100, max: 100 },
    ],
  },
];

type ManualParameterPanelProps = {
  open: boolean;
  params: ColorParams;
  aiParams: ColorParams;
  evaluation: EvaluationResult;
  iterations: number;
  elapsedMs: number | null;
  manualRefinements: number;
  conversation: StudioConversationMessage[];
  busy: boolean;
  onChange: (key: keyof ColorParams, value: number) => void;
  onReset: () => void;
  onClose: () => void;
  onAccept: () => void;
  onExport: () => void;
  onFeedback: (message: string) => Promise<boolean>;
};

export function ManualParameterPanel({
  open,
  params,
  aiParams,
  evaluation,
  iterations,
  elapsedMs,
  manualRefinements,
  conversation,
  busy,
  onChange,
  onReset,
  onClose,
  onAccept,
  onExport,
  onFeedback,
}: ManualParameterPanelProps) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const valuesUnchanged = Object.keys(params).every(
    (key) => params[key as keyof ColorParams] === aiParams[key as keyof ColorParams],
  );
  const duration = elapsedMs === null ? "—" : elapsedMs >= 1000 ? `${(elapsedMs / 1000).toFixed(1)}s` : `${elapsedMs}ms`;

  return (
    <div className="xintu-parameter-layer" role="dialog" aria-modal="true" aria-label="参数微调">
      <button className="xintu-parameter-backdrop" type="button" aria-label="关闭参数微调" onClick={onClose} />
      <aside id="xintu-parameter-panel" className="xintu-parameter-panel">
        <header className="xintu-parameter-header">
          <div>
            <span className="xintu-parameter-kicker">MANUAL CONTROL / 13 PARAMS</span>
            <h2><SlidersHorizontal size={19} /> 继续微调</h2>
          </div>
          <button type="button" className="xintu-parameter-close" onClick={onClose} aria-label="关闭参数微调">
            <X size={18} />
          </button>
        </header>

        <div className="xintu-parameter-status">
          <span className={evaluation.pass ? "is-pass" : "is-warn"}>
            {evaluation.pass ? <Check size={13} /> : <Timer size={13} />}
            {evaluation.pass ? "当前候选通过阈值" : "仍有指标偏差"}
          </span>
          <span>实时更新画布</span>
        </div>

        <div className="xintu-parameter-metrics">
          <div><span>ΔE LAB</span><strong>{evaluation.deltaE === null ? "无参考" : evaluation.deltaE.toFixed(1)}</strong></div>
          <div><span>肤色偏移</span><strong>{evaluation.skinShift.toFixed(1)}</strong></div>
          <div><span>天空偏移</span><strong>{evaluation.skyShift.toFixed(1)}</strong></div>
          <div><span>结构保持</span><strong>{(evaluation.structureScore * 100).toFixed(1)}%</strong></div>
          <div><span>参数合法率</span><strong>{evaluation.schemaValid ? "100%" : "0%"}</strong></div>
          <div><span>耗时 · 修正</span><strong>{duration} / 自动{iterations}轮 · 手动{manualRefinements}次</strong></div>
        </div>

<div className="xintu-parameter-scroll">
        <section className="xintu-feedback">
          <div className="xintu-feedback-heading">
            <span>CONTINUE WITH XINTU</span>
            <strong>还不满意？继续说</strong>
          </div>
          <div className="xintu-feedback-log" aria-live="polite">
            {conversation.length === 0 ? (
              <p>直接说“更暖一点”“肤色再自然一点”或“高光柔和一些”。</p>
            ) : conversation.slice(-4).map((item, index) => (
              <p className={item.role === "user" ? "is-user" : "is-assistant"} key={`${item.role}-${index}-${item.text}`}>
                {item.text}
              </p>
            ))}
          </div>
          <div className="xintu-feedback-chips" aria-label="快捷反馈">
            {["更暖一点", "更冷一点", "更自然一点", "更通透一点", "高光柔和一点", "胶片感强一点"].map((item) => (
              <button type="button" key={item} onClick={() => setFeedback(item)}>{item}</button>
            ))}
          </div>
          <div className="xintu-feedback-composer">
            <textarea
              value={feedback}
              maxLength={220}
              placeholder="例如：整体再自然一点，肤色不要偏红"
              aria-label="继续描述你想改进的地方"
              onChange={(event) => setFeedback(event.target.value)}
            />
            <button
              type="button"
              disabled={busy || !feedback.trim()}
              onClick={async () => {
                const message = feedback.trim();
                if (!message) return;
                const success = await onFeedback(message);
                if (success) setFeedback("");
              }}
            >
              {busy ? "改进中…" : "继续改进"}
            </button>
          </div>
        </section>
{groups.map((group) => (
            <section className="xintu-parameter-group" key={group.label}>
              <h3>{group.label}</h3>
              {group.controls.map((control) => {
                const value = params[control.key];
                const aiValue = aiParams[control.key];
                return (
                  <label className="xintu-range-row" key={control.key}>
                    <span className="xintu-range-label">
                      <span>{control.label}<small>AI {Math.round(aiValue)}</small></span>
                      <strong>{Math.round(value)}</strong>
                    </span>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={1}
                      value={value}
                      aria-label={control.label}
                      onChange={(event) => onChange(control.key, Number(event.target.value))}
                    />
                  </label>
                );
              })}
            </section>
          ))}
        </div>

        <footer className="xintu-parameter-actions">
          <button type="button" className="xintu-parameter-reset" onClick={onReset} disabled={valuesUnchanged}>
            <RotateCcw size={15} /> 恢复 AI 原值
          </button>
          <button type="button" className="xintu-parameter-accept" onClick={onAccept}>应用当前参数</button>
          <button type="button" className="xintu-parameter-export" onClick={onExport}>导出 PNG</button>
        </footer>
      </aside>
    </div>
  );
}