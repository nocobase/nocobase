---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Run plugin-registered commands during `pnpm build` and `pnpm dev`

Both scripts now ask the application's CLI which commands its plugins have registered, and run them at the matching stage. The workflow Artifact build was written directly into these scripts and moves to the workflow plugin, which is what installs it; an application without that plugin no longer carries the step, and a plugin that needs one no longer requires an edit here.

Failing to read the list fails the run: a build that silently skipped a hook would look successful while missing whatever the hook produces. Declaring no hooks is not that case and changes nothing.
