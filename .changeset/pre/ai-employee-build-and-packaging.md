---
'@nocobase/app-cli': patch
---

Carry an application's AI Skills into its build, and load the plugin once

- **Skills in the build.** `tsc` emits only TypeScript, so an application's `ai/skills` never reached `dist`, where a deployed server looks for them; they worked in development and disappeared once deployed, logged only at debug level. `nocobase build` now copies the Markdown under `ai/skills` into the build, `references/` included. An application without `ai/` copies nothing.
- **An import cycle at start.** The plugin's tools imported their container tokens from the modules that register those tools, so an application loading the plugin through its provider stopped with `Cannot access 'aiManagerToken' before initialization`. The tokens now live in a module of their own; each keeps its identity and its export paths.
- **One copy in a source workspace.** Inside a workspace that links the plugin, `@nocobase/app-plugin-ai-employee` and its `./server` entry resolved to the built `dist/` while `./server/plugin` resolved to source, so an application importing `aiManagerToken` from `./server` loaded a second copy whose tokens never matched, and a stale `dist/` stopped the server. Both now resolve to source there. Published packages are unchanged.
