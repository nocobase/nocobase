---
'@nocobase/app-cli': minor
---

`pnpm build` records the base path compiled into the client and when the build started in `dist/package.json`, as `nocobase.basePath` and `nocobase.builtAt`, beside `nocobase.buildTarget`. An installer reads them to mount the application where its client expects to be served and to tell two builds of the same version apart.
