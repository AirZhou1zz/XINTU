"use client";

import type { EvaluationResult } from "@/lib/color/types";

type EvaluationPanelProps = {
  evaluation: EvaluationResult;
  iterations: number;
};

export function EvaluationPanel({ evaluation, iterations }: EvaluationPanelProps) {
  const metrics = [
    { label: "ΔE LAB", value: evaluation.deltaE === null ? "—" : evaluation.deltaE.toFixed(1) },
    { label: "肤色偏移", value: evaluation.skinShift.toFixed(1) },
    { label: "天空偏移", value: evaluation.skyShift.toFixed(1) },
    { label: "结构保持", value: `${(evaluation.structureScore * 100).toFixed(1)}%` },
    { label: "剪切比例", value: `${(evaluation.clippingRatio * 100).toFixed(1)}%` },
    { label: "修正轮次", value: String(iterations) },
  ];

  return (
    <section className="panel-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">EVALUATION</span>
          <h2>结果验收</h2>
        </div>
        <span className={`verdict ${evaluation.pass ? "pass" : "warn"}`}>
          {evaluation.pass ? "PASS" : "NEEDS REFINE"}
        </span>
      </div>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-chip">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      {evaluation.findings.length > 0 ? (
        <ul className="findings-list">
          {evaluation.findings.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      ) : (
        <p className="evaluation-note">肤色、天空、结构与参数合法性均通过当前阈值。</p>
      )}
    </section>
  );
}
