"use client";

import { AlertTriangle, Check, Circle, LoaderCircle } from "lucide-react";
import type { TraceStep } from "@/lib/color/types";

const iconFor = (status: TraceStep["status"]) => {
  if (status === "passed") return <Check size={12} />;
  if (status === "running") return <LoaderCircle size={12} className="spin" />;
  if (status === "warning" || status === "error") return <AlertTriangle size={12} />;
  return <Circle size={9} />;
};

export function AgentTrace({ steps }: { steps: TraceStep[] }) {
  return (
    <section className="panel-section trace-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">AGENT TRACE</span>
          <h2>有界调色闭环</h2>
        </div>
        <span className="bounded-badge">MAX 2 REFINES</span>
      </div>
      <ol className="agent-trace" aria-live="polite">
        {steps.map((step) => (
          <li key={step.id} className={`trace-step ${step.status}`}>
            <span className="trace-rail" aria-hidden="true">
              <span className="trace-dot">{iconFor(step.status)}</span>
            </span>
            <span className="trace-body">
              <span className="trace-label">{step.label}</span>
              <span className="trace-detail">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
