---
"@nocobase/db": minor
"@nocobase/app-server": patch
"@nocobase/app-cli": patch
---

Default missing applied migration sources to warnings instead of errors, with an `onMissingSource: 'error'` option for strict validation. Downgrades within participating packages still fail. Preserve missing migration history and report warnings in database commands and startup logs. Rollback validates only its target batch and lists every missing or irreversible migration before executing any down operation, with recovery guidance.

Compare migration filename timestamps for downgrade detection independently of parameter target hashes. Validate applications with applied history even when all migration directories have disappeared, while continuing to skip empty applications.
