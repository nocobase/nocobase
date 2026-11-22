---
'@nocobase/app-server': minor
'@nocobase/app-cli': minor
---

`classifyPluginRegistration` from `@nocobase/app-server/plugins` decides a plugin's registration state from its facts, so `pnpm nocobase plugin inspect` and the App Foundation plugins page agree. `plugin inspect` now reports `PARTIALLY_REGISTERED` for a plugin with both client and server entries that only one of `client/plugins.ts` and `server/plugins.ts` registers, and reports a plugin that ships only Agent Skills as `registered` (with `registration.skillsOnly: true`) when the application declares it in `dependencies`, where it used to report `unregistered`. `plugin register` accepts several names and registers them in order, such as `plugin register agents knowledge`; with more than one, `--json` returns `{ plugins: [...] }`. A vendored workspace plugin's runtime `package.json` in `dist/` keeps the application plugins it requires as `peerDependencies`.
