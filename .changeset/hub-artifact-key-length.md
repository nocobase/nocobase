---
'@nocobase/app-plugin-hub': patch
---

Hub's tables can be created on MySQL. The release table's `artifactKey` was `varchar(1024)` with a unique index, which exceeds MySQL's 3072-byte index key limit under utf8mb4 (`Specified key was too long`), so installing the plugin failed there. The column is now `varchar(512)`; keys are `<appId>/<release id>.tar.gz`, at most 172 characters.

This edits the released migration `202609010001_create_hub_app_tables`, as an exception to the rule that a released migration never changes: the failing statement is in that migration itself, so no later migration could let a MySQL installation get past it, and it never succeeded on MySQL. An installation on SQLite or PostgreSQL that already ran it keeps its 1024-character column and reports a checksum mismatch for this migration as a warning; `pnpm nocobase db repair` records the new checksum.
