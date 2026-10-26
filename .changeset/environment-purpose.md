---
'@nocobase/app-plugin-releases': minor
---

Environments have a `purpose`, `preview` or `test`, chosen when one is created and editable later; the migration `202611020001_rel_environment_purpose` sets it for existing environments, `preview` for those holding pull request preview Apps (`previewOf`). The environments list and an environment's page show it, and `EnvironmentsSettings` takes an optional `title` and `description`.
