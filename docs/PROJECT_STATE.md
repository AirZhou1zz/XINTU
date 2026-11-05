# XINTU Project State

Last updated: 2026-11-06

## Current Product

XINTU is a bounded Agentic Color Grading workflow for photo color grading. The AI plans parameters only; it never generates or replaces image pixels. Rendering is deterministic in the browser with Canvas 2D.

## Active AI Path

- Provider: DashScope OpenAI-compatible API
- Model: `qwen3.8-flash`
- Scene classification: the live vision model owns the scene decision.
- Local heuristics are fallback-only and must not overwrite a successful Qwen result.
- Visual review uses the same model and returns human-readable fields in Simplified Chinese.
- AI timeout: 55 seconds; analysis image payload is resized to 900 px.

## Current Workflow

1. Upload target image and describe intent.
2. Qwen identifies scene, dominant subject, tools, and three candidate directions.
3. A bounded refinement loop evaluates the result and runs at most two correction rounds.
4. Canvas renders candidates A/B/C locally and deterministically.
5. Users switch A/B/C and low/medium/high intensity below the photo.
6. Qwen reviews the rendered result automatically after generation, candidate changes, or settled manual adjustments.

## Current UI

- No parameter popup: live controls remain docked beside the workspace.
- A/B/C and intensity controls appear directly below the photo.
- Scene-aware metrics: portrait mode shows skin metrics; other scenes use clipping and scene metrics.
- Old duplicate Pixso result cards and exploratory design artifacts are removed.

## Public Entry Points

- Production: https://xintu-demo.vercel.app
- Repository: https://github.com/AirZhou1zz/XINTU
- Portfolio: https://airzhou1zz.github.io/XINTU/portfolio/

## Safety Constraints

- No image generation or content replacement.
- No user-image persistence.
- Maximum four tools and two automatic refinement rounds.
- Visual review never mutates grading parameters automatically.
- Secrets remain in Vercel/local environment variables and must never be committed.
- Mock mode must always be identified as `LOCAL DEMO`, never presented as Qwen.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Current baseline: 5 test files, 36 tests passing.