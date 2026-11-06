"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./xintu-portfolio.module.css";

export type ShowcaseCandidate = {
  id: "A" | "B" | "C";
  label: string;
  score: number;
  verdict: "pass" | "needs_work";
  summary: string;
  image: string;
};

export type ShowcaseCase = {
  id: string;
  index: string;
  title: string;
  prompt: string;
  scene: string;
  refinements: number;
  before: string;
  recommendedCandidateId: "A" | "B" | "C";
  candidates: ShowcaseCandidate[];
};

type QwenCaseGalleryProps = {
  assetBase: string;
  cases: ShowcaseCase[];
};

export function QwenCaseGallery({ assetBase, cases }: QwenCaseGalleryProps) {
  const [selected, setSelected] = useState<Record<string, ShowcaseCandidate["id"]>>(
    () => Object.fromEntries(cases.map((item) => [item.id, item.recommendedCandidateId])),
  );
  const [positions, setPositions] = useState<Record<string, number>>(
    () => Object.fromEntries(cases.map((item) => [item.id, item.id === "portrait" ? 58 : 54])),
  );

  return (
    <div className={styles.showcaseGrid}>
      {cases.map((item) => {
        const selectedId = selected[item.id] ?? item.recommendedCandidateId;
        const candidate = item.candidates.find((entry) => entry.id === selectedId) ?? item.candidates[0];
        const position = positions[item.id] ?? 54;

        return (
          <article className={styles.showcaseCard} key={item.id}>
            <div className={styles.showcaseMedia}>
              <Image
                src={`${assetBase}${item.before}`}
                alt={`${item.title}原始照片`}
                fill
                sizes="(max-width: 900px) 92vw, 31vw"
              />
              <div
                className={styles.showcaseAfter}
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              >
                <Image
                  src={`${assetBase}${candidate.image}`}
                  alt={`${item.title}的 Qwen 调色结果`}
                  fill
                  sizes="(max-width: 900px) 92vw, 31vw"
                />
              </div>
              <span className={`${styles.showcaseImageLabel} ${styles.showcaseImageLabelLeft}`}>QWEN 成片</span>
              <span className={`${styles.showcaseImageLabel} ${styles.showcaseImageLabelRight}`}>原图</span>
              <span className={styles.showcaseRunBadge}>QWEN 3.8 FLASH · 实跑</span>
              <div className={styles.showcaseDivider} style={{ left: `${position}%` }}>
                <span />
              </div>
              <input
                className={styles.showcaseRange}
                type="range"
                min={0}
                max={100}
                value={position}
                aria-label={`拖动查看${item.title}原图与 Qwen 成片`}
                onChange={(event) => setPositions((current) => ({
                  ...current,
                  [item.id]: Number(event.target.value),
                }))}
              />
            </div>

            <div className={styles.showcaseBody}>
              <div className={styles.showcaseKicker}>
                <span>{item.index}</span>
                <span>{item.scene}</span>
                <span>{item.refinements} 轮修正</span>
              </div>
              <h3>{item.title}</h3>
              <p className={styles.showcasePrompt}>“{item.prompt}”</p>

              <div className={styles.showcaseTabs} role="group" aria-label={`${item.title}候选方向`}>
                {item.candidates.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className={entry.id === selectedId ? styles.showcaseTabActive : ""}
                    aria-pressed={entry.id === selectedId}
                    onClick={() => setSelected((current) => ({ ...current, [item.id]: entry.id }))}
                  >
                    <strong>{entry.id}</strong>
                    <span>{entry.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.showcaseReview}>
                <div>
                  <span>{candidate.verdict === "pass" ? "QWEN REVIEW · PASS" : "QWEN REVIEW · NEEDS WORK"}</span>
                  <strong>{candidate.score}</strong>
                </div>
                <p>{candidate.summary}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
