---
name: Browser geometry checks need a quiet development server
description: Disable the development annotation layer and finish dependency builds before browser geometry, screenshots and real pointer clicks.
type: feedback
modified: 2026-11-05
---

Start the local application with `AGENT_ANNOTATIONS_ENABLED=false pnpm dev` for automated browser verification. Finish workspace dependency builds before running the browser suite against it.

**Why:** The injected `agent-annotations-root` can intercept real clicks on a modal footer, despite being marked `aria-hidden` and inert by Base UI. A concurrent dependency build also produces many Vite full-page reloads from linked packages' `dist` files, interrupting screenshots and interactions. Both failures occurred during footer regression checks while geometry assertions were passing.

**How to apply:** Use the printed application entry URL, verify the annotation root is absent, and keep real pointer clicks and geometry assertions. Do not force clicks, remove application overlays or increase timeouts to get a pass. Disabling developer annotations does not alter the application's shipped UI.
