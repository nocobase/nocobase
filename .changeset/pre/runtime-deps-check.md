---
'@nocobase/app-template-default': patch
---

Add `pnpm deps:check`, which fails when server code imports a package declared only in devDependencies. That mistake resolves in every development checkout and is absent exactly once, on the deployed server, where it surfaces as a bare `Cannot find package`.
