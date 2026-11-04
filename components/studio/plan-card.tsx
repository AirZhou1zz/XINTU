"use client";

import { CheckCircle2, ScanEye } from "lucide-react";
import type { AgentPlan } from "@/lib/color/types";

export function PlanCard({ plan }: { plan: AgentPlan }) {
  return (
    <section className="panel-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">PLAN</span>
          <h2>画面判断</h2>
        </div>
        <ScanEye size={17} className="heading-icon" />
      </div>
      <p className="plan-summary">{plan.sceneSummary}</p>
      <div className="tool-list">
        {plan.tools.map((tool) => (
          <span key={tool} className="tool-chip">{tool.replaceAll("_", " ")}</span>
        ))}
      </div>
      <ul className="constraint-list">
        {plan.constraints.map((constraint) => (
          <li key={constraint}>
            <CheckCircle2 size={12} />
            {constraint}
          </li>
        ))}
      </ul>
    </section>
  );
}
