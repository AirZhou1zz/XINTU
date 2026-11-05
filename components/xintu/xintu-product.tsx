"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { ManualParameterPanel } from "./manual-parameter-panel";
import { useStudio } from "@/components/studio/use-studio";
import Frame91309 from "./frames/Frame91309";
import Frame91406 from "./frames/Frame91406";
import Frame91569 from "./frames/Frame91569";
import Frame91617 from "./frames/Frame91617";
import Frame91696 from "./frames/Frame91696";
import Frame91872 from "./frames/Frame91872";
import Frame9227 from "./frames/Frame9227";
import Frame9345 from "./frames/Frame9345";

type Screen = "landing" | "upload" | "processing" | "results" | "export" | "error";
type Preset = "custom" | "portrait" | "landscape" | "film";

const prompts: Record<Preset, string> = {
  custom: "日系、通透，肤色自然，保留皮肤纹理",
  portrait: "自然人像，肤色干净但有质感，高光柔和不溢出，保留皮肤纹理",
  landscape: "清透风景，天空层次丰富，远山有空气感，冷暖平衡且保留结构",
  film: "电影胶片感，暖黑阴影，低饱和高光，轻微颗粒，颜色克制但有记忆点",
};

const demoImages: Record<Preset, string> = {
  custom: "/demo/portrait.jpg",
  portrait: "/demo/portrait.jpg",
  landscape: "/demo/landscape.jpg",
  film: "/demo/film.jpg",
};

const frameSize = {
  desktop: { width: 1920, height: 1080 },
  landing: { width: 1920, height: 3500 },
  mobile: { width: 390, height: 844 },
} as const;

const appNodeIds = new Set([
  "9_235", "9_236", "9_237", "9_238", "9_245", "9_247", "9_264", "9_277", "9_283", "9_289", "9_333", "9_340",
  "9_351", "9_352", "9_353", "9_374", "9_376", "9_389", "9_391", "9_393", "9_395",
  "9_402", "9_403", "9_405", "9_406", "9_428", "9_1581", "9_1567", "9_1506", "9_1512", "9_1518",
  "9_1315", "9_1316", "9_1317", "9_1412", "9_1413", "9_1414", "9_1541", "9_1542", "9_1812",
  "9_1702", "9_1703", "9_1704", "9_1813", "9_1838", "9_1868", "9_1870", "9_1878", "9_1879", "9_1880",
  "9_1967", "9_1980", "9_1982", "9_1585", "9_1596", "9_1598", "9_1603", "9_1604", "9_1606", "9_1607", "9_1615", "9_1663", "9_1677", "9_1679", "9_1681", "9_1693",
]);

const quickPromptActions: Record<string, string> = {
  "9_389": "日系、通透，肤色自然，保留皮肤纹理",
  "9_391": "电影青橙，肤色自然，高光柔和",
  "9_393": "肤色自然，保留皮肤纹理与真实质感",
  "9_395": "低饱和胶片，轻颗粒，柔和对比和暖黑阴影",
  "9_1596": "肤色自然，保留皮肤纹理与真实质感",
  "9_1598": "低饱和胶片，轻颗粒，柔和对比和暖黑阴影",
};

const strengthActions: Record<string, "low" | "medium" | "high"> = {
  "9_402": "low",
  "9_403": "medium",
  "9_405": "high",
  "9_1603": "low",
  "9_1604": "medium",
  "9_1606": "high",
};

const newProjectIds = new Set(["9_351", "9_1315", "9_1412", "9_1702", "9_1878"]);
const historyIds = new Set(["9_352", "9_1316", "9_1413", "9_1703", "9_1879"]);
const presetMenuIds = new Set(["9_353", "9_1317", "9_1414", "9_1704", "9_1880"]);


function formatSigned(value: number) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function setNodeText(root: HTMLElement | null, id: string, value: string) {
  const node = root?.querySelector<HTMLElement>(`[id="${id}"]`);
  if (node && node.textContent !== value) node.textContent = value;
}

function setNodeImage(root: HTMLElement | null, id: string, url: string, overlay = "linear-gradient(180deg, rgba(5,5,5,0.04), rgba(5,5,5,0.42))") {
  const node = root?.querySelector<HTMLElement>(`[id="${id}"]`);
  if (!node) return;
  node.style.backgroundImage = `${overlay}, url("${url}")`;
  node.style.backgroundSize = "cover, cover";
  node.style.backgroundPosition = "center, center";
  node.style.backgroundRepeat = "no-repeat, no-repeat";
  node.style.opacity = "1";
  node.style.mixBlendMode = "normal";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type XintuProductProps = {
  initialPreset?: Preset;
};

export function XintuProduct({ initialPreset = "custom" }: XintuProductProps) {
  const studio = useStudio(prompts[initialPreset]);
  const [screen, setScreen] = useState<Screen>("landing");
  const [activePreset, setActivePreset] = useState<Preset>(initialPreset);
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [comparePosition, setComparePosition] = useState(52);
  const [parameterPanelOpen, setParameterPanelOpen] = useState(false);
  const [subjectiveScore, setSubjectiveScore] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const navigationTokenRef = useRef(0);

  const designSize = useMemo(() => {
    if (isMobile) return frameSize.mobile;
    return screen === "landing" ? frameSize.landing : frameSize.desktop;
  }, [isMobile, screen]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const mobile = window.innerWidth <= 767;
      const designWidth = mobile ? frameSize.mobile.width : designSize.width;
      const nextScale = Math.min(1, viewport.clientWidth / designWidth);
      setIsMobile(mobile);
      setScale(nextScale);
      setOffsetX(Math.max(0, (viewport.clientWidth - designWidth * nextScale) / 2));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [designSize.width]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const scrollToNode = useCallback((id: string) => {
    const target = stageRef.current?.querySelector<HTMLElement>(`[id="${id}"]`);
    const viewport = viewportRef.current;
    if (!target || !viewport) return;
    window.setTimeout(() => {
      const currentTarget = stageRef.current?.querySelector<HTMLElement>(`[id="${id}"]`);
      if (!currentTarget) return;
      const top = viewport.scrollTop + currentTarget.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 18;
      viewport.scrollTo({ top, behavior: "auto" });
    }, 80);
  }, []);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    if (screen === "upload") {
      setNodeText(root, "9_371", studio.target ? "已载入照片" : "拖入一张照片开始");
      setNodeText(root, "9_372", studio.target ? studio.target.name : "JPG / PNG / WebP · 最长边自动压缩至 1600px");
      setNodeText(root, "9_428", studio.target ? "生成 3 个候选" : "请先上传一张照片");
      if (isMobile) {
        setNodeText(root, "9_1590", studio.target ? "已载入照片" : "上传一张照片");
        setNodeText(root, "9_1591", studio.target ? studio.target.name : "JPG / PNG / WebP");
      }
    }
    if (screen === "processing") {
      setNodeText(root, "9_428", studio.target ? "生成 3 个候选" : "请先上传一张照片");
      setNodeText(root, "9_1350", studio.prompt);
      setNodeText(root, "9_1351", `${studio.prompt.length} / 500`);
    }
  }, [isMobile, screen, studio.prompt, studio.target]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || screen !== "landing") return;
    setNodeImage(root, "9_273", demoImages.portrait, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.52))");
    setNodeImage(root, "9_279", demoImages.landscape, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.52))");
    setNodeImage(root, "9_285", demoImages.film, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.52))");
  }, [screen]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || (screen !== "upload" && screen !== "processing")) return;

    const quickMap: Record<string, string> = {
      "9_389": quickPromptActions["9_389"],
      "9_391": quickPromptActions["9_391"],
      "9_393": quickPromptActions["9_393"],
      "9_395": quickPromptActions["9_395"],
      "9_1596": quickPromptActions["9_1596"],
      "9_1598": quickPromptActions["9_1598"],
    };
    Object.entries(quickMap).forEach(([id, prompt]) => {
      root.querySelector<HTMLElement>(`[id="${id}"]`)?.toggleAttribute("data-active", prompt === studio.prompt);
    });

    const strengthMap = { low: ["9_402", "9_1603"], medium: ["9_403", "9_1604"], high: ["9_405", "9_1606"] };
    Object.entries(strengthMap).forEach(([level, ids]) => {
      ids.forEach((id) => root.querySelector<HTMLElement>(`[id="${id}"]`)?.toggleAttribute("data-active", level === studio.strength));
    });
  }, [screen, studio.prompt, studio.strength]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || screen !== "results") return;

    const candidate = studio.activeCandidate;
    const candidates = studio.candidates;
    if (!candidate) return;

    setNodeImage(root, "9_1424", candidate.imageUrl, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.36))");
    candidates.forEach((item, index) => {
      const thumbId = ["9_1507", "9_1513", "9_1519"][index];
      if (thumbId) setNodeImage(root, thumbId, item.imageUrl, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.18))");
    });

    setNodeText(root, "9_1447", studio.prompt);
    setNodeText(root, "9_1492", `${candidate.id} / ${candidate.label.toUpperCase()}`);
    setNodeText(root, "9_1526", `${candidate.id} / ${candidate.label}`);
    setNodeText(root, "9_1528", candidate.evaluation.pass ? "PASS" : "DEGRADED");
    setNodeText(root, "9_1532", candidate.evaluation.deltaE === null ? "—" : candidate.evaluation.deltaE.toFixed(1));
    setNodeText(root, "9_1535", candidate.evaluation.skinShift.toFixed(1));
    setNodeText(root, "9_1538", `${(candidate.evaluation.structureScore * 100).toFixed(1)}%`);
    setNodeText(root, "9_1546", formatSigned(candidate.params.exposure));
    setNodeText(root, "9_1552", formatSigned(candidate.params.contrast));
    setNodeText(root, "9_1558", formatSigned(candidate.params.temperature));
    setNodeText(root, "9_1564", formatSigned(candidate.params.grain));

    candidates.forEach((item, index) => {
      const baseIds = [
        ["9_1509", "9_1510", "9_1511"],
        ["9_1515", "9_1516", "9_1517"],
        ["9_1521", "9_1522", "9_1523"],
      ][index];
      if (!baseIds) return;
      setNodeText(root, baseIds[0], `${item.id} / ${item.label}`);
      setNodeText(root, baseIds[1], item.description);
      const delta = item.evaluation.deltaE === null ? "—" : item.evaluation.deltaE.toFixed(1);
      setNodeText(root, baseIds[2], `ΔE ${delta} · 结构 ${(item.evaluation.structureScore * 100).toFixed(1)}%`);
    });

    ["9_1506", "9_1512", "9_1518"].forEach((id) => {
      const node = root.querySelector<HTMLElement>(`[id="${id}"]`);
      if (!node) return;
      const candidateId = id === "9_1506" ? "A" : id === "9_1512" ? "B" : "C";
      node.dataset.active = String(studio.activeCandidateId === candidateId);
    });
  }, [screen, studio.activeCandidate, studio.activeCandidateId, studio.candidates, studio.prompt]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || screen !== "results" || !isMobile) return;

    const candidate = studio.activeCandidate;
    if (!candidate) return;
    setNodeImage(root, "9_1630", candidate.imageUrl, "linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.4))");
    studio.candidates.forEach((item, index) => {
      const thumbId = ["9_1677", "9_1679", "9_1681"][index];
      if (thumbId) setNodeImage(root, thumbId, item.imageUrl, "linear-gradient(180deg, rgba(5,5,5,0.03), rgba(5,5,5,0.2))");
    });
    setNodeText(root, "9_1666", `${candidate.id} / ${candidate.label.toUpperCase()}`);
    setNodeText(root, "9_1686", candidate.evaluation.deltaE === null ? "—" : candidate.evaluation.deltaE.toFixed(1));
    setNodeText(root, "9_1689", candidate.evaluation.skinShift.toFixed(1));
    setNodeText(root, "9_1692", `${(candidate.evaluation.structureScore * 100).toFixed(1)}%`);
  }, [isMobile, screen, studio.activeCandidate, studio.candidates]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || screen !== "export") return;
    const candidate = studio.activeCandidate;
    if (!candidate) return;
    setNodeImage(root, "9_1712", candidate.imageUrl, "linear-gradient(180deg, rgba(26,26,26,0.05), rgba(26,26,26,0.3))");
    const exportImage = root.querySelector<HTMLElement>('[id="9_1712"]');
    if (exportImage) exportImage.style.backgroundSize = "cover, contain";
setNodeText(root, "9_1730", `${candidate.id} / ${candidate.label.toUpperCase()}`);
    setNodeText(root, "9_1751", studio.prompt);
    setNodeText(root, "9_1752", `${studio.prompt.length} / 500`);
    setNodeText(root, "9_1797", `${candidate.id} / ${candidate.label}`);
    setNodeText(root, "9_1799", candidate.evaluation.pass ? "PASS" : "DEGRADED");
    setNodeText(root, "9_1803", candidate.evaluation.deltaE === null ? "—" : candidate.evaluation.deltaE.toFixed(1));
    setNodeText(root, "9_1806", candidate.evaluation.skinShift.toFixed(1));
    setNodeText(root, "9_1809", `${(candidate.evaluation.structureScore * 100).toFixed(1)}%`);
    studio.candidates.forEach((item, index) => {
      const ids = [
        ["9_1844", "9_1845", "9_1846"],
        ["9_1850", "9_1851", "9_1852"],
        ["9_1856", "9_1857", "9_1858"],
      ][index];
      if (!ids) return;
      const delta = item.evaluation.deltaE === null ? "无参考" : `ΔE ${item.evaluation.deltaE.toFixed(1)}`;
      setNodeText(root, ids[0], `${item.id} / ${item.label}`);
      setNodeText(root, ids[1], item.description);
      setNodeText(root, ids[2], `${delta} · 结构 ${(item.evaluation.structureScore * 100).toFixed(1)}%`);
    });
    setNodeText(root, "9_1865", `xintu-color-grade.png · ${candidate.pixels.width} × ${candidate.pixels.height}`);
  }, [screen, studio.activeCandidate, studio.candidates, studio.prompt]);

  const startAnalysis = useCallback(async () => {
    if (!studio.target) {
      showNotice("请先上传一张照片。");
      return;
    }
    if (!studio.prompt.trim()) {
      showNotice("请先描述你想要的调色效果。");
      return;
    }
    const token = ++navigationTokenRef.current;
    setScreen("processing");
    const [success] = await Promise.all([studio.analyze(), wait(1100)]);
    if (navigationTokenRef.current === token) setScreen(success ? "results" : "error");
  }, [showNotice, studio]);

  const startWithFile = useCallback(async (file: File) => {
    const token = ++navigationTokenRef.current;
    const loaded = await studio.loadTarget(file);
    if (navigationTokenRef.current !== token) return;
    if (!loaded) {
      setScreen("error");
      return;
    }
    setScreen("upload");
    showNotice("照片已上传。现在可以描述想要的效果，再点击生成。");
  }, [showNotice, studio]);

  const startWithDemo = useCallback(async () => {
    const token = ++navigationTokenRef.current;
    const loaded = await studio.loadDemo(demoImages[activePreset]);
    if (navigationTokenRef.current !== token) return;
    if (!loaded) {
      setScreen("error");
      return;
    }
    setScreen("upload");
    showNotice("演示照片已载入。你可以修改描述后生成候选。");
  }, [activePreset, showNotice, studio]);

  const handleExport = useCallback(() => {
    if (!studio.activeCandidate) return;
    studio.download();
    setScreen("export");
  }, [studio]);

  const goHome = useCallback(() => {
    navigationTokenRef.current += 1;
    setActivePreset("custom");
    studio.clearTarget();
    setScreen("landing");
    window.setTimeout(() => viewportRef.current?.scrollTo({ top: 0, behavior: "auto" }), 80);
  }, [studio]);

  const choosePreset = useCallback((preset: Preset) => {
    setActivePreset(preset);
    studio.setPrompt(prompts[preset]);
    setScreen("upload");
  }, [studio]);

  const handleAction = useCallback((id: string) => {
    if (newProjectIds.has(id)) {
      setActivePreset("custom");
      studio.clearTarget();
      setScreen("upload");
      return;
    }

    if (historyIds.has(id)) {
      showNotice("当前还没有历史记录，完成一次导出后会保留在这里。");
      return;
    }

    if (presetMenuIds.has(id)) {
      setScreen("landing");
      window.setTimeout(() => scrollToNode("9_266"), 80);
      return;
    }

    if (screen === "landing") {
      if (id === "9_235" || id === "9_247") return scrollToNode("9_250");
      if (id === "9_236") return scrollToNode("9_294");
      if (id === "9_237") return scrollToNode("9_335");
      if (id === "9_277") return choosePreset("portrait");
      if (id === "9_283") return choosePreset("landscape");
      if (id === "9_289") return choosePreset("film");
      if (["9_238", "9_245", "9_264", "9_333", "9_340"].includes(id)) return setScreen("upload");
      return;
    }

    if (isMobile && screen === "upload") {
      if (quickPromptActions[id]) return studio.setPrompt(quickPromptActions[id]);
      if (strengthActions[id]) return studio.setStrength(strengthActions[id]);
      if (id === "9_1585" || id === "9_1581") return fileInputRef.current?.click();
      if (id === "9_1607") return referenceInputRef.current?.click();
      if (id === "9_1615") return studio.target ? void startAnalysis() : fileInputRef.current?.click();
      return;
    }

    if (screen === "upload") {
      if (quickPromptActions[id]) return studio.setPrompt(quickPromptActions[id]);
      if (strengthActions[id]) return studio.setStrength(strengthActions[id]);
      if (id === "9_374") return fileInputRef.current?.click();
      if (id === "9_428") {
        if (studio.target) return void startAnalysis();
        return fileInputRef.current?.click();
      }
      if (id === "9_406") return referenceInputRef.current?.click();
      if (id === "9_376") return void startWithDemo();
      return;
    }

    if (screen === "results") {
      if (id === "9_1567") return handleExport();
      if (id === "9_1663") { studio.download(); showNotice("PNG 已导出，原始尺寸与当前候选参数已保留。"); return; }
      if (id === "9_1542") return studio.resetActiveParams();
      if (id === "9_1693") return showNotice("当前候选参数已保留；桌面工作台可继续精细调整。");
      const candidateMap: Record<string, "A" | "B" | "C"> = {
        "9_1506": "A", "9_1512": "B", "9_1518": "C",
        "9_1677": "A", "9_1679": "B", "9_1681": "C",
      };
      if (candidateMap[id]) return studio.selectCandidate(candidateMap[id]);
      return;
    }

    if (screen === "export") {
      if (id === "9_1838" || id === "9_1868") { studio.download(); showNotice("PNG 已重新下载，原始尺寸与调色参数已保留。"); return; }
      if (id === "9_1813") return studio.resetActiveParams();
      if (id === "9_1870") return setScreen("results");
      return;
    }

    if (screen === "error") {
      if (id === "9_1967" || id === "9_1980" || id === "9_1982") {
        if (studio.target) return void startAnalysis();
        return fileInputRef.current?.click();
      }
    }
  }, [choosePreset, handleExport, isMobile, screen, scrollToNode, showNotice, startAnalysis, startWithDemo, studio]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
      if (!appNodeIds.has(element.id)) return;
      const activate = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        handleAction(element.id);
      };
      const activateFromKeyboard = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handleAction(element.id);
      };
      element.setAttribute("role", "button");
      element.tabIndex = 0;
      element.addEventListener("click", activate);
      element.addEventListener("keydown", activateFromKeyboard);
      cleanups.push(() => {
        element.removeEventListener("click", activate);
        element.removeEventListener("keydown", activateFromKeyboard);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [handleAction, screen]);

  const renderFrame = () => {
    if (screen === "landing") return <Frame9227 />;
    if (screen === "processing") return <Frame91309 />;
    if (screen === "results") return isMobile ? <Frame91617 /> : <Frame91406 />;
    if (screen === "export") return <Frame91696 />;
    if (screen === "error") return <Frame91872 />;
    return isMobile ? <Frame91569 prompt={studio.prompt} onPromptChange={studio.setPrompt} /> : <Frame9345 prompt={studio.prompt} onPromptChange={studio.setPrompt} />;
  };

  return (
    <div className="xintu-product" data-preset={activePreset}>
      <input
        ref={fileInputRef}
        className="xintu-hidden-input"
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) void startWithFile(file);
        }}
      />
      <input
        ref={referenceInputRef}
        className="xintu-hidden-input"
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) void studio.loadReference(file);
        }}
      />
      <div className="sr-only" aria-live="polite">
        {screen === "processing" ? "正在分析照片并生成调色候选。" : screen === "results" ? "调色结果已生成。" : screen === "error" ? "生成失败，可以重新尝试。" : ""}
      </div>
      {screen !== "landing" ? (
        <button type="button" className="xintu-home-button" onClick={goHome}>
          <ArrowLeft size={15} />
          返回首页
        </button>
      ) : null}
      {screen !== "landing" ? (
        <div className={`xintu-provider-status ${studio.provider ?? "pending"}`} role="status" aria-live="polite">
          <span className="xintu-provider-dot" aria-hidden="true" />
          {studio.provider === "openai-compatible" ? "QWEN 3.8 · LIVE" : studio.provider === "mock" ? "LOCAL DEMO" : "AI READY"}
        </div>
      ) : null}
      {notice ? <div className="xintu-notice" role="status">{notice}</div> : null}
      {screen === "results" && studio.activeCandidate ? (
        <button
          type="button"
          className="xintu-tune-trigger"
          onClick={() => setParameterPanelOpen(true)}
          aria-expanded={parameterPanelOpen}
          aria-controls="xintu-parameter-panel"
        >
          <SlidersHorizontal size={16} />
          <span>参数微调</span>
          <small>13</small>
        </button>
      ) : null}
      {isMobile && screen === "upload" ? (
        <button type="button" className="xintu-mobile-demo" onClick={() => void startWithDemo()}>
          没有照片？载入演示
        </button>
      ) : null}
      <div ref={viewportRef} className="xintu-viewport">
        <div
          className="xintu-stage-spacer"
          style={{ height: designSize.height * scale }}
        >
          <div
            key={screen}
            ref={stageRef}
            className={`xintu-stage ${screen === "processing" ? "xintu-processing-cursor" : ""}`}
            data-mobile={isMobile}
            style={{
              width: designSize.width,
              height: designSize.height,
              left: offsetX,
              transform: `scale(${scale})`,
            }}
          >
            {renderFrame()}
            {screen === "results" && studio.target && studio.activeCandidate ? (
              <div className={`xintu-compare ${isMobile ? "mobile" : "desktop"}`}>
                <div
                  className="xintu-compare-backdrop"
                  style={{ backgroundImage: `url("${studio.activeCandidate.imageUrl}")` }}
                />
                <div
                  className="xintu-compare-original"
                  style={{ backgroundImage: `url("${studio.target.previewUrl}")` }}
                />
                <div
                  className="xintu-compare-result"
                  style={{
                    backgroundImage: `url("${studio.activeCandidate.imageUrl}")`,
                    clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                  }}
                />
                <div className="xintu-compare-divider" style={{ left: `${comparePosition}%` }}>
                  <span><ArrowLeftRight size={14} /></span>
                </div>
                <div className="xintu-compare-meta">
                  <span>{studio.activeCandidate.id} / {studio.activeCandidate.label}</span>
                  <span>拖动对比 · 完整画面</span>
                </div>
                <span className="xintu-compare-label original-label">原图</span>
                <span className="xintu-compare-label result-label">成片</span>
                <input
                  className="xintu-compare-range"
                  type="range"
                  min={0}
                  max={100}
                  value={comparePosition}
                  aria-label="拖动查看原图与成片对比"
                  onChange={(event) => setComparePosition(Number(event.target.value))}
                />
              </div>
            ) : null}
          </div>
        </div>
      {screen === "results" && studio.activeCandidate ? (
        <ManualParameterPanel
          open={parameterPanelOpen}
          params={studio.activeCandidate.params}
          aiParams={studio.activeCandidate.aiParams}
          evaluation={studio.activeCandidate.evaluation}
          iterations={studio.iterations}
          elapsedMs={studio.elapsedMs}
          manualRefinements={studio.manualRefinements}
          conversation={studio.conversation}
          busy={studio.isBusy || studio.isReviewing}
          visualReview={studio.visualReview}
          isReviewing={studio.isReviewing}
          subjectiveScore={subjectiveScore}
          onReview={studio.reviewCurrentCandidate}
          onSubjectiveScore={setSubjectiveScore}
          onChange={studio.updateParam}
          onReset={studio.resetActiveParams}
          onClose={() => setParameterPanelOpen(false)}
          onAccept={() => { setParameterPanelOpen(false); showNotice("当前参数已应用，可继续导出 PNG。"); }}
          onExport={() => { setParameterPanelOpen(false); handleExport(); }}
          onFeedback={studio.refineFromFeedback}
        />
      ) : null}
      </div>
    </div>
  );
}
