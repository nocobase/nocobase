---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

The Default template registers the scheduler's command-line entry in `cli/plugins.ts`, so `pnpm nocobase scheduler sync` exists in a Default application as the scheduler documentation describes. The Examples and Hub templates ignore `/.env` like the Default template does, all three Docker build contexts exclude build output where builds write it — each workspace package's `dist`, not every directory named `dist` — so `@nocobase/app-cli`'s `dist` command sources reach an in-image build without an exception for them, and the agent guidance and READMEs describe the current layout: `package.json` scripts that call `nocobase`, `cli/plugins.ts`, the two scripts a built `dist/` carries, and hand-written external metadata under `database/<connection>/metadata/`.
