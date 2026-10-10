---
'@nocobase/app-template-default': patch
---

Resolve the development entry point's application root two levels above scripts/dev. Start workflow builds, plugin watchers, Vite and the application server from the application directory so pnpm dev no longer tries to read scripts/package.json or writes workflow artifacts under scripts/dist.
