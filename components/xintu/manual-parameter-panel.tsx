"use client";

import { useState } from "react";
import { Check, RotateCcw, ScanEye, SlidersHorizontal, Star, Timer } from "lucide-react";
import type { ColorParams, EvaluationResult } from "@/lib/color/types";
import type { StudioConversationMessage } from "@/components/studio/use-studio";
import type { VisualReview } from "@/lib/agent/visual-review";

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
  params: ColorParams;
  aiParams: ColorParams;
  evaluation: EvaluationResult;
  iterations: number;
  elapsedMs: number | null;
  manualRefinements: number;
  conversation: StudioConversationMessage[];
  busy: boolean;
  visualReview: VisualReview | null;
  isReviewing: boolean;
  subjectiveScore: number | null;
  onSubjectiveScore: (score: number) => void;
  onChange: (key: keyof ColorParams, value: number) => void;
  onReset: () => void;
  onAccept: () => void;
  onExport: () => void;
  onFeedback: (message: string) => Promise<boolean>;
};

export function ManualParameterPanel({
  params,
  aiParams,
  evaluation,
  iterations,
  elapsedMs,
  manualRefinements,
  conversation,
  busy,
  visualReview,
  isReviewing,
  subjectiveScore,
  onSubjectiveScore,
  onChange,
  onReset,
  onAccept,
  onExport,
  onFeedback,
}: ManualParameterPanelProps) {
  const [feedback, setFeedback] = useState("");
  const valuesUnchanged = Object.keys(params).every(
    (key) => params[key as keyof ColorParams] === aiParams[key as keyof ColorParams],
  );
  const duration = elapsedMs === null ? "—" : elapsedMs >= 1000 ? `${(elapsedMs / 1000).toFixed(1)}s` : `${elapsedMs}ms`;

  return (
    <aside id="xintu-parameter-panel" className="xintu-parameter-panel" aria-label="实时参数微调">
      <header className="xintu-parameter-header">
        <div>
          <span className="xintu-parameter-kicker">AGENT CONTROL / LIVE</span>
          <h2><SlidersHorizontal size={19} /> 实时微调</h2>
        </div>
      </header>

      <div className="xintu-parameter-status">
        <span className={evaluation.pass ? "is-pass" : "is-warn"}>
          {evaluation.pass ? <Check size={13} /> : <Timer size={13} />}
          {evaluation.pass ? "当前候选通过阈值" : "仍有指标偏差"}
        </span>
        <span>拖动即更新画面</span>
      </div>

      <div className="xintu-parameter-metrics">
        <div><span>ΔE2000</span><strong>{evaluation.deltaE === null ? "无参考" : evaluation.deltaE.toFixed(1)}</strong></div>
        <div><span>肤色偏移</span><strong>{evaluation.skinShift.toFixed(1)}</strong></div>
        <div><span>天空偏移</span><strong>{evaluation.skyShift.toFixed(1)}</strong></div>
        <div><span>结构保持</span><strong>{(evaluation.structureScore * 100).toFixed(1)}%</strong></div>
        <div><span>参数合法率</span><strong>{evaluation.schemaValid ? "100%" : "0%"}</strong></div>
        <div><span>耗时 · 修正</span><strong>{duration} / 自动{iterations}轮 · 手动{manualRefinements}次</strong></div>
      </div>

      <div className="xintu-parameter-scroll">
        <section className="xintu-visual-review">
          <div className="xintu-visual-review-head">
            <div>
              <span>AGENT VISUAL REVIEW</span>
              <strong>视觉模型复核</strong>
            </div>
            <ScanEye size={16} />
          </div>
          {isReviewing ? (
            <p className="xintu-visual-review-empty">Agent 正在复核当前画面，完成后自动更新结果。</p>
          ) : visualReview ? (
            <div className="xintu-visual-review-result">
              <div className="xintu-visual-review-score">
                <strong>{Math.round(visualReview.score)}</strong>
                <span>{visualReview.verdict === "pass" ? "PASS" : "NEEDS WORK"} · {visualReview.provider === "mock" ? "LOCAL REVIEW" : "QWEN REVIEW"}</span>
              </div>
              <p>{visualReview.summary}</p>
              {visualReview.issues.length > 0 ? <ul>{visualReview.issues.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul> : null}
              {visualReview.nextActions.length > 0 ? <small>建议：{visualReview.nextActions[0]}</small> : null}
            </div>
          ) : (
            <p className="xintu-visual-review-empty">生成结果后会自动进行视觉复核，无需手动触发。</p>
          )}
        </section>

        <section className="xintu-subjective-rating">
          <div>
            <span>YOUR SCORE</span>
            <strong>你的主观评分</strong>
          </div>
          <div className="xintu-rating-stars" aria-label="主观评分">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                type="button"
                key={score}
                className={subjectiveScore !== null && score <= subjectiveScore ? "is-active" : ""}
                aria-label={`${score} 分`}
                aria-pressed={subjectiveScore === score}
                onClick={() => onSubjectiveScore(score)}
              >
                <Star size={15} fill="currentColor" />
              </button>
            ))}
          </div>
          <small>仅记录当前会话中的个人判断，不参与自动评估。</small>
        </section>

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
  );
}