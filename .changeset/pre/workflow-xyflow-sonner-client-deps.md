---
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-template-default': patch
---

Restore the client dependencies an installed application needs to bundle the workflow canvas and the Sonner-backed notification provider. A plugin's `client/` is compiled by the consuming application's Vite build and its `dist/client` keeps bare imports intact, so a package declared only as a `devDependency` is absent once the plugin is installed from the registry rather than linked from this workspace: `pnpm dev` failed with `Could not resolve "@xyflow/react"` and `Could not resolve "sonner"`. Move `@xyflow/react` back into the workflow plugin's `dependencies`, and declare `sonner` in both application templates.
