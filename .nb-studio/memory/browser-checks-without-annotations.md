---
name: Browser geometry checks need a quiet development server
description: Finish dependency builds before browser checks; current templates no longer inject annotations, while older generated apps may still do so.
type: feedback
modified: 2026-11-06
---

Current Default and Examples templates no longer integrate agent annotations. Run `pnpm dev` normally and verify the annotation root is absent. Older generated applications may still contain the Vite integration; remove it or use their existing `AGENT_ANNOTATIONS_ENABLED=false` switch during unrelated browser checks. Finish workspace dependency builds before running the browser suite.

**Why:** The injected `agent-annotations-root` can intercept real clicks on a modal footer, despite being marked `aria-hidden` and inert by Base UI. A concurrent dependency build also produces many Vite full-page reloads from linked packages' `dist` files, interrupting screenshots and interactions. Both failures occurred during footer regression checks while geometry assertions were passing.

**How to apply:** Use the printed application entry URL, verify the annotation root is absent, and keep real pointer clicks and geometry assertions. Do not force clicks, remove application overlays or increase timeouts to get a pass. Do not hide the annotation root in screenshots to claim it has been removed.
