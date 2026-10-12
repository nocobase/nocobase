---
'@nocobase/app-plugin-knowledge': patch
---

Authorize revision feedback independently in document history and coordinate proposal state changes with database group locks. Preserve historical duplicate proposals as explicit waiting items, hand off activity atomically, and classify unique constraint conflicts using exact driver diagnostics. Update the unmerged `202610240040_kb_proposals_add_revisions` migration; disposable previews that applied its earlier definition need a rebuild, while shared environments require a separately approved rebuild or forward upgrade.
