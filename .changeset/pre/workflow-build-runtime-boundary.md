---
'@nocobase/app-plugin-dag-flow': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
---

Move Workflow source parsing and Artifact generation behind the `workflow build` command while retaining the public build API for applications with custom Instructions. The command uses Node's native TypeScript loading in a disposable process and removes esbuild entirely. CLI build modules remain in the published package, but production servers do not load them or TypeScript at runtime.
