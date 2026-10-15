---
"@nocobase/studio": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Isolate desktop sidebar preferences by application while preserving layout and cross-tab synchronization. New scoped preferences default to expanded, and the unused shared sidebar cookie is no longer written. Existing generated applications must regenerate or manually synchronize their template changes to receive this fix.
