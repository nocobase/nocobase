---
'@nocobase/app-template-default': patch
---

Fix `pnpm dev`, which stopped starting after the development scripts were reorganized.

`scripts/dev.mjs` became `scripts/dev/index.mjs`, but it finds the application root by walking up from its own location and still walked up only one level. It therefore resolved `scripts/` as the root, looked for a tsconfig that is not there, and reported `Cannot resolve tsconfig at path: .../scripts/tsconfig.server.json`. The same miscalculation sent the workflow build into `scripts/dist/server/workflows`.

A test now checks the invariant directly: any file resolving the application root from `import.meta.dirname` — or from `path.dirname(fileURLToPath(import.meta.url))` — must walk up exactly as many levels as it sits deep. Moving such a file has broken this several times, always silently, because the wrong path still resolves and only fails somewhere else.
