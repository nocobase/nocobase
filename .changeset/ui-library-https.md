---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

The `@nocobase` shadcn registry is read over HTTPS: `components.json` and the frontend references point at `https://ui.nocobase.com`. Existing applications can change the URL in their own `components.json`.
