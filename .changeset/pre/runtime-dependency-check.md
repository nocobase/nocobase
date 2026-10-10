---
'@nocobase/app-template-default': patch
---

Build the workspace packages a template depends on by selecting them with pnpm rather than listing them by hand, and drop the unused `Dockerfile`. The hand-written list had drifted: `@nocobase/config` was missing from it, so building a template on its own failed at "Generate server package".
