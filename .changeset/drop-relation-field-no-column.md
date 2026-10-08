---
'@nocobase/db': patch
---

Dropping a relation field that owns no column (`hasOne`, `hasMany`, `belongsToMany`, or a `belongsTo` over an existing Field) no longer issues `DROP COLUMN`. On PostgreSQL that statement failed for a column that never existed, which stopped `@nocobase/app-plugin-workflow`'s `202610010001_workflow_application_ids` migration, and with it every fresh installation of the workflow plugin on PostgreSQL.
