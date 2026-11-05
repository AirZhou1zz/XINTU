import type { AgentPlan, CandidateDirection, SceneCategory, SceneHints } from "@/lib/color/types";

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
  const explicitPortrait = promptIncludes(prompt, ["人像", "肖像", "自拍", "写真", "证件照"]);
  const explicitOcean = promptIncludes(prompt, ["海", "海岸", "沙滩", "海边"]);
  const explicitMountain = promptIncludes(prompt, ["山", "森林", "草原", "树林"]);
  const explicitLandscape = promptIncludes(prompt, ["风景", "风光", "远景", "全景"]);
  const explicitNight = promptIncludes(prompt, ["夜景", "霓虹", "夜晚"]);
  const explicitCity = promptIncludes(prompt, ["城市", "街道", "街景", "马路", "汽车", "车辆", "车流", "建筑"]);

  if (!hints) {
    const category: SceneCategory = explicitPortrait
      ? "portrait"
      : explicitOcean
        ? "ocean"
        : explicitMountain
          ? "mountain"
          : explicitCity
            ? "city"
            : explicitNight
              ? "night"
              : explicitLandscape
                ? "landscape"
                : "other";
    return { category, confidence: category === "other" ? 0.4 : 0.62 };
  }

  const centralSkinRatio = hints.centralSkinRatio ?? hints.skinRatio * 0.5;
  const skinCenterShare = centralSkinRatio / Math.max(0.001, hints.skinRatio);
  const portraitEvidence =
    hints.skinRatio >= 0.09
    && centralSkinRatio >= 0.055
    && skinCenterShare >= 0.45;
  if (explicitCity && !explicitPortrait) {
    return { category: "city" as const, confidence: 0.86 };
  }
  if (explicitPortrait) {
    return { category: "portrait" as const, confidence: clamp(0.72 + hints.skinRatio, 0.72, 0.96) };
  }
  if (explicitOcean) return { category: "ocean" as const, confidence: 0.84 };
  if (explicitMountain) return { category: "mountain" as const, confidence: 0.82 };
  if (explicitLandscape) {
    if (hints.waterRatio > 0.18 && hints.skyRatio > 0.05) {
      return { category: "ocean" as const, confidence: 0.78 };
    }
    if (hints.natureRatio > 0.16 && hints.skyRatio > 0.04) {
      return { category: "mountain" as const, confidence: 0.76 };
    }
    return { category: "landscape" as const, confidence: 0.76 };
  }
  if (portraitEvidence) {
    return {
      category: "portrait" as const,
      confidence: clamp(0.58 + centralSkinRatio * 2.4 + skinCenterShare * 0.18, 0.62, 0.96),
    };
  }
  if (hints.averageLuma < 0.3 || explicitNight) {
    return {
      category: (explicitCity || promptIncludes(prompt, ["城市", "街", "建筑"]) ? "city" : "night") as SceneCategory,
      confidence: clamp(0.58 + Math.max(0, 0.3 - hints.averageLuma), 0.58, 0.94),
    };
  }
  if (hints.waterRatio > 0.2 && hints.skyRatio > 0.06) {
    return { category: "ocean" as const, confidence: clamp(0.58 + hints.waterRatio * 0.8, 0.58, 0.95) };
  }
  if (hints.natureRatio > 0.24 && hints.skyRatio > 0.04) {
    return { category: "mountain" as const, confidence: clamp(0.56 + hints.natureRatio * 0.7, 0.56, 0.93) };
  }
  if (explicitCity) return { category: "city" as const, confidence: 0.7 };
  if (hints.skyRatio > 0.08 || hints.natureRatio > 0.1 || hints.waterRatio > 0.08) {
    return {
      category: "landscape" as const,
      confidence: clamp(0.56 + Math.max(hints.skyRatio, hints.natureRatio, hints.waterRatio) * 0.9, 0.56, 0.9),
    };
  }
  return { category: "other" as const, confidence: 0.42 };
}

export function reconcileScenePlan(
  plan: AgentPlan,
  hints: SceneHints | undefined,
  prompt: string,
): AgentPlan {
  const detected = detectScene(hints, prompt);
  if (detected.confidence < 0.62) return plan;

  const directionText = plan.directions.map((item) => `${item.label} ${item.description}`).join(" ");
  const hasPortraitCopy = /肤色|皮肤|人像|面部|肤质/.test(directionText);
  const portraitMismatch =
    (plan.sceneCategory === "portrait") !== (detected.category === "portrait");
  const copyMismatch = detected.category !== "portrait" && hasPortraitCopy;

  if (!portraitMismatch && !copyMismatch) return plan;
  return {
    ...plan,
    sceneCategory: detected.category,
    sceneConfidence: detected.confidence,
    sceneSummary: `${sceneLabels[detected.category]}场景，已按画面结构校正候选方向。${plan.sceneSummary}`.slice(0, 500),
    directions: directionsForScene(detected.category, hints, prompt),
  };
}
export function directionsForScene(
  category: SceneCategory,
  hints?: SceneHints,
  prompt = "",
): CandidateDirection[] {
  if (!hints) return directions[category];

  const dark = hints.averageLuma < 0.38;
  const bright = hints.averageLuma > 0.66;
  const clipped = hints.clippingRatio > 0.045;
  const aquatic = hints.waterRatio > 0.16 && hints.skyRatio > 0.05;
  const lush = hints.natureRatio > 0.2;
  const warmRequest = promptIncludes(prompt, ["暖", "日落", "金黄", "夕阳"]);
  const coolRequest = promptIncludes(prompt, ["冷", "蓝", "青", "通透", "夜"]);

  if (category === "portrait") {
    if (dark) {
      return [
        { id: "A", label: "自然提亮", description: "抬升中间调与阴影，优先保持肤色自然。", style: "natural" },
        { id: "B", label: "暖调补光", description: "补充暖色光感，降低暗部灰闷和肤色偏冷。", style: "warm_film" },
        { id: "C", label: "夜景柔光", description: "压住高光、轻抬阴影，保留夜景氛围。", style: "cinematic" },
      ];
    }
    if (clipped) {
      return [
        { id: "A", label: "高光收敛", description: "降低高光和对比，找回面部与背景细节。", style: "soft" },
        { id: "B", label: "自然肤色", description: "控制肤色饱和与暖度，做稳健的人像校正。", style: "natural" },
        { id: "C", label: "柔光电影", description: "柔化高光并压低整体对比，保留质感。", style: "cinematic" },
      ];
    }
    if (warmRequest || hints.temperatureBias > 0.08) {
      return [
        { id: "A", label: "暖调写真", description: "强化暖光与肤色层次，保持自然不过黄。", style: "warm_film" },
        { id: "B", label: "自然肤色", description: "优先保护肤色和面部结构。", style: "natural" },
        { id: "C", label: "清透柔光", description: "提亮中间调，柔化高光并保留皮肤纹理。", style: "soft" },
      ];
    }
    if (coolRequest || hints.temperatureBias < -0.08) {
      return [
        { id: "A", label: "冷调平衡", description: "收敛偏冷色偏，同时保持肤色自然。", style: "natural" },
        { id: "B", label: "清透肤色", description: "降低灰雾感，让肤色与层次更通透。", style: "airy" },
        { id: "C", label: "电影冷调", description: "保留冷色氛围，柔化高光并控制对比。", style: "cinematic" },
      ];
    }
  }

  if (category === "landscape" || category === "mountain" || category === "ocean") {
    if (aquatic) {
      return [
        { id: "A", label: "清透水色", description: "保留蓝青层次，提升天空与水面的通透感。", style: "airy" },
        { id: "B", label: "蓝青强化", description: "加强水体和天空色彩，让冷色关系更鲜明。", style: "vivid" },
        { id: "C", label: "日落暖海", description: "暖化高光，压低阴影，形成日落氛围。", style: "warm_film" },
      ];
    }
    if (clipped) {
      return [
        { id: "A", label: "高光收敛", description: "降低天空与云层高光，找回亮部层次。", style: "soft" },
        { id: "B", label: "清透空气感", description: "适度去雾并提亮中间调，保持远景细节。", style: "airy" },
        { id: "C", label: "柔和远山", description: "压低对比与清晰度，让空间层次更柔和。", style: "cinematic" },
      ];
    }
    if (dark) {
      return [
        { id: "A", label: "自然提亮", description: "抬升阴影与中间调，保留山脉或海岸结构。", style: "natural" },
        { id: "B", label: "暮色冷暖", description: "拉开冷暖关系，建立黄昏或夜景氛围。", style: "cinematic" },
        { id: "C", label: "电影山野", description: "轻抬阴影并加入克制色彩与颗粒。", style: "warm_film" },
      ];
    }
    if (lush) {
      return [
        { id: "A", label: "自然山野", description: "保护绿色和岩石细节，保持自然关系。", style: "natural" },
        { id: "B", label: "清透远山", description: "增强空气感，保留天空与远景层次。", style: "airy" },
        { id: "C", label: "胶片旅行", description: "低饱和、暖阴影与轻微颗粒的旅行质感。", style: "warm_film" },
      ];
    }
  }

  if (category === "night" || category === "city") {
    if (hints.skyRatio + hints.waterRatio > 0.12) {
      return [
        { id: "A", label: "夜色保真", description: "保护霓虹与暗部，不把夜景提成白天。", style: "natural" },
        { id: "B", label: "电影霓虹", description: "青紫暗部与柔和高光，强化电影氛围。", style: "cinematic" },
        { id: "C", label: "暖调夜行", description: "暖化灯光并保留环境暗部。", style: "warm_film" },
      ];
    }
    if (bright) {
      return [
        { id: "A", label: "自然压光", description: "收敛过亮区域，保留灯光色彩。", style: "natural" },
        { id: "B", label: "霓虹对比", description: "增强灯光对比与颜色分离。", style: "vivid" },
        { id: "C", label: "电影夜色", description: "压低高光并加入克制颗粒与暗角。", style: "cinematic" },
      ];
    }
  }

  if (category === "still_life") {
    return dark
      ? [
          { id: "A", label: "自然提亮", description: "轻抬阴影，让材质与轮廓更清楚。", style: "natural" },
          { id: "B", label: "暖调静物", description: "暖化高光并保留物体纹理。", style: "warm_film" },
          { id: "C", label: "柔光质感", description: "降低对比与高光刺激，突出细节。", style: "soft" },
        ]
      : directions.still_life;
  }

  return directions[category];
}