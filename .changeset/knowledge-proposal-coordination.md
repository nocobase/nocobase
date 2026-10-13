---
'@nocobase/app-plugin-knowledge': patch
---

Authorize revision feedback independently in document history and coordinate proposal state changes with database group locks. Preserve historical duplicate proposals as explicit waiting items, hand off activity atomically, and classify unique constraint conflicts using exact driver diagnostics. Wait for post-commit file cleanup before returning a proposal decision so shared-file checks cannot leave a transient undeleted upload in the response flow. Update the unmerged `202610240050_kb_proposals_add_revisions` migration; disposable previews that applied its earlier definition need a rebuild, while shared environments require a separately approved rebuild or forward upgrade.
