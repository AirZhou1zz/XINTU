import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Check,
  CircleGauge,
  Eye,
  GitBranch,
  Layers3,
  MoveRight,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TestTube2,
  Workflow,
  X,
} from "lucide-react";
import styles from "./xintu-portfolio.module.css";
import { QwenCaseGallery, type ShowcaseCase } from "./qwen-case-gallery";

const demoUrl = "https://xintu-demo.vercel.app";
const githubUrl = "https://github.com/AirZhou1zz/XINTU";
const releaseUrl = "https://github.com/AirZhou1zz/XINTU/releases/tag/v0.1.0";
const assetBase = process.env.NEXT_PUBLIC_PORTFOLIO_BASE_PATH ?? "";
const portfolioAsset = (name: string) => `${assetBase}/portfolio/${name}`;

const principles = [
  {
    index: "01",
    icon: ShieldCheck,
    title: "非生成式",
    en: "NON-GENERATIVE",
    body: "AI 不重绘照片，只理解和规划。人物身份、物体关系与画面结构保持不变。",
    accent: "green",
  },
  {
    index: "02",
    icon: SlidersHorizontal,
    title: "确定性执行",
    en: "DETERMINISTIC",
    body: "模型输出结构化参数，Canvas 本地渲染。同一组输入与参数可以得到可重复的结果。",
    accent: "violet",
  },
  {
    index: "03",
    icon: Workflow,
    title: "有界 Agent",
    en: "BOUNDED AGENT",
    body: "最多 4 个工具、2 轮修正。把“自主性”限制在可评估、可解释、可计算的范围里。",
    accent: "clay",
  },
];

const workflow = [
  { index: "01", label: "REFERENCE", title: "读取参考意图", detail: "目标图 + 参考图 + 自然语言" },
  { index: "02", label: "PLAN", title: "动态规划工具", detail: "模型选择有限调色工具与顺序" },
  { index: "03", label: "RENDER", title: "本地确定性渲染", detail: "Canvas 根据参数处理原始像素" },
  { index: "04", label: "EVALUATE", title: "评估结果", detail: "肤色、天空、结构与色差信号" },
  { index: "05", label: "REFINE", title: "最多修正两轮", detail: "超过边界就停止并保留候选" },
];

const metrics = [
  { value: "03", label: "候选方案", detail: "同一次任务生成 3 个可比较结果" },
  { value: "13", label: "手动参数", detail: "在 AI 结果上继续精细调整" },
  { value: "36", label: "自动化测试", detail: "5 个测试文件全部通过" },
  { value: "02", label: "最大修正轮次", detail: "用明确边界控制成本与等待" },
];

const showcaseCases: ShowcaseCase[] = [
  {
    id: "street",
    index: "CASE 01",
    title: "电影照片 · 油画感街道",
    prompt: "电影照片-油画感街道",
    scene: "城市街景",
    refinements: 2,
    before: "/portfolio/showcase/street-before.webp",
    recommendedCandidateId: "A",
    candidates: [
      {
        id: "A",
        label: "电影胶片",
        score: 70,
        verdict: "needs_work",
        summary: "红砖质感与电影氛围成立，建筑结构保留完整；但暗部剪切偏多，天空层次仍有提升空间。",
        image: "/portfolio/showcase/street-a.webp",
      },
      {
        id: "B",
        label: "油画暖调",
        score: 62,
        verdict: "needs_work",
        summary: "暖色砖墙和复古车形成街道氛围，整体仍偏写实，油画感不如 A 明确。",
        image: "/portfolio/showcase/street-b.webp",
      },
      {
        id: "C",
        label: "清透街景",
        score: 65,
        verdict: "needs_work",
        summary: "建筑纹理保留最好，但高对比导致亮暗剪切，柔和过渡不足。",
        image: "/portfolio/showcase/street-c.webp",
      },
    ],
  },
  {
    id: "portrait",
    index: "CASE 02",
    title: "人像照片 · 日系明亮柔和",
    prompt: "人像照片-日系明亮柔和人像",
    scene: "人像",
    refinements: 1,
    before: "/portfolio/showcase/portrait-before.webp",
    recommendedCandidateId: "C",
    candidates: [
      {
        id: "A",
        label: "清透日系",
        score: 62,
        verdict: "needs_work",
        summary: "肤色自然、方向正确，但树叶光斑和背景高光仍有明显剪切。",
        image: "/portfolio/showcase/portrait-a.webp",
      },
      {
        id: "B",
        label: "自然柔肤",
        score: 72,
        verdict: "needs_work",
        summary: "肤色与背景虚化舒适，斑驳光影仍让画面显得偏硬。",
        image: "/portfolio/showcase/portrait-b.webp",
      },
      {
        id: "C",
        label: "柔光胶片",
        score: 93,
        verdict: "pass",
        summary: "肤色自然通透，明亮柔和且没有明显裁切，最符合日系人像意图。",
        image: "/portfolio/showcase/portrait-c.webp",
      },
    ],
  },
  {
    id: "landscape",
    index: "CASE 03",
    title: "山湖风光 · 震撼感",
    prompt: "风景-山湖风光，震撼感",
    scene: "山湖风光",
    refinements: 2,
    before: "/portfolio/showcase/landscape-before.webp",
    recommendedCandidateId: "A",
    candidates: [
      {
        id: "A",
        label: "自然通透",
        score: 68,
        verdict: "needs_work",
        summary: "秋色前景与冰川湖形成冷暖张力，构图有震撼感；天空和暗部动态范围仍需收敛。",
        image: "/portfolio/showcase/landscape-a.webp",
      },
      {
        id: "B",
        label: "电影震撼",
        score: 60,
        verdict: "needs_work",
        summary: "远景冷暖关系明确，但前景树枝暗部压得过重，细节损失明显。",
        image: "/portfolio/showcase/landscape-b.webp",
      },
      {
        id: "C",
        label: "鲜明秋色",
        score: 62,
        verdict: "needs_work",
        summary: "红叶与湖水更突出，但天空高光剪切较多，整体曝光偏亮。",
        image: "/portfolio/showcase/landscape-c.webp",
      },
    ],
  },
];
const boundaries = [
  { good: true, text: "参考图追色与自然语言氛围描述" },
  { good: true, text: "在本地确定性渲染并导出 PNG" },
  { good: true, text: "对候选进行指标评估和人工微调" },
  { good: true, text: "Provider 失败时明确回退到 Mock" },
  { good: false, text: "不生成人物、物体、天空或新的场景内容" },
  { good: false, text: "不持久化用户上传的图片" },
  { good: false, text: "不自动发布、分享或执行无限自主循环" },
  { good: false, text: "当前不包含登录、支付、云端历史与批处理" },
];

export function XintuPortfolio() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#portfolio-content">跳到作品集正文</a>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.ambientGreen} />
        <span className={styles.ambientViolet} />
        <span className={styles.ambientClay} />
      </div>

      <header className={styles.nav}>
        <Link className={styles.brand} href="/portfolio" aria-label="XINTU 作品集首页">
          <span className={styles.brandMark}>XINTU</span>
          <span className={styles.brandMeta}>AI PRODUCT<br />PORTFOLIO</span>
        </Link>

        <nav className={styles.navLinks} aria-label="作品集导航">
          <a href="#product">产品判断</a>
          <a href="#workflow">工作流</a>
          <a href="#evidence">项目证据</a>
          <a href="#cases">真实案例</a>
          <a href="#boundary">边界</a>
        </nav>

        <a className={styles.navCta} href="#cases">
          查看真实案例 <ArrowDown size={14} />
        </a>
      </header>

      <div id="portfolio-content">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.liveDot} />
              AI PRODUCT MANAGER · AI CODING PORTFOLIO · 2026
            </p>

            <h1>
              <span className={styles.wordmark}>XINTU</span>
              <span className={styles.heroTitle}>让 AI 修图<br />回到“可控”</span>
            </h1>

            <p className={styles.lead}>
              一个基于参考图的 AI 追色 Agent。模型只负责理解画面、规划调色步骤与生成参数，
              最终由 Canvas 在本地处理原始像素。它不生成新场景，也不改变人物身份。
            </p>

            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href="#cases">
                查看真实案例 <ArrowDown size={16} />
              </a>
              <a className={styles.secondaryCta} href={demoUrl} target="_blank" rel="noreferrer">
                打开 Live Demo <ArrowUpRight size={15} />
              </a>
            </div>

            <div className={styles.heroFacts} aria-label="项目摘要">
              <span><strong>4</strong> 工具上限</span>
              <span><strong>2</strong> 轮修正</span>
              <span><strong>3</strong> 个候选</span>
              <span><strong>0</strong> 生成像素</span>
            </div>

            <a className={styles.scrollHint} href="#product">
              <ArrowDown size={14} /> 继续了解产品取舍
            </a>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.orbitLabel} aria-hidden="true">REFERENCE / PLAN / RENDER</div>
            <div className={styles.previewCard}>
              <div className={styles.previewTopbar}>
                <span><i /> PRODUCT DEMO</span>
                <span>QWEN 3.8 / MOCK READY</span>
              </div>
              <div className={styles.previewMedia}>
                <Image
                  src={portfolioAsset("hero-demo.gif")}
                  alt="XINTU 产品流程：上传照片、生成候选、对比和导出"
                  width={960}
                  height={540}
                  priority
                  unoptimized
                />
                <span className={styles.scanLine} aria-hidden="true" />
              </div>
              <div className={styles.previewFooter}>
                <span>NO GENERATIVE PIXELS</span>
                <span>LOCAL CANVAS RENDER</span>
              </div>
            </div>

            <div className={styles.floatingNote}>
              <span className={styles.floatingNoteIndex}>01</span>
              <span><strong>不是又一个 AI 滤镜</strong><small>模型规划，工具执行，人做最后判断。</small></span>
            </div>

            <div className={styles.colorSpectrum} aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>
          </div>
        </section>

        <div className={styles.marquee} aria-hidden="true">
          <div>
            <span>REFERENCE</span><i>→</i><span>PLAN</span><i>→</i><span>RENDER</span><i>→</i><span>EVALUATE</span><i>→</i><span>REFINE ×2</span><i>→</i><span>EXPORT</span>
            <span>REFERENCE</span><i>→</i><span>PLAN</span><i>→</i><span>RENDER</span><i>→</i><span>EVALUATE</span><i>→</i><span>REFINE ×2</span><i>→</i><span>EXPORT</span>
          </div>
        </div>

        <section className={styles.section} id="product">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionIndex}>01 / PRODUCT BET</p>
              <h2>不是更强生成，<br />而是更少失控。</h2>
            </div>
            <p className={styles.sectionLead}>
              生成式修图很容易“看起来很惊艳”，但结果可能已经不再是这张照片。
              XINTU 选择先解决一个更窄、更能建立信任的问题：把调色变成可解释、可复现、可评估的编辑任务。
            </p>
          </div>

          <div className={styles.principleGrid}>
            {principles.map(({ index, icon: Icon, title, en, body, accent }) => (
              <article className={`${styles.principleCard} ${styles[accent]}`} key={index}>
                <div className={styles.principleTop}>
                  <span>{index}</span>
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <p className={styles.principleEn}>{en}</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.decisionSection}`} id="decision">
          <div className={styles.decisionCopy}>
            <p className={styles.sectionIndex}>02 / PRODUCT DECISION</p>
            <h2>把模型放进<br /><em>正确的盒子</em></h2>
            <p>
              这个项目最重要的产品决策，不是选择哪个模型，而是不让模型直接成为图片编辑器。
              Agent 只做判断与规划，执行交给确定性的颜色引擎。
            </p>
            <blockquote>
              “模型负责建议，不负责改写现实。”
            </blockquote>
          </div>

          <div className={styles.comparison} role="table" aria-label="生成式编辑与 XINTU 的产品差异">
            <div className={`${styles.comparisonRow} ${styles.comparisonHead}`} role="row">
              <span role="columnheader">编辑逻辑</span>
              <span role="columnheader">生成式修图</span>
              <span role="columnheader">XINTU</span>
            </div>
            {[
              ["输出方式", "重新生成像素", "改写调色参数"],
              ["画面内容", "可能改变身份与结构", "保留原始画面"],
              ["结果复现", "依赖随机性", "同参数可重复"],
              ["失败边界", "容易无限重试", "最多 2 轮后停止"],
            ].map((row) => (
              <div className={styles.comparisonRow} role="row" key={row[0]}>
                <span role="cell">{row[0]}</span>
                <span role="cell">{row[1]}</span>
                <span role="cell"><Check size={13} /> {row[2]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="workflow">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionIndex}>03 / AGENTIC WORKFLOW</p>
              <h2>一次有边界的<br />颜色协作。</h2>
            </div>
            <p className={styles.sectionLead}>
              从“理解意图”到“停止修正”，每一步都有明确输入、输出和限制。
              这不是把聊天框贴在修图软件上，而是重新设计了一次编辑任务。
            </p>
          </div>

          <div className={styles.workflowRail}>
            {workflow.map((step, index) => (
              <article className={styles.workflowStep} key={step.index}>
                <div className={styles.workflowNumber}>{step.index}</div>
                <p>{step.label}</p>
                <h3>{step.title}</h3>
                <span>{step.detail}</span>
                {index < workflow.length - 1 ? <MoveRight className={styles.workflowArrow} size={18} /> : null}
              </article>
            ))}
          </div>

          <div className={styles.fieldStrip}>
            <div className={styles.fieldPhoto}>
              <Image src={portfolioAsset("portrait.webp")} alt="人像测试场景" fill sizes="(max-width: 700px) 70vw, 30vw" />
              <span>PORTRAIT / SKIN TONE</span>
            </div>
            <div className={styles.fieldPhoto}>
              <Image src={portfolioAsset("landscape.webp")} alt="旅行风景测试场景" fill sizes="(max-width: 700px) 70vw, 30vw" />
              <span>LANDSCAPE / SKY</span>
            </div>
            <div className={styles.fieldPhoto}>
              <Image src={portfolioAsset("film.webp")} alt="电影感氛围测试场景" fill sizes="(max-width: 700px) 70vw, 30vw" />
              <span>FILM / MEMORY</span>
            </div>
            <div className={styles.fieldCopy}>
              <Eye size={22} strokeWidth={1.5} />
              <p>真实验证场景</p>
              <span>人像肤色、天空层次、逆光与电影氛围，是当前最需要继续校准的四类输入。</span>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.evidenceSection}`} id="evidence">
          <div className={styles.evidenceVisual}>
            <a href={demoUrl} target="_blank" rel="noreferrer" aria-label="打开 XINTU 在线 Demo">
              <Image
                src={portfolioAsset("live-qwen-export.png")}
                alt="XINTU 使用 Qwen 3.8 完成真实调色与导出的界面"
                width={1280}
                height={720}
                sizes="(max-width: 900px) 92vw, 58vw"
              />
              <span className={styles.imageAction}>LIVE PRODUCT <ArrowUpRight size={14} /></span>
            </a>
          </div>

          <div className={styles.evidenceCopy}>
            <p className={styles.sectionIndex}>04 / PRODUCT EVIDENCE</p>
            <h2>不是概念页。<br />是一个能跑的产品。</h2>
            <p>
              正式版已接入 Qwen 3.8 Flash 完成真实视觉分析，公开 Demo 使用零成本 Mock 规划。
              两者共用同一套前端、颜色引擎和导出链路。
            </p>

            <div className={styles.metricGrid}>
              {metrics.map((metric) => (
                <div className={styles.metric} key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>

            <div className={styles.proofLine}>
              <span><Check size={13} /> GitHub Actions CI 已通过</span>
              <span><Check size={13} /> MIT License</span>
              <span><Check size={13} /> 桌面与移动端</span>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.showcaseSection}`} id="cases">
          <div className={styles.showcaseHeader}>
            <div>
              <p className={styles.sectionIndex}>05 / REAL QWEN RUNS</p>
              <h2>真实跑过。<br />优点和问题一起展示。</h2>
            </div>
            <div className={styles.showcaseIntro}>
              <p>
                2026-11-06 使用 <strong>qwen3.8-flash</strong> 通过 DashScope 真实分析，
                每组完成自动修正、Canvas 2D 渲染和模型视觉复核。
              </p>
              <div className={styles.showcaseMeta}>
                <span>QWEN 3.8 FLASH</span>
                <span>3 组实跑</span>
                <span>9 个候选</span>
                <a href={`${assetBase}/portfolio/showcase/qwen-cases.json`} target="_blank" rel="noreferrer">
                  查看运行记录 <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>

          <QwenCaseGallery assetBase={assetBase} cases={showcaseCases} />

          <p className={styles.showcaseFootnote}>
            真实运行案例，不是实时调用预览。模型输出会随输入与版本变化；公开 Demo 在 Provider 不可用时仍会明确回退到 LOCAL DEMO。
          </p>
        </section>
        <section className={styles.section} id="role">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionIndex}>06 / MY ROLE</p>
              <h2>从问题定义<br />到真实上线。</h2>
            </div>
            <p className={styles.sectionLead}>
              这个作品展示的不只是“会写 Prompt”，而是把产品判断、Agent 边界、交互体验、
              工程验证和部署运维串成一个完整闭环。
            </p>
          </div>

          <div className={styles.roleGrid}>
            <article>
              <span>01</span>
              <Sparkles size={20} strokeWidth={1.5} />
              <h3>产品定义</h3>
              <p>从“AI 修图”中识别出参考图追色与非生成式编辑的真实需求，定义目标用户、任务边界和成功标准。</p>
            </article>
            <article>
              <span>02</span>
              <Braces size={20} strokeWidth={1.5} />
              <h3>Agent 协议</h3>
              <p>把模型能力压缩成结构化计划：工具数量、参数范围、JSON 校验、失败回退和最多两轮修正。</p>
            </article>
            <article>
              <span>03</span>
              <Layers3 size={20} strokeWidth={1.5} />
              <h3>体验设计</h3>
              <p>重构上传、规划、候选、对比、评估、微调和导出的完整产品路径，兼顾移动端与减少动效偏好。</p>
            </article>
            <article>
              <span>04</span>
              <ScanLine size={20} strokeWidth={1.5} />
              <h3>AI Coding</h3>
              <p>完成 Next.js、React、Canvas、Zod、测试、CI 与 Vercel 部署，并保留可审计的代码与 Release。</p>
            </article>
          </div>

          <div className={styles.stackLine}>
            <span>Next.js 16</span><span>React 19</span><span>TypeScript</span><span>Canvas 2D</span><span>Zod</span><span>Qwen 3.8</span><span>Vitest</span><span>Vercel</span>
          </div>
        </section>

        <section className={`${styles.section} ${styles.boundarySection}`} id="boundary">
          <div className={styles.boundaryIntro}>
            <p className={styles.sectionIndex}>07 / BOUNDARIES & REFLECTION</p>
            <h2>边界不是限制，<br />是产品的一部分。</h2>
            <p>
              AI 产品的可信度，不只来自能力上限，也来自它是否知道自己何时应该停下来。
              这里同时展示已完成能力与当前不足。
            </p>
          </div>

          <div className={styles.boundaryList}>
            {boundaries.map((item) => (
              <div className={item.good ? styles.boundaryGood : styles.boundaryBad} key={item.text}>
                {item.good ? <Check size={15} /> : <X size={15} />}
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className={styles.reflectionGrid}>
            <article>
              <CircleGauge size={21} strokeWidth={1.5} />
              <h3>当前指标仍是近似</h3>
              <p>ΔE 使用样本级 CIEDE2000；肤色与天空仍依赖启发式蒙版，不替代专业色彩科学。</p>
            </article>
            <article>
              <TestTube2 size={21} strokeWidth={1.5} />
              <h3>下一步先做真实校准</h3>
              <p>建立人像、逆光、夜景和天空的可复现样例集，再验证模型选择与调色质量。</p>
            </article>
            <article>
              <Eye size={21} strokeWidth={1.5} />
              <h3>不伪装 Mock</h3>
              <p>公开 Demo 会明确标注本地 Mock 模式；真实模型结果单独展示，不把演示包装成付费能力。</p>
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalCopy}>
            <p className={styles.sectionIndex}>FINAL / TRY THE PRODUCT</p>
            <h2>先体验，<br />再判断。</h2>
            <p>
              这个二维码背后不是一个自动播放的 AI 宣传视频，而是一个可以直接运行、
              可以质疑、也可以复现的产品。
            </p>
          </div>
          <div className={styles.finalActions}>
            <a href="#workflow">
              <span>查看产品工作流</span>
              <ArrowDown size={20} />
            </a>
            <a href={demoUrl} target="_blank" rel="noreferrer">
              <span>打开 Live Demo</span>
              <ArrowUpRight size={20} />
            </a>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <span>阅读源码 / GitHub</span>
              <GitBranch size={20} />
            </a>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              <span>查看 v0.1.0 Release</span>
              <MoveRight size={20} />
            </a>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <span>XINTU · BOUNDED COLOR AGENT</span>
        <span>AI PRODUCT MANAGER · AI CODING · 2026</span>
        <a href="#portfolio-content">回到顶部 <ArrowUpRight size={12} /></a>
      </footer>
    </main>
  );
}
