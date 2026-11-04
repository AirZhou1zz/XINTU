# 心图：Bounded Agentic Color Grading Workflow 设计规格

日期：2026-11-02  
版本：v1.0  
状态：待用户评审  
项目类型：垂直 AI 应用 / 有界 Agentic Workflow

## 1. 产品定义

心图是一个面向人像与旅行照片的非生成式 AI 调色工作台。多模态模型负责理解图片与用户意图，规划调色步骤并生成结构化参数；Canvas 负责确定性渲染。产品不生成新像素，不改变画面内容，最终结果可解释、可微调、可回退。

首发版本定位：

> 让 AI 规划调色，而不是替你生成一张新照片。

## 2. 目标与非目标

### 2.1 目标

- 用户上传照片后，用自然语言描述想要的风格，或上传参考图。
- AI 先分析画面问题，再动态选择调色工具和顺序。
- 生成 1–3 组候选调色参数，并在浏览器本地确定性渲染。
- 对结果进行指标评估，不通过时最多修正 2 轮。
- 展示规划、执行、评估、修正过程，让用户理解 AI 为什么这样调。
- 支持无 API Key 的 Mock 模式，保证 GitHub 可运行和可演示。
- 桌面端与移动端均可完成核心流程。
- 代码简洁、模块边界清晰、有测试、有文档、可直接开源。

### 2.2 非目标

- 不做 AI 生图、扩图、擦除、抠图、换背景。
- 不做登录、支付、会员、订单、云端历史。
- 不做微信小程序。
- 不做批量处理。
- 不做无限自主 Agent。
- 不自动发布或对外发送用户图片。

## 3. 目标用户与核心场景

### 3.1 用户

- 经常拍人像或旅行照片、想快速追色的轻度创作者。
- 想体验 AI 调色但仍希望保留控制权的普通用户。
- 查看 GitHub 和 Demo 的 AI 产品经理、招聘官、开发者。

### 3.2 核心场景

1. 用户上传一张人像或旅行照片。
2. 用户输入“日系一点、通透、肤色自然”。
3. AI 分析画面并规划：全局曝光 → 白平衡 → 肤色保护 → 天空/背景 → HSL。
4. 系统生成候选参数，Canvas 在本地渲染 3 个候选。
5. 系统评估肤色、天空、结构、参数合法率和参考相似度。
6. 如果未达标，自动修正参数并重新渲染。
7. 用户选择候选，微调参数并导出 PNG。

## 4. 视觉方向：Silver Halide Color Lab

### 4.1 设计读法

面向创作者与招聘官的垂直 AI 调色工作台，采用暖银灯箱、电影后期工作台与编辑式排版语言，使用钴蓝、朱红、藏红花黄与翡翠绿作为高级撞色，不使用大面积黑色背景，不使用 AI 紫色渐变。

### 4.2 设计参数

- DESIGN_VARIANCE：8
- MOTION_INTENSITY：5
- VISUAL_DENSITY：4
- 主题：浅色电影工作台，默认 Silver Halide，保留浅色 token 体系。

### 4.3 色彩 token

| Token | 色值 | 用途 |
|---|---|---|
| `--bg-canvas` | `#D9D5CC` | 主工作台背景 |
| `--bg-paper` | `#F1ECE3` | 主面板、输入区 |
| `--bg-steel` | `#A9B0AF` | 次级面板、分隔层 |
| `--bg-mist` | `#7F969C` | 画布边缘、辅助层次 |
| `--ink` | `#2F454B` | 主文字、深色按钮，不作为大面积背景 |
| `--text-muted` | `#667477` | 次级说明文字 |
| `--accent-cobalt` | `#2447FF` | AI 规划、主操作 |
| `--accent-vermilion` | `#F05A42` | 修正、警告、撞色重点 |
| `--accent-saffron` | `#F0B43C` | 指标、评分、高光 |
| `--accent-emerald` | `#1D9C84` | 通过、稳定、结构保护 |
| `--line` | `#B9B6AE` | 常规边框 |
| `--focus` | `#2447FF` | 键盘焦点 |

电影色阶渐变只用于画布柔光、Agent Trace 能量轨道、品牌光谱线和加载扫描带：

```css
linear-gradient(120deg, #D9D5CC 0%, #AAB8B7 28%, #7F969C 52%, #C78970 76%, #E6B75A 100%)
```

### 4.4 字体

- 中文标题：Noto Serif SC / Source Han Serif SC
- 中文正文：Noto Sans SC
- 指标与状态：IBM Plex Mono

### 4.5 视觉规则

- 大面积不使用黑色。
- 不使用 AI 紫色渐变。
- 不使用全站玻璃拟态。
- 渐变只作为签名元素，不作为背景壁纸。
- 主要面板使用 2–8px 小圆角。
- 画布使用暖银灯箱底与极细钴蓝/朱红双色边线。
- Agent Trace 使用钴蓝 → 翡翠绿 → 藏红花黄 → 朱红的状态轨道。
- 状态不能只依赖颜色，必须同时有文字或图标。

## 5. 页面结构

### 5.1 桌面端

```text
┌──────────────────────────────────────────────────────────────┐
│ 心图 / SILVER HALIDE COLOR LAB      [隐私] [案例] [导出]     │
├──────────────────────────────────────┬───────────────────────┤
│                                      │  AI COLOR DIRECTOR    │
│     暖银灯箱式 Before / After 画布     │                       │
│                                      │  01 目标描述           │
│   浮动指标：ΔE / 肤色 / 天空 / 结构    │  [日系、通透、肤色自然] │
│                                      │                       │
│   候选方案 A / B / C                  │  02 参考图             │
│                                      │  [上传参考图]           │
│                                      │                       │
│                                      │  03 Agent Trace        │
│                                      │  PLAN → APPLY →        │
│                                      │  EVALUATE → REFINE     │
│                                      │                       │
│                                      │  [生成 3 个候选]        │
└──────────────────────────────────────┴───────────────────────┘
```

布局比例：画布区 62%，控制区 38%。

### 5.2 移动端

- 画布区置顶，占约 45% 屏高。
- 下方为可上拉的操作面板。
- Agent Trace 横向滚动。
- 主操作固定在底部安全区。
- 不使用窄双栏硬压缩。

### 5.3 空状态

- 目标照片上传卡片。
- 参考图上传卡片。
- Prompt 输入与示例快捷词。
- Mock 模式提示。
- 隐私说明入口。

### 5.4 处理状态

Agent Trace 展示四个阶段：

1. PLAN：分析画面与意图。
2. APPLY：选择工具并生成参数。
3. EVALUATE：计算指标并判断是否通过。
4. REFINE：偏差修正，最多 2 轮。

每个阶段显示状态、工具名、关键指标和一句可读说明。

### 5.5 结果状态

- 前后拖动对比。
- 候选 A/B/C 切换。
- 参数面板显示曝光、对比度、色温、色调、饱和度、高光、阴影、清晰度、去朦胧、颗粒、暗角、肤色保护、天空平衡。
- 评估面板显示 ΔE、肤色偏移、天空偏移、结构保持、参数合法率、迭代次数、耗时。
- 主操作：接受结果、继续修正、导出 PNG。

### 5.6 失败状态

- 图片格式不支持：解释支持 JPG/PNG/WebP。
- 图片过大：提示压缩或自动降采样。
- 模型超时：显示重试，不扣留状态。
- 参数非法：自动裁剪并记录修正原因。
- 修正未通过：明确说明失败指标，输出降级结果，不伪造成功。
- 无 API Key：自动切换 Mock 模式并明确标识。

## 6. Agentic 工作流

```text
用户意图 + 目标图片 + 可选参考图
  ↓
场景分析与意图解析
  ↓
动态规划：选择工具与顺序
  ↓
生成结构化调色参数
  ↓
参数 schema 校验与范围裁剪
  ↓
Canvas 确定性渲染候选
  ↓
结果评估：算法指标 + 可选视觉模型评审
  ↓
通过？ → 输出候选
  ↓
未通过 → 生成修正参数 → 重新渲染
  ↓
最多 2 轮修正
  ↓
仍不通过 → 降级输出 + 明确提示
```

### 6.1 工具集合

- `global_grade`：曝光、对比度、色温、色调、高光、阴影。
- `skin_protect`：肤色色温、肤色明暗与橙色饱和度保护。
- `sky_balance`：天空色温、天空明度与蓝色饱和度。
- `hsl`：8 色通道调整。
- `curve`：5 点亮度曲线。
- `lut`：参考图追色与 3D LUT。
- `texture`：清晰度、去朦胧、颗粒、暗角。

### 6.2 规划约束

- 规划必须基于画面特征与用户意图。
- 只选择与当前图片相关的工具。
- 每次最多选择 4 个工具。
- 不允许调用生成像素、改变内容或外部发布工具。
- 参数必须在允许范围内，超出范围自动裁剪并记录。
- 规划结果必须可序列化、可展示、可复现。

### 6.3 评估维度

- 参数 schema 合法率。
- 参考图平均 ΔE2000。
- 肤色区域偏移。
- 天空区域偏移。
- 高光与阴影剪切比例。
- 灰度结构相关性。
- 端到端耗时。
- 用户主观评分，仅作为外部反馈，不进入自动修正闭环。

### 6.4 修正策略

- 第一轮修正优先处理最严重的单一问题。
- 第二轮修正处理剩余问题，并降低调整幅度。
- 每轮修正必须记录原因、参数变化和评估变化。
- 不允许无限循环。
- 达到质量阈值、最大迭代次数、时间预算或成本预算时停止。
- 用户主动确认也可停止。

## 7. 技术架构

### 7.1 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Canvas 2D
- Zod
- Vitest
- 可选 OpenAI-compatible Provider
- Mock Provider

### 7.2 模块

```text
app/
  page.tsx
  api/agent/analyze/route.ts
  api/agent/refine/route.ts

components/
  studio/
    studio-shell.tsx
    image-upload.tsx
    before-after.tsx
    prompt-panel.tsx
    reference-upload.tsx
    agent-trace.tsx
    evaluation-panel.tsx
    candidate-rail.tsx
    parameter-panel.tsx

lib/
  color/
    schema.ts
    engine.ts
    metrics.ts
    types.ts
  agent/
    planner.ts
    evaluator.ts
    loop.ts
    types.ts
  ai/
    provider.ts
    openai-compatible.ts
    mock-provider.ts
    prompt.ts
  image/
    load.ts
    resize.ts
    export.ts

tests/
  schema.test.ts
  engine.test.ts
  metrics.test.ts
  planner.test.ts
  loop.test.ts
```

### 7.3 数据流

1. 客户端加载图片，限制最长边不超过 2048px。
2. 客户端将目标图片、参考图、用户意图和强度发送到 `/api/agent/analyze`。
3. 服务端调用 Provider 或 Mock Provider，返回规划与初始参数。
4. 服务端使用 Zod 校验输出，并裁剪非法参数。
5. 客户端 Canvas 渲染候选并计算本地指标。
6. 如果评估未通过，客户端将当前参数、指标和失败原因发送到 `/api/agent/refine`。
7. 服务端返回修正参数和修正说明。
8. 客户端重新渲染并评估，最多 2 轮。
9. 用户选择候选并导出 PNG。

### 7.4 数据契约

```ts
type ToolId =
  | "global_grade"
  | "skin_protect"
  | "sky_balance"
  | "hsl"
  | "curve"
  | "lut"
  | "texture";

type AgentPlan = {
  intent: string;
  sceneSummary: string;
  tools: ToolId[];
  constraints: string[];
};

type ColorParams = {
  exposure: number;
  contrast: number;
  temperature: number;
  tint: number;
  saturation: number;
  highlights: number;
  shadows: number;
  clarity: number;
  dehaze: number;
  grain: number;
  vignette: number;
  skinWarmth: number;
  skyTemperature: number;
};

type EvaluationResult = {
  pass: boolean;
  deltaE: number | null;
  skinShift: number;
  skyShift: number;
  structureScore: number;
  clippingRatio: number;
  schemaValid: boolean;
  findings: string[];
  nextAction: "accept" | "refine" | "degrade";
};
```

### 7.5 Provider 接口

```ts
interface ColorProvider {
  analyze(input: AnalyzeInput): Promise<{ plan: AgentPlan; params: ColorParams }>;
  refine(input: RefineInput): Promise<{ params: ColorParams; rationale: string }>;
}
```

Provider 不允许直接返回 HTML、脚本或自由格式像素数据。

## 8. 安全与合规

- API Key 只存在于服务端环境变量。
- 不在日志中记录用户图片、Prompt 或完整模型响应。
- 请求体大小限制为 15MB。
- 模型调用超时 20 秒。
- 服务端校验输入图片 MIME 与实际文件签名。
- 服务端使用 Zod 校验模型输出。
- 客户端与 API 均执行参数范围裁剪。
- 不持久化用户图片。
- 无 API Key 时自动使用 Mock Provider。
- 页面明确说明：AI 模式会将图片发送给模型服务进行分析；渲染在浏览器本地完成；不用于训练。
- 不提供自动发布、外部上传或账户数据同步。
- 不使用未经许可的第三方图片素材。

## 9. 可访问性与性能

- 所有交互支持键盘。
- 可见 focus ring，使用钴蓝。
- 状态同时使用文字和颜色表达。
- 支持 `prefers-reduced-motion`。
- 图片上传与结果区提供替代文本。
- 对比度达到 WCAG AA。
- 最长边超过 2048px 的图片自动降采样。
- 使用 `createImageBitmap` 与 Canvas 处理，避免阻塞主线程。
- 首屏不加载重型动画库。
- 3D、粒子、全屏视频和自动播放动画均不使用。
- 目标：桌面端首屏交互小于 1.5 秒，调色操作反馈小于 100ms。

## 10. 测试与验收

### 10.1 自动测试

- Zod schema 合法与非法输入。
- 参数范围裁剪。
- 调色引擎输出尺寸、alpha、确定性。
- 指标计算与参考图为空时的降级。
- Planner 在 Mock Provider 下可复现。
- 修正循环最多 2 轮并正确停止。
- Provider 超时与异常降级。

### 10.2 手动测试

- 桌面 Chrome / Edge。
- 移动端 Safari / Chrome。
- JPG、PNG、WebP。
- 大图、低对比、夜景、人像、天空。
- 无 API Key 的 Mock 模式。
- 导出 PNG 后颜色与预览一致。
- 键盘操作与 reduced motion。

### 10.3 验收标准

- 用户可以在 3 分钟内完成上传、生成、评估、选择和导出。
- 无 API Key 时仍可完整演示 Mock 流程。
- Agent Trace 展示真实规划、评估和修正状态，不伪造进度。
- 不出现大面积黑色背景。
- 页面使用 Silver Halide 色彩系统与有限的电影色阶渐变。
- 无生成像素、内容修改或外部自动发布能力。
- `npm run lint`、`npm run typecheck`、`npm test`、`npm run build` 全部通过。
- README 包含本地运行、Mock 模式、环境变量、架构、限制与许可说明。

## 11. 实施阶段

1. 项目骨架、设计 token、基础布局。
2. 图片上传、参考图上传、Prompt 与强度。
3. Canvas 调色引擎与参数 schema。
4. Mock Provider 与 API 路由。
5. Agent Trace、评估面板与候选方案。
6. 修正循环与错误降级。
7. 响应式、无障碍与性能优化。
8. 测试、README、截图、Demo 与 GitHub 发布。

## 12. 明确不做

- 不生成新像素。
- 不改变画面内容。
- 不做登录、支付、会员、订单。
- 不做云端图片存储。
- 不做微信小程序。
- 不做批量处理。
- 不自动发布或自动发送用户内容。
- 不引入黑色暗房视觉。
- 不引入 AI 紫色渐变。
