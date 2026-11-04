"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Candidate } from "@/lib/color/types";

type CandidateRailProps = {
  candidates: Candidate[];
  activeId: Candidate["id"] | null;
  onSelect: (id: Candidate["id"]) => void;
};

export function CandidateRail({ candidates, activeId, onSelect }: CandidateRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (candidates.length === 0) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".candidate-card", {
        y: 14,
        autoAlpha: 0,
        duration: 0.42,
        stagger: 0.07,
        ease: "power2.out",
      });
    });

    return () => media.revert();
  }, { scope: railRef, dependencies: [candidates.length] });

  if (candidates.length === 0) {
    return (
      <div ref={railRef} className="candidate-rail empty">
        <span className="eyebrow">DAILIES / CANDIDATES</span>
        <p>生成后会给出 3 个不同倾向的调色方向。</p>
      </div>
    );
  }

  return (
    <div ref={railRef} className="candidate-rail" aria-label="候选调色方案" aria-live="polite">
      {candidates.map((candidate) => (
        <button
          key={candidate.id}
          type="button"
          className={`candidate-card ${activeId === candidate.id ? "active" : ""}`}
          aria-pressed={activeId === candidate.id}
          onClick={() => onSelect(candidate.id)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
            event.currentTarget.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
          }}
        >
          <span className="candidate-thumb" aria-hidden="true">
            <img src={candidate.imageUrl} alt="" />
          </span>
          <span className="candidate-copy">
            <span className="candidate-topline">
              <span className="mono-label">{candidate.id} / TAKE</span>
              {candidate.evaluation.pass
                ? <CheckCircle2 size={14} aria-label="评估通过" />
                : <AlertTriangle size={14} aria-label="需要修正" />}
            </span>
            <strong>{candidate.label}</strong>
            <small>{candidate.description}</small>
            <span className="candidate-metric">
              {candidate.evaluation.deltaE === null ? "无参考" : `ΔE ${candidate.evaluation.deltaE.toFixed(1)}`}
              <span> / </span>
              结构 {(candidate.evaluation.structureScore * 100).toFixed(1)}%
            </span>
          </span>
          <span className={`candidate-accent accent-${candidate.id.toLowerCase()}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}