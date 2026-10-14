---
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Revert comment runner consent; it locked comment run chains on every claim and slowed the server. The `202610250001_ag_comment_runner_consent` migration stays because installations have already applied it; the nullable columns and indexes it added are left unused.
