"use client";

import type { Candidate, Strength } from "@/lib/color/types";

const strengthOptions: Array<{ value: Strength; label: string }> = [
  { value: "low", label: "弱" },
  { value: "medium", label: "中" },
  { value: "high", label: "强" },
];

type GradeSelectorDockProps = {
  strength: Strength;
  onStrengthChange: (strength: Strength) => void;
  candidates?: Array<Pick<Candidate, "id" | "label">>;
  activeCandidateId?: Candidate["id"];
  onSelectCandidate?: (id: Candidate["id"]) => void;
  className?: string;
};

export function GradeSelectorDock({
  strength,
  onStrengthChange,
  candidates,
  activeCandidateId,
  onSelectCandidate,
  className = "",
}: GradeSelectorDockProps) {
  return (
    <section className={`xintu-grade-dock ${className}`} aria-label="调色控制">
      {candidates && candidates.length > 0 ? (
        <div className="xintu-grade-candidates" role="group" aria-label="选择调色方向">
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={candidate.id === activeCandidateId ? "is-active" : ""}
              aria-pressed={candidate.id === activeCandidateId}
              onClick={() => onSelectCandidate?.(candidate.id)}
            >
              <span>{candidate.id}</span>
              <strong>{candidate.label}</strong>
            </button>
          ))}
        </div>
      ) : null}
      <div className="xintu-grade-strength" role="group" aria-label="选择调色强度">
        <span>调色强度</span>
        <div>
          {strengthOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={strength === option.value ? "is-active" : ""}
              aria-pressed={strength === option.value}
              onClick={() => onStrengthChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}