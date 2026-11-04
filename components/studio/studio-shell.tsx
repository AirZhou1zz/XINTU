"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Home,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { gsap, useGSAP } from "@/lib/gsap";
import { AgentTrace } from "./agent-trace";
import { BeforeAfter } from "./before-after";
import { CandidateRail } from "./candidate-rail";
import { EvaluationPanel } from "./evaluation-panel";
import { ParameterPanel } from "./parameter-panel";
import { PlanCard } from "./plan-card";
import { PromptPanel } from "./prompt-panel";
import { UploadDropzone } from "./upload-dropzone";
import { useStudio } from "./use-studio";

const statusLabel = {
  idle: "READY",
  loading: "LOADING",
  analyzing: "PLANNING",
  rendering: "RENDERING",
  evaluating: "EVALUATING",
  refining: "REFINING",
  done: "COMPLETE",
  error: "ERROR",
} as const;

const workflowSteps = [
  { id: "source", label: "SOURCE", title: "上传照片" },
  { id: "agent", label: "AGENT", title: "规划与修正" },
  { id: "result", label: "RESULT", title: "验收候选" },
  { id: "export", label: "EXPORT", title: "交付成片" },
] as const;

type StudioShellProps = {
  initialPrompt?: string;
};

export function StudioShell({ initialPrompt }: StudioShellProps) {
  const studio = useStudio(initialPrompt);
  const [exportComplete, setExportComplete] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const workflowIndex = exportComplete ? 4 : studio.candidates.length > 0 ? 3 : studio.isBusy ? 2 : 1;

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".brand-stage", { y: 18, autoAlpha: 0, duration: 0.55 })
        .from(".spectrum-rule", { scaleX: 0.92, autoAlpha: 0, duration: 0.45, transformOrigin: "left center" }, "-=0.2")
        .from(".workflow-progress", { y: 10, autoAlpha: 0, duration: 0.42 }, "-=0.25")
        .from(".canvas-panel", { y: 18, autoAlpha: 0, duration: 0.65 }, "-=0.18")
        .from(".control-panel", { y: 14, autoAlpha: 0, duration: 0.55 }, "-=0.48")
        .from(".canvas-caption, .candidate-rail", { y: 10, autoAlpha: 0, duration: 0.4, stagger: 0.08 }, "-=0.3");
    });

    return () => media.revert();
  }, { scope: shellRef });

  const providerLabel = studio.provider === "mock"
    ? "MOCK DEMO"
    : studio.provider === "openai-compatible"
      ? "AI CONNECTED"
      : "LOCAL READY";

  const handleExport = () => {
    if (!studio.activeCandidate) return;
    studio.download();
    setExportComplete(true);
  };

  return (
    <div ref={shellRef} className="app-shell">
      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-orb ambient-orb-cobalt" />
        <span className="ambient-orb ambient-orb-rose" />
        <span className="ambient-orb ambient-orb-sage" />
      </div>

      <header className="topbar">
        <div className="brand-stage">
          <Link href="/" className="brand-home-link" aria-label="返回 XINTU 首页">
            <Wordmark />
          </Link>
        </div>
        <div className="topbar-actions">
          <Link href="/" className="studio-home-link">
            <Home size={14} />
            官网
          </Link>
          <span className={`provider-pill ${studio.provider === "mock" ? "mock" : ""}`}>
            <span className="provider-dot" aria-hidden="true" />
            {providerLabel}
          </span>
          <span className={`pipeline-pill ${studio.status}`}>
            {studio.isBusy ? <LoaderCircle size={13} className="spin" /> : null}
            {statusLabel[studio.status]}
          </span>
          <details className="privacy-menu">
            <summary>
              <ShieldCheck size={15} />
              隐私
            </summary>
            <div className="privacy-card">
              <strong>照片如何处理？</strong>
              <p>Mock 模式只在浏览器内处理。连接 AI 时，照片会发送给模型服务进行分析；渲染和导出始终在浏览器本地完成，不用于训练。</p>
            </div>
          </details>
          <MagneticButton className="primary-button header-export" onClick={handleExport} disabled={!studio.activeCandidate}>
            <Download size={16} />
            导出 PNG
          </MagneticButton>
        </div>
      </header>

      <div className="spectrum-rule" aria-hidden="true">
        <span className="spectrum-label">C-41 / 5207 / PRINT STOCK / 01</span>
        <span className="spectrum-track">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="workflow-progress" aria-label="调色流程">
        <Link href="/" className="workflow-home">
          <ArrowLeft size={14} />
          返回首页
        </Link>
        <ol>
          {workflowSteps.map((step, index) => {
            const stepNumber = index + 1;
            const state = stepNumber < workflowIndex ? "complete" : stepNumber === workflowIndex ? "active" : "pending";
            return (
              <li key={step.id} className={`workflow-step ${state} ${studio.status === "error" && stepNumber === workflowIndex ? "error" : ""}`}>
                <span className="workflow-number">
                  {state === "complete" ? <Check size={12} /> : `0${stepNumber}`}
                </span>
                <span className="workflow-copy">
                  <small>{step.label}</small>
                  <strong>{step.title}</strong>
                </span>
              </li>
            );
          })}
        </ol>
        <span className="workflow-boundary">MAX 02 REFINES / LOCAL RENDER</span>
      </div>

      <main className="studio-grid">
        <section className="canvas-column" aria-label="调色画布">
          <div className="canvas-panel">
            {studio.target ? (
              <BeforeAfter key={studio.activeCandidate?.id ?? "original"} originalUrl={studio.target.previewUrl} candidate={studio.activeCandidate} />
            ) : (
              <div className="target-empty">
                <div className="target-empty-wash" aria-hidden="true" />
                <UploadDropzone
                  label="上传目标照片"
                  description="拖入照片，或点击选择 JPG / PNG / WebP"
                  onFile={studio.loadTarget}
                  onDemo={studio.loadDemo}
                />
              </div>
            )}
          </div>

          <div className="canvas-caption">
            <span className="eyebrow">DETERMINISTIC COLOR ENGINE / LOCAL PIXELS</span>
            <p>AI 只生成可解释参数；颜色由 Canvas 在本地计算，不生成新像素。</p>
          </div>

          <CandidateRail
            candidates={studio.candidates}
            activeId={studio.activeCandidateId}
            onSelect={studio.selectCandidate}
          />

          {studio.evaluation ? (
            <div className="review-record">
              <EvaluationPanel evaluation={studio.evaluation} iterations={studio.iterations} />
            </div>
          ) : null}
        </section>

        <aside className="control-column" aria-label="AI 调色控制">
          <div className="control-panel">
            <header className="cue-sheet-head">
              <div>
                <span className="eyebrow">DIRECTOR&apos;S CUE / 01–04</span>
                <h2>调色工作单</h2>
              </div>
              <span>FRAME {studio.activeCandidateId ?? "—"}</span>
            </header>

            <PromptPanel
              prompt={studio.prompt}
              strength={studio.strength}
              busy={studio.isBusy}
              canGenerate={Boolean(studio.target)}
              onPromptChange={studio.setPrompt}
              onStrengthChange={studio.setStrength}
              onGenerate={studio.analyze}
              onReset={studio.resetResults}
            />

            <section className="panel-section reference-section">
              <div className="section-heading compact-heading">
                <div>
                  <span className="eyebrow">02 / REFERENCE</span>
                  <h2>参考图追色</h2>
                </div>
                <span className="optional-badge">OPTIONAL</span>
              </div>
              <UploadDropzone
                label="参考图"
                description="可选，最多一张"
                compact
                previewUrl={studio.reference?.previewUrl}
                fileName={studio.reference?.name}
                onFile={studio.loadReference}
                onClear={studio.clearReference}
                disabled={studio.isBusy}
              />
            </section>

            <AgentTrace steps={studio.trace} />
            {studio.plan ? <PlanCard plan={studio.plan} /> : null}
            {studio.activeCandidate ? (
              <ParameterPanel
                params={studio.activeCandidate.params}
                aiParams={studio.activeCandidate.aiParams}
                onChange={studio.updateParam}
                onReset={studio.resetActiveParams}
              />
            ) : null}

            {studio.error ? (
              <div className="error-banner" role="alert">
                <AlertTriangle size={16} />
                <div className="error-banner-copy">
                  <span>{studio.error}</span>
                  {studio.target && !studio.isBusy ? (
                    <button type="button" className="error-retry" onClick={() => void studio.analyze()}>
                      <RotateCcw size={13} />
                      重新尝试
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </main>

      <footer className="footer-note">
        <span>XINTU / BOUNDED AGENTIC COLOR GRADING</span>
        <span>PLAN → APPLY → EVALUATE → REFINE</span>
        <span>NO PIXEL GENERATION / MAX 2 REFINES</span>
      </footer>

      {exportComplete && studio.activeCandidate ? (
        <div className="export-backdrop" role="presentation" onMouseDown={() => setExportComplete(false)}>
          <section
            className="export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="export-modal-close" onClick={() => setExportComplete(false)} aria-label="关闭导出弹窗">
              <X size={17} />
            </button>
            <span className="export-kicker">EXPORT COMPLETE / LOCAL PNG</span>
            <div className="export-check"><Check size={28} /></div>
            <h2 id="export-title">成片已经交付。</h2>
            <p>PNG 已从当前候选下载到本地。全部颜色计算在浏览器完成，没有上传成片。</p>
            <div className="export-summary">
              <span><small>ACTIVE TAKE</small><strong>{studio.activeCandidate.id} / {studio.activeCandidate.label}</strong></span>
              <span><small>EVALUATION</small><strong>{studio.activeCandidate.evaluation.pass ? "PASS" : "DEGRADED"}</strong></span>
              <span><small>REFINES</small><strong>{studio.iterations} / 2</strong></span>
            </div>
            <div className="export-actions">
              <button type="button" className="primary-button" onClick={studio.download}>
                <Download size={16} />
                再次下载 PNG
              </button>
              <button type="button" className="ghost-button" onClick={() => setExportComplete(false)}>
                返回工作台
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}