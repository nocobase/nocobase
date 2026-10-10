---
'@nocobase/app-plugin-dag-flow': minor
---

Register the Artifact build as a CLI hook instead of relying on the application's build script

`pnpm build` and `pnpm dev` pick up the workflow Artifact build from this plugin, so an application gets it by installing the plugin rather than by carrying the step in its own scripts. The commands and their output are unchanged.
