---
'@nocobase/app-server': patch
---

A command whose JSON body allows no fields (`z.strictObject({})`) no longer requires `--body <file.json>`: the manifest gives such a body no file flag, and the CLI sends `{}`. A body without declared fields that accepts any is still given whole from a file. The releases plugin's `deploy request cancel` is the command this affected.
