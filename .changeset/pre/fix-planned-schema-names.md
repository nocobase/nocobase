---
'@nocobase/db': patch
---

Preserve compiler-generated index and constraint names in standalone Collection Builder definitions so inspection reflects subsequent drops and recreations. Keep existing names across Collection renames and honor naming overrides without modifying caller inputs or dry-run state.
