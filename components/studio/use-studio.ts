import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCandidateVariants } from "@/lib/agent/candidates";
import { runBoundedAgent } from "@/lib/agent/loop";
import { sceneLabels } from "@/lib/agent/scene";
import { visualReviewSchema } from "@/lib/agent/visual-review";
import type { VisualReview } from "@/lib/agent/visual-review";
import type { AnalyzeResponse } from "@/lib/agent/types";
import { analyzeResponseSchema, refineResponseSchema } from "@/lib/color/schema";
import { evaluateImage, getSceneHints } from "@/lib/color/metrics";
import { renderColorGrade } from "@/lib/color/engine";
import type {
  Candidate,
  ColorParams,
  EvaluationResult,
  Strength,
  TraceStep,
} from "@/lib/color/types";
import { downloadRgbaImage, loadImageFile, rgbaToDataUrl, rgbaToJpegDataUrl } from "@/lib/image/browser";

export type StudioStatus =
  | "idle"
  | "loading"
  | "analyzing"
  | "rendering"
  | "evaluating"
  | "refining"
  | "done"
  | "error";

export type LoadedImageState = {
  pixels: Parameters<typeof renderColorGrade>[0];
  previewUrl: string;
  name: string;
};

export type StudioConversationMessage = {
  role: "user" | "assistant";
  text: string;
};

const defaultTrace: TraceStep[] = [
  { id: "plan", label: "PLAN", status: "idle", detail: "等待理解画面与用户意图。" },
  { id: "apply", label: "APPLY", status: "idle", detail: "等待选择调色工具。" },
  { id: "evaluate", label: "EVALUATE", status: "idle", detail: "等待生成可评估的结果。" },
  { id: "refine", label: "REFINE", status: "idle", detail: "未触发，最多修正 2 轮。" },
];

function setTraceStep(trace: TraceStep[], id: TraceStep["id"], patch: Partial<TraceStep>) {
  return trace.map((step) => (step.id === id ? { ...step, ...patch } : step));
}

function metricSummary(result: EvaluationResult) {
  const delta = result.deltaE === null ? "无参考图" : `ΔE ${result.deltaE.toFixed(1)}`;
  return `${delta} · 肤色 ${result.skinShift.toFixed(1)} · 天空 ${result.skyShift.toFixed(1)} · 结构 ${(result.structureScore * 100).toFixed(1)}%`;
}

function previewUrl(pixels: Candidate["pixels"]) {
  return rgbaToDataUrl(pixels, "image/jpeg", 0.92);
}

export function useStudio(initialPrompt = "日系、通透，肤色自然，保留皮肤纹理") {
  const [target, setTarget] = useState<LoadedImageState | null>(null);
  const [reference, setReference] = useState<LoadedImageState | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [strength, setStrength] = useState<Strength>("medium");
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AnalyzeResponse["plan"] | null>(null);
  const [provider, setProvider] = useState<"mock" | "openai-compatible" | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<Candidate["id"] | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [trace, setTrace] = useState<TraceStep[]>(defaultTrace);
  const [iterations, setIterations] = useState(0);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [manualRefinements, setManualRefinements] = useState(0);
  const [conversation, setConversation] = useState<StudioConversationMessage[]>([]);
  const [visualReview, setVisualReview] = useState<VisualReview | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const renderTimerRef = useRef<number | null>(null);

  const activeCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === activeCandidateId) ?? null,
    [candidates, activeCandidateId],
  );

  const isBusy = status === "loading" || status === "analyzing" || status === "rendering" || status === "evaluating" || status === "refining";

  useEffect(() => () => {
    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
  }, []);

  const resetResults = useCallback(() => {
    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    setPlan(null);
    setProvider(null);
    setCandidates([]);
    setActiveCandidateId(null);
    setEvaluation(null);
    setTrace(defaultTrace);
    setIterations(0);
    setElapsedMs(null);
    setManualRefinements(0);
    setConversation([]);
    setStatus("idle");
    setError(null);
  }, []);

  const loadTarget = useCallback(async (file: File): Promise<LoadedImageState | null> => {
    try {
      setStatus("loading");
      setError(null);
      const loaded = await loadImageFile(file);
      const nextTarget = { pixels: loaded.pixels, previewUrl: loaded.previewUrl, name: loaded.name };
      setTarget(nextTarget);
      resetResults();
      return nextTarget;
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "目标图片加载失败。");
      return null;
    }
  }, [resetResults]);

  const loadReference = useCallback(async (file: File) => {
    try {
      const loaded = await loadImageFile(file);
      setReference({ pixels: loaded.pixels, previewUrl: loaded.previewUrl, name: loaded.name });
      resetResults();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "参考图加载失败。");
    }
  }, [resetResults]);

  const loadDemo = useCallback(async (url = "/demo-scene.svg") => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("演示图片加载失败。");
      const blob = await response.blob();
      const filename = url.split("/").pop() || "xintu-demo.jpg";
      return await loadTarget(new File([blob], filename, { type: blob.type || "image/jpeg" }));
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "演示图片加载失败。");
    }
  }, [loadTarget]);

  const clearReference = useCallback(() => setReference(null), []);

  const clearTarget = useCallback(() => {
    setTarget(null);
    resetResults();
  }, [resetResults]);

  const selectCandidate = useCallback((id: Candidate["id"]) => {
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) return;
    setActiveCandidateId(id);
    setEvaluation(candidate.evaluation);
  }, [candidates]);

  const updateParam = useCallback((key: keyof ColorParams, value: number) => {
    if (!target || !activeCandidate) return;
    const params = { ...activeCandidate.params, [key]: value };
    setVisualReview(null);
    const candidateId = activeCandidate.id;
    setCandidates((current) => current.map((candidate) => (candidate.id === candidateId ? { ...candidate, params } : candidate)));

    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    renderTimerRef.current = window.setTimeout(() => {
      const rendered = renderColorGrade(target.pixels, params);
      const nextEvaluation = evaluateImage(target.pixels, rendered, reference?.pixels ?? null, true);
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === candidateId
            ? { ...candidate, params, pixels: rendered, imageUrl: previewUrl(rendered), evaluation: nextEvaluation }
            : candidate,
        ),
      );
      setEvaluation(nextEvaluation);
    }, 64);
  }, [activeCandidate, reference, target]);

  const analyze = useCallback(async (targetOverride?: LoadedImageState) => {
    const activeTarget = targetOverride ?? target;
    if (!activeTarget) {
      setError("请先上传一张目标照片。");
      return false;
    }
    if (!prompt.trim()) {
      setError("请描述你想要的调色方向。");
      return false;
    }

    const startedAt = performance.now();
    setStatus("analyzing");
    setError(null);
    setElapsedMs(null);
    setManualRefinements(0);
    setConversation([]);
    setCandidates([]);
    setActiveCandidateId(null);
    setEvaluation(null);
    setPlan(null);
    setProvider(null);
    setIterations(0);
    setTrace(setTraceStep(setTraceStep(defaultTrace, "plan", { status: "running", detail: "正在分析画面和用户意图。" }), "refine", { status: "idle" }));

    try {
      const sceneHints = getSceneHints(activeTarget.pixels);
      const imageDataUrl = rgbaToJpegDataUrl(activeTarget.pixels);
      const referenceDataUrl = reference ? rgbaToJpegDataUrl(reference.pixels) : undefined;
      const analyzeResponse = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          strength,
          imageDataUrl,
          referenceDataUrl,
          sceneHints,
        }),
      });
      if (!analyzeResponse.ok) {
        const body = (await analyzeResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "分析接口返回异常。");
      }
      const analyzed = analyzeResponseSchema.parse(await analyzeResponse.json());
      setPlan(analyzed.plan);
      setProvider(analyzed.provider);
      setTrace((current) =>
        setTraceStep(
          setTraceStep(current, "plan", {
            status: "passed",
            detail: `识别为${sceneLabels[analyzed.plan.sceneCategory]} · 方向：${analyzed.plan.directions.map((item) => item.label).join(" / ")}`,
          }),
          "apply",
          { status: "running", detail: "正在生成候选调色参数。" },
        ),
      );

      setStatus("evaluating");
      const loop = await runBoundedAgent({
        initialParams: analyzed.params,
        maxRefinements: 2,
        evaluate: (params) =>
          evaluateImage(activeTarget.pixels, renderColorGrade(activeTarget.pixels, params), reference?.pixels ?? null, true),
        refine: async (params, evaluation, iteration) => {
          setStatus("refining");
          setTrace((current) =>
            setTraceStep(current, "refine", {
              status: "running",
              detail: evaluation.findings[0] ?? "正在收敛主要偏差。",
            }),
          );
          const refineResponse = await fetch("/api/agent/refine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: prompt.trim(),
              strength,
              params,
              findings: evaluation.findings,
              iteration,
              mode: "auto",
            }),
          });
          if (!refineResponse.ok) {
            const body = (await refineResponse.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error || "修正接口返回异常。");
          }
          const refined = refineResponseSchema.parse(await refineResponse.json());
          return { params: refined.params, rationale: refined.rationale };
        },
        onEvaluate: (evaluation, iteration) => {
          setIterations(iteration);
          setTrace((current) =>
            setTraceStep(current, "evaluate", {
              status: evaluation.pass ? "passed" : "warning",
              detail: metricSummary(evaluation),
            }),
          );
        },
        onRefine: (result, iteration) => {
          setTrace((current) =>
            setTraceStep(current, "refine", {
              status: "warning",
              detail: `第 ${iteration} 轮：${result.rationale}`,
            }),
          );
        },
      });
      setIterations(loop.iterations);
      setTrace((current) =>
        setTraceStep(current, "refine", {
          status: loop.evaluation.pass ? "passed" : "warning",
          detail: loop.evaluation.pass ? "评估通过，停止修正。" : "达到最大修正轮次，输出降级结果。",
        }),
      );
      const currentParams = loop.params;

      setStatus("rendering");
      const variants = buildCandidateVariants(currentParams, analyzed.plan.directions);
      const renderedCandidates = variants.map((variant) => {
        const pixels = renderColorGrade(activeTarget.pixels, variant.params);
        const candidateEvaluation = evaluateImage(activeTarget.pixels, pixels, reference?.pixels ?? null, true);
        return {
          ...variant,
          aiParams: variant.params,
          pixels,
          imageUrl: previewUrl(pixels),
          evaluation: candidateEvaluation,
        } satisfies Candidate;
      });

      setCandidates(renderedCandidates);
      setActiveCandidateId("A");
      setEvaluation(renderedCandidates[0].evaluation);
      setTrace((current) =>
        setTraceStep(
          setTraceStep(current, "apply", {
            status: "passed",
            detail: `${renderedCandidates.length} 组候选已完成确定性渲染。`,
          }),
          "evaluate",
          {
            status: renderedCandidates.every((candidate) => candidate.evaluation.pass) ? "passed" : "warning",
            detail: metricSummary(renderedCandidates[0].evaluation),
          },
        ),
      );
      setElapsedMs(Math.round(performance.now() - startedAt));
      setConversation([{
        role: "assistant",
        text: `识别为${sceneLabels[analyzed.plan.sceneCategory]}场景，已自动准备 ${analyzed.plan.directions.map((item) => item.label).join(" / ")} 三个方向。满意可以直接导出，也可以继续告诉我哪里需要调整。`,
      }]);
      setStatus("done");
      return true;
    } catch (analyzeError) {
      setElapsedMs(Math.round(performance.now() - startedAt));
      setStatus("error");
      setError(analyzeError instanceof Error ? analyzeError.message : "生成失败，请稍后重试。");
      setTrace((current) => setTraceStep(current, "evaluate", { status: "error", detail: "生成流程中断，请重试。" }));
      return false;
    }
  }, [prompt, reference, strength, target]);

  const refineFromFeedback = useCallback(async (feedback: string) => {
    const message = feedback.trim();
    if (!target || !activeCandidate || !message) return false;

    setStatus("refining");
    setError(null);
    setConversation((current) => [...current, { role: "user", text: message }]);

    try {
      const effectivePrompt = `${prompt.trim()}\n追加反馈：${message}`.slice(0, 500);
      const findings = [
        `用户追加反馈：${message}`.slice(0, 220),
        ...activeCandidate.evaluation.findings,
      ].slice(0, 8);
      const response = await fetch("/api/agent/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt,
          strength,
          params: activeCandidate.params,
          findings,
          iteration: Math.min(2, manualRefinements),
          mode: "manual",
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "继续修正失败。");
      }

      const refined = refineResponseSchema.parse(await response.json());
      const pixels = renderColorGrade(target.pixels, refined.params);
      const nextEvaluation = evaluateImage(target.pixels, pixels, reference?.pixels ?? null, true);
      const nextCandidate: Candidate = {
        ...activeCandidate,
        params: refined.params,
        pixels,
        imageUrl: previewUrl(pixels),
        evaluation: nextEvaluation,
      };

      setCandidates((current) => current.map((candidate) => (
        candidate.id === activeCandidate.id ? nextCandidate : candidate
      )));
      setEvaluation(nextEvaluation);
      setManualRefinements((current) => current + 1);
      setTrace((current) => setTraceStep(current, "refine", {
        status: nextEvaluation.pass ? "passed" : "warning",
        detail: refined.rationale,
      }));
      setConversation((current) => [...current, { role: "assistant", text: refined.rationale }]);
      setStatus("done");
      return true;
    } catch (refineError) {
      const messageText = refineError instanceof Error ? refineError.message : "继续修正失败。";
      setConversation((current) => [...current, { role: "assistant", text: `这次调整没有完成：${messageText}` }]);
      setStatus("done");
      return false;
    }
  }, [activeCandidate, manualRefinements, prompt, reference, strength, target]);
  const reviewCurrentCandidate = useCallback(async () => {
    if (!target || !activeCandidate || isReviewing) return false;
    setIsReviewing(true);
    try {
      const response = await fetch("/api/agent/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageDataUrl: rgbaToJpegDataUrl(activeCandidate.pixels),
          referenceDataUrl: reference ? rgbaToJpegDataUrl(reference.pixels) : undefined,
          heuristics: {
            pass: activeCandidate.evaluation.pass,
            deltaE: activeCandidate.evaluation.deltaE,
            skinShift: activeCandidate.evaluation.skinShift,
            skyShift: activeCandidate.evaluation.skyShift,
            structureScore: activeCandidate.evaluation.structureScore,
            clippingRatio: activeCandidate.evaluation.clippingRatio,
            schemaValid: activeCandidate.evaluation.schemaValid,
            findings: activeCandidate.evaluation.findings,
          },
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "视觉复核失败。");
      }
      const nextReview = visualReviewSchema.parse(await response.json());
      setVisualReview(nextReview);
      setConversation((current) => [...current, {
        role: "assistant",
        text: `视觉复核：${nextReview.summary}`,
      }]);
      return true;
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : "视觉复核失败。";
      setConversation((current) => [...current, { role: "assistant", text: `视觉复核失败：${message}` }]);
      return false;
    } finally {
      setIsReviewing(false);
    }
  }, [activeCandidate, isReviewing, prompt, reference, target]);
  const resetActiveParams = useCallback(() => {
    if (!target || !activeCandidate) return;
    const rendered = renderColorGrade(target.pixels, activeCandidate.aiParams);
    const nextEvaluation = evaluateImage(target.pixels, rendered, reference?.pixels ?? null, true);
    const nextCandidate: Candidate = {
      ...activeCandidate,
      params: activeCandidate.aiParams,
      pixels: rendered,
      imageUrl: previewUrl(rendered),
      evaluation: nextEvaluation,
    };
    setCandidates((current) => current.map((candidate) => (candidate.id === activeCandidate.id ? nextCandidate : candidate)));
    setEvaluation(nextEvaluation);
  }, [activeCandidate, reference, target]);

  const download = useCallback(() => {
    if (!activeCandidate) return;
    downloadRgbaImage(activeCandidate.pixels);
  }, [activeCandidate]);

  return {
    target,
    reference,
    prompt,
    setPrompt,
    strength,
    setStrength,
    status,
    error,
    plan,
    provider,
    candidates,
    activeCandidate,
    activeCandidateId,
    selectCandidate,
    evaluation,
    trace,
    iterations,
    elapsedMs,
    manualRefinements,
    conversation,
    visualReview,
    isReviewing,
    isBusy,
    loadTarget,
    loadReference,
    loadDemo,
    clearReference,
    clearTarget,
    analyze,
    updateParam,
    resetActiveParams,
    refineFromFeedback,
    reviewCurrentCandidate,
    download,
    resetResults,
    setError,
  };
}












