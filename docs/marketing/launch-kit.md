# XINTU launch kit

## Positioning

**One sentence:** XINTU is a reference-based AI color-grading agent that plans and evaluates instead of generating new pixels.

**Audience:** independent creators, photo-product builders, and developers exploring bounded visual agents.

**Primary action:** open the public demo and try one before/after workflow.

**Proof:** real Qwen 3.8 samples, bounded agent trace, deterministic Canvas rendering, and a safe local fallback demo.

## Four-week launch sequence

### Week 1 — repository conversion

- Publish the repository only after the security checklist passes.
- Add description, website, topics, and social preview.
- Verify all README images and links.
- Enable Issues and Discussions.
- Create release `v0.1.0`.
- Confirm the CI workflow is green.

### Week 2 — Chinese launch

Post one strong before/after story on Xiaohongshu, then adapt it for Jike, V2EX, and a short technical article. Do not paste the same copy everywhere.

### Week 3 — English launch

Post the Show HN story, then share a focused build note on X and LinkedIn. Reply to technical questions with architecture detail rather than repeated promotion.

### Week 4 — technical follow-up

Publish a write-up about bounded image agents, including one failure case. Collect the top three recurring questions, improve the product and documentation, then prepare v0.2.

## Xiaohongshu draft

**Title**

```text
我做了一个“只调色、不生成”的 AI 修图 Agent
```

**Cover text**

```text
不改脸
不换天空
不生成新像素
只追你想要的色调
```

**Body**

```text
最近做了一个叫 XINTU 的小实验。

它不是让 AI 重新画一张图，而是先理解原图和参考图的氛围，再规划调色工具、生成参数、评估肤色/天空/结构保持，最多自我修正两轮。

最终渲染在浏览器本地完成，所以人物、物体和画面结构都不会被重新生成。

我最想解决的是：
普通 AI 修图很容易“效果很惊艳，但已经不是这张照片了”。

现在上传原图 + 参考图，可以生成 3 个候选，拖动对比并导出 PNG。

公开 Demo 优先使用项目配置的 Qwen 3.8 Flash，模型不可用时回退到本地确定性模式。在线调用会消耗项目配置的模型额度。
欢迎拿真实照片来测，尤其想收集人像、逆光和夜景的失败案例。

#AI产品经理 #AIGC #修图 #独立开发 #GitHub
```

## Jike draft

```text
做了一个有边界的图像 Agent：XINTU。

模型不生成像素，只负责理解画面、规划调色工具、输出结构化参数。Canvas 在本地渲染，评估后最多修正两轮。

这个项目想验证的不是“AI 能不能修图”，而是“AI 能不能在不改变照片真实内容的前提下，稳定完成一个有评价标准的编辑任务”。

公开 Demo 是零成本 Mock 模式，真实千问效果放在仓库截图里。
```

## V2EX draft

**Title**

```text
分享一个“不生成像素”的 AI 追色 Agent
```

**Body**

```text
做了一个参考图追色的小项目 XINTU。

和常见的 AI 生图/修图不同，模型只输出调色计划和结构化参数，不直接生成结果像素。Canvas 在浏览器里完成确定性渲染，然后评估肤色、天空、结构保持和色差，失败时最多修正两轮。

技术栈是 Next.js 16 + React 19 + TypeScript + Canvas 2D，模型侧接入 Qwen 3.8 Flash，模型不可用时自动使用本地 Mock。

公开 Demo 不调用模型，避免 API 费用。想听听大家对“有界 Agent + 确定性工具执行”这种设计的看法，也欢迎拍砖。
```

## Show HN draft

**Title**

```text
Show HN: An AI color-grading agent that never generates pixels
```

**First comment**

```text
I built XINTU to explore bounded visual agents.

The model does not generate the final image. It analyzes the target and reference, plans a small set of grading tools, produces structured parameters, then evaluates the rendered result. It can refine at most twice.

Rendering is deterministic and happens locally with Canvas 2D. The project is intentionally non-generative: it should preserve identity, geometry, and scene content.

The public demo uses project-configured Qwen 3.8 Flash when available and falls back to the local mock planner on failure. Live requests consume the configured project model quota.

I would especially appreciate feedback on:
- whether reference-based grading is more useful than prompt-only editing
- color quality across skin, sky, and backlit scenes
- whether the bounded-agent pattern is reusable for other image-editing tasks
```

## X / Twitter draft

```text
Most AI photo editors generate a new image. XINTU doesn't.

The agent only plans grading tools and structured parameters. Canvas renders the original pixels locally, evaluates the result, and refines up to 2 times.

Reference-based color grading without generation.

Demo + architecture:
https://github.com/AirZhou1zz/XINTU
```

## LinkedIn draft

```text
I shipped a small experiment called XINTU: a bounded AI color-grading workflow.

The interesting product question was not whether a model could make a photo look different. It was whether the model could execute a repeatable editing task without regenerating the image.

The model interprets the target and reference, plans grading operations, emits schema-validated parameters, and evaluates the output. Canvas handles rendering locally. The workflow is limited to four tools and two refinement rounds.

The public demo uses the configured Qwen 3.8 model with a deterministic mock fallback. Live requests consume the project quota.

I am looking for feedback from product builders working on agents, deterministic tools, and human-in-the-loop creative workflows.
```

## Launch measurement

Track weekly:

- Repository views and unique visitors
- Demo clicks
- Stars
- Clones
- Issues or discussion posts with real feedback
- Which channel produced the most meaningful feedback

Do not optimize for raw impressions alone. The first goal is ten high-quality conversations and three concrete product fixes.