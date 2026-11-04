# Contributing to XINTU

## Before you start

- Use the public demo to understand the product flow.
- Search existing issues before creating a new one.
- For larger features, open a proposal first so the bounded-agent boundary stays coherent.
- Never attach private photos, API keys, tokens, or `.env.local`.

## Local setup

```bash
npm ci
npm run dev
```

No API key is required. The app defaults to its deterministic mock provider.

## Quality gate

Run all checks before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Pull request scope

Keep a pull request focused on one problem. Include:

- The user problem being solved.
- The smallest implementation that solves it.
- Tests for planner, schema, metrics, or deterministic rendering changes.
- Before/after screenshots for visible UI changes.
- Notes about cost, latency, privacy, or failure behavior when model calls are involved.

## Product boundary

XINTU must not generate new image pixels or change scene content. Model output must remain structured, schema-validated, range-limited, and bounded by the existing retry and tool-count limits.

## Commit style

Use clear imperative messages, for example:

```text
Add cached sample replay
Fix comparison slider keyboard focus
Document Qwen timeout fallback
```