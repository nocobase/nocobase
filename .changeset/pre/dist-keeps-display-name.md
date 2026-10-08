---
'@nocobase/app-cli': patch
---

`pnpm build` keeps the application's `displayName` in `dist/package.json`, so a deployed application shows its own name instead of the template's default.
