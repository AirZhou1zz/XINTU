"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeftRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Candidate } from "@/lib/color/types";

type BeforeAfterProps = {
  originalUrl: string | null;
  candidate: Candidate | null;
};

type ProbeSample = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

export function BeforeAfter({ originalUrl, candidate }: BeforeAfterProps) {
  const [position, setPosition] = useState(52);
  const stageRef = useRef<HTMLDivElement>(null);
  const resultImageRef = useRef<HTMLImageElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const probeValueRef = useRef<HTMLSpanElement>(null);
  const probeSwatchRef = useRef<HTMLSpanElement>(null);
  const sampleRef = useRef<ProbeSample | null>(null);

  useGSAP(() => {
    if (!candidate) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".compare-result", {
        autoAlpha: 0.35,
        scale: 1.012,
        duration: 0.55,
        ease: "power2.out",
      });
    });

    return () => media.revert();
  }, { scope: stageRef, dependencies: [candidate?.id] });

  const prepareProbe = () => {
    const image = resultImageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      sampleRef.current = { canvas, ctx };
    } catch {
      sampleRef.current = null;
    }
  };

  const hideProbe = () => {
    probeRef.current?.classList.remove("visible");
  };

  const moveProbe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const sample = sampleRef.current;
    const probe = probeRef.current;
    if (!sample || !probe || event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    const sourceX = Math.min(sample.canvas.width - 1, Math.floor((x / bounds.width) * sample.canvas.width));
    const sourceY = Math.min(sample.canvas.height - 1, Math.floor((y / bounds.height) * sample.canvas.height));

    try {
      const [r, g, b] = sample.ctx.getImageData(sourceX, sourceY, 1, 1).data;
      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      probe.style.left = `${x}px`;
      probe.style.top = `${y}px`;
      probe.classList.add("visible");
      if (probeValueRef.current) probeValueRef.current.textContent = hex.toUpperCase();
      if (probeSwatchRef.current) probeSwatchRef.current.style.backgroundColor = hex;
    } catch {
      hideProbe();
    }
  };

  return (
    <div className="image-frame">
      <div className="image-frame-topline">
        <span className="eyebrow">LIGHT TABLE / LIVE PREVIEW</span>
        <span className="mono-label">{candidate ? `${candidate.id} · ${candidate.label}` : "AWAITING SAMPLE"}</span>
      </div>
      <div
        ref={stageRef}
        className="compare-stage"
        onPointerMove={moveProbe}
        onPointerLeave={hideProbe}
      >
        {originalUrl ? (
          <>
            <img src={originalUrl} alt="原始照片" className="compare-image" />
            {candidate ? (
              <img
                ref={resultImageRef}
                src={candidate.imageUrl}
                alt={`${candidate.label}调色结果`}
                className="compare-image compare-result"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                onLoad={prepareProbe}
              />
            ) : null}
            {candidate ? (
              <>
                <div className="compare-line" style={{ left: `${position}%` }} aria-hidden="true">
                  <span className="compare-knob"><ArrowLeftRight size={12} /></span>
                </div>
                <input
                  className="compare-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={position}
                  onChange={(event) => setPosition(Number(event.target.value))}
                  aria-label="拖动查看原图与成片对比"
                  aria-valuetext={`${position}% 成片对比`}
                />
                <div className="compare-labels">
                  <span>原图</span>
                  <span>成片</span>
                </div>
                <div ref={probeRef} className="color-probe" aria-hidden="true">
                  <span ref={probeSwatchRef} className="color-probe-swatch" />
                  <span>
                    <small>COLOR PROBE</small>
                    <span ref={probeValueRef}>#000000</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="canvas-waiting">
                <span className="eyebrow">COLOR ENGINE READY</span>
                <strong>输入调色方向，让 Agent 开始规划。</strong>
              </div>
            )}
          </>
        ) : (
          <div className="canvas-empty">
            <span className="spectrum-orb" aria-hidden="true" />
            <span className="eyebrow">UPLOAD TO BEGIN</span>
            <strong>上传一张照片<br />让颜色开始呼吸</strong>
            <small>JPG · PNG · WebP，最长边自动压缩至 1600px</small>
          </div>
        )}
      </div>
      <div className="image-frame-footer">
        <span>非生成式 · 本地确定性渲染</span>
        <span>拖动中线对比 / 移动指针读取颜色</span>
      </div>
    </div>
  );
}