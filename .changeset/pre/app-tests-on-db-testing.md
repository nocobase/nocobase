---
'@nocobase/app-server': patch
'@nocobase/app-cli': patch
'@nocobase/app-template-examples': patch
---

The database tests of `@nocobase/app-server`, `@nocobase/app-cli` and the examples template take their databases from `@nocobase/db-testing` instead of configuring SQLite files or in-memory databases, so they run on the dialect `NOCOBASE_TEST_DB_DIALECT` selects and on SQLite otherwise. Cases whose subject is SQLite itself, such as preparing SQLite storage or the examples template's SQLite stand-in for an external CRM, move to files marked `db-test-portability: sqlite-only`. Each package adds `@nocobase/db-testing` as a development dependency, and applications generated from the examples template get it with the tests they ship. Nothing any of these packages runs in production changes.
