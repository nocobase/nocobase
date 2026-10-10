---
'@nocobase/app-plugin-dag-flow': patch
---

Declare `typescript` as a runtime dependency. `server/loader/source-parser.ts` imports it and the engine reaches that module through a static import chain, so a deployed application crashed on start with `Cannot find package 'typescript'` while every development checkout resolved it from devDependencies.
