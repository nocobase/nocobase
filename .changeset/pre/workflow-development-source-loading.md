---
'@nocobase/app-plugin-dag-flow': minor
---

Load workflow definitions from source in development instead of from built Artifacts.

A development server previously saw only what `nocobase workflow build` had written to `dist/server/workflows`, so `pnpm dev` ran that build on every start and an edited `workflow.ts` needed a manual rebuild and a restart before it could be listed, enabled, or triggered. The loader now compiles the workflow source root on demand whenever the runtime is not production, skipping the work while the tree is unchanged, and the plugin no longer registers a `beforeDev` CLI hook, so `pnpm dev` runs no workflow build. The `afterServerBuild` hook is unchanged: a deployment still reads committed Artifacts.

The definition it produces is what a build produces: the same schema validation, semantic validation, flat IR compilation, resource collection, and content-addressed digest, so the revision enabled in development is the revision the build later ships. What it drops is `ts.createProgram`, which the application's own typecheck already covers, and the disposable evaluation process a server running under a TypeScript loader does not need — together the difference between seconds and milliseconds. Development validates against the instruction set the engine executes with rather than the core set alone, and a key that exists only under `dist/server/workflows` is still offered, with source winning for a key present in both. A production runtime is unchanged: it reads built Artifacts and never loads the compilation path.

Starting a run no longer requires an Artifact store entry in development. The engine has always resolved development run modules from the source package and never from the store, so the store was the wrong precondition there; it is now the source package that must be present, and production still requires the committed Artifact for the revision's digest.

`nocobase workflow check <package> --ir` prints the compiled flat IR, the definition an Artifact carries, for reading a workflow outside a running server.
