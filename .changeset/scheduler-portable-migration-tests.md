---
'@nocobase/app-plugin-scheduler': patch
---

The scheduler's migration tests are written with `describeMigration()` from `@nocobase/db-testing`, so they run on whichever database `NOCOBASE_TEST_DB_DIALECT` selects rather than on SQLite alone, and check that rolling back restores the previous tables. The package declares `@nocobase/db-testing` as a development dependency; nothing it ships changes.
