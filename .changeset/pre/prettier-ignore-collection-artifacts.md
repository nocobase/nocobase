---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Stop formatting the generated Collection artifacts under `database/<connection>/collections/`.

Each template's `.prettierignore` now names that path. The artifacts are written by `pnpm collections:generate` through a stable serializer so that `pnpm collections:generate --check` can regenerate them and compare byte for byte; Prettier collapses their short arrays and objects onto single lines, which made that check report them as out of date when nothing about the schema had changed.
