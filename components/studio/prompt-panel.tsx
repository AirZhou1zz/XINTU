"use client";

import { Sparkles, SlidersHorizontal } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import type { Strength } from "@/lib/color/types";

const QUICK_PROMPTS = ["日系通透", "电影青橙", "肤色自然", "低饱和胶片", "旅行感"];

type PromptPanelProps = {
  prompt: string;
  strength: Strength;
  busy: boolean;
  canGenerate: boolean;
  onPromptChange: (value: string) => void;
  onStrengthChange: (value: Strength) => void;
  onGenerate: () => void;
  onReset: () => void;
};

export function PromptPanel({
  prompt,
  strength,
  busy,
  canGenerate,
  onPromptChange,
  onStrengthChange,
  onGenerate,
  onReset,
}: PromptPanelProps) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / INTENT</span>
          <h2>给画面一个方向</h2>
        </div>
        <Sparkles size={18} className="heading-icon" aria-hidden="true" />
      </div>

      <label className="sr-only" htmlFor="color-prompt">调色描述</label>
      <textarea
        id="color-prompt"
        className="prompt-input"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="例如：日系、通透，肤色自然，保留皮肤纹理"
        rows={4}
        maxLength={500}
      />

      <div className="quick-chips" aria-label="快捷描述">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            aria-pressed={prompt === item}
            onClick={() => onPromptChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="strength-row">
        <div>
          <span className="eyebrow">STRENGTH / CONTROL RANGE</span>
          <p className="helper">弱档保留自然质感，强档允许更明确的风格偏移。</p>
        </div>
        <div className="segmented-control" role="group" aria-label="调色强度">
          {(["low", "medium", "high"] as const).map((level) => (
            <button
              key={level}
              type="button"
              className={strength === level ? "active" : ""}
              aria-pressed={strength === level}
              onClick={() => onStrengthChange(level)}
            >
              {level === "low" ? "弱" : level === "medium" ? "中" : "强"}
            </button>
          ))}
        </div>
      </div>

      <div className="prompt-actions">
        <MagneticButton
          className="primary-button cue-primary"
          onClick={onGenerate}
          disabled={busy || !canGenerate}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          {busy ? "Agent 正在工作" : "生成 3 个候选"}
        </MagneticButton>
        <button type="button" className="ghost-button" onClick={onReset} disabled={busy}>
          清空结果
        </button>
      </div>
    </section>
  );
}