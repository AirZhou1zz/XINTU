# XINTU v0.1.0 — Bounded AI Color Grading

XINTU is an experimental reference-based color-grading workflow. The model plans grading tools and emits structured parameters; Canvas renders the original image locally.

## Highlights

- Reference-image color matching
- Natural-language grading intent
- Bounded agent planning with at most four tools
- Three generated grading candidates
- Evaluation loop with at most two refinement rounds
- Qwen 3.8 Flash provider through DashScope
- Zero-cost deterministic mock provider
- Before/after comparison slider
- Thirteen manual grading controls
- Browser-local PNG export
- Responsive desktop and mobile interface

## Architecture

- Next.js 16 App Router
- React 19
- TypeScript
- Canvas 2D
- Zod
- Vitest

## Privacy boundary

- The model does not generate the final image pixels.
- Rendering happens in the browser.
- Uploaded images are not persisted by XINTU.
- API credentials stay server-side.
- Live provider failures fall back visibly to mock mode.

## Known limitations

- No login, payment, cloud history, or batch processing.
- Browser-side quality metrics are lightweight approximations.
- Real-model quality still needs calibration across diverse photo scenarios.
- The public demo uses mock planning to avoid owner-funded API usage.

## Verification

- 5 test files
- 21 tests
- ESLint
- TypeScript typecheck
- Production build