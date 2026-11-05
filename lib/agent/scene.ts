import type { CandidateDirection, SceneCategory, SceneHints } from "@/lib/color/types";

export const sceneLabels: Record<SceneCategory, string> = {
  portrait: "人像",
  landscape: "风景",
  ocean: "海岸",
  mountain: "山川",
  night: "夜景",
  city: "城市",
  still_life: "静物",
  other: "综合",
};

const directions: Record<SceneCategory, CandidateDirection[]> = {
  portrait: [
    { id: "A", label: "自然肤质", description: "保护肤色与面部结构，整体自然耐看。", style: "natural" },
    { id: "B", label: "暖调胶片", description: "暖黑阴影、克制饱和与轻微颗粒。", style: "warm_film" },
    { id: "C", label: "清透柔光", description: "柔和高光，提亮中间调，保持皮肤质感。", style: "soft" },
  ],
  landscape: [
    { id: "A", label: "空气感风景", description: "保留远景层次，提升画面通透感。", style: "airy" },
    { id: "B", label: "电影远山", description: "冷暖分离，压低高光并强化空间层次。", style: "cinematic" },
    { id: "C", label: "旅行鲜明", description: "增强自然色彩，让天空和植被更清晰。", style: "vivid" },
  ],
  ocean: [
    { id: "A", label: "清透海岸", description: "保持海水蓝青关系与高光层次。", style: "airy" },
    { id: "B", label: "日落暖海", description: "暖化高光，压低阴影，形成日落氛围。", style: "warm_film" },
    { id: "C", label: "电影深蓝", description: "收敛环境色，强化深蓝与青色层次。", style: "cinematic" },
  ],
  mountain: [
    { id: "A", label: "自然山野", description: "保护绿色与岩石细节，保持自然关系。", style: "natural" },
    { id: "B", label: "冷暖远山", description: "拉开远近层次，柔和远景并控制高光。", style: "cinematic" },
    { id: "C", label: "胶片旅行", description: "低饱和、暖阴影与轻微颗粒的旅行质感。", style: "warm_film" },
  ],
  night: [
    { id: "A", label: "夜色保真", description: "保护霓虹色彩与暗部，不把夜景提成白天。", style: "natural" },
    { id: "B", label: "电影霓虹", description: "青紫暗部、柔和高光与克制对比。", style: "cinematic" },
    { id: "C", label: "暖调夜行", description: "暖化灯光，保留环境暗部与氛围。", style: "warm_film" },
  ],
  city: [
    { id: "A", label: "城市纪实", description: "保留建筑和街景结构，颜色自然克制。", style: "natural" },
    { id: "B", label: "青橙街景", description: "冷阴影与暖高光形成电影街景关系。", style: "cinematic" },
    { id: "C", label: "鲜明都市", description: "强化灯光和色彩，让城市更有节奏。", style: "vivid" },
  ],
  still_life: [
    { id: "A", label: "自然材质", description: "保留物体纹理与真实色彩。", style: "natural" },
    { id: "B", label: "暖调静物", description: "温暖高光与克制阴影，突出材质层次。", style: "warm_film" },
    { id: "C", label: "柔光质感", description: "柔和对比，减少高光刺激并突出细节。", style: "soft" },
  ],
  other: [
    { id: "A", label: "自然平衡", description: "优先保护结构，做稳健的全局校正。", style: "natural" },
    { id: "B", label: "电影氛围", description: "柔和对比、轻颗粒和克制色彩。", style: "cinematic" },
    { id: "C", label: "清透风格", description: "提升中间调与去雾感，保持细节。", style: "airy" },
  ],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function promptIncludes(prompt: string, words: string[]) {
  const normalized = prompt.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

export function detectScene(hints: SceneHints | undefined, prompt: string) {
  if (!hints) {
    const category: SceneCategory = promptIncludes(prompt, ["人", "肖像", "肤", "自拍"])
      ? "portrait"
      : promptIncludes(prompt, ["海", "海岸", "沙滩"])
        ? "ocean"
        : promptIncludes(prompt, ["山", "森林", "树"])
          ? "mountain"
          : promptIncludes(prompt, ["夜", "霓虹", "城市", "街"])
            ? "night"
            : "other";
    return { category, confidence: 0.4 };
  }

  if (hints.skinRatio > 0.045 || promptIncludes(prompt, ["人像", "肖像", "肤色", "自拍"])) {
    return { category: "portrait" as const, confidence: clamp(0.58 + hints.skinRatio * 4.5, 0.58, 0.96) };
  }
  if (hints.averageLuma < 0.3 || promptIncludes(prompt, ["夜景", "霓虹", "夜晚"])) {
    return {
      category: (promptIncludes(prompt, ["城市", "街", "建筑"]) ? "city" : "night") as SceneCategory,
      confidence: clamp(0.58 + (0.3 - hints.averageLuma), 0.58, 0.94),
    };
  }
  if (hints.waterRatio > 0.2 && hints.skyRatio > 0.06) {
    return { category: "ocean" as const, confidence: clamp(0.58 + hints.waterRatio * 0.8, 0.58, 0.95) };
  }
  if (hints.natureRatio > 0.24 && hints.skyRatio > 0.04) {
    return { category: "mountain" as const, confidence: clamp(0.56 + hints.natureRatio * 0.7, 0.56, 0.93) };
  }
  if (promptIncludes(prompt, ["海", "海岸", "沙滩"])) return { category: "ocean" as const, confidence: 0.72 };
  if (promptIncludes(prompt, ["山", "森林", "草原"])) return { category: "mountain" as const, confidence: 0.7 };
  if (promptIncludes(prompt, ["城市", "街", "建筑"])) return { category: "city" as const, confidence: 0.68 };
  if (hints.skyRatio > 0.1 || hints.natureRatio > 0.12) {
    return { category: "landscape" as const, confidence: clamp(0.52 + hints.skyRatio * 0.6, 0.52, 0.9) };
  }
  return { category: "other" as const, confidence: 0.42 };
}

export function directionsForScene(category: SceneCategory): CandidateDirection[] {
  return directions[category];
}