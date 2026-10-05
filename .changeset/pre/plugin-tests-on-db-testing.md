---
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-hub': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-template-print-example': patch
'@nocobase/app-plugin-users': patch
---

Database tests in these plugins and example plugins take their database from `@nocobase/db-testing` instead of configuring an in-memory SQLite database, so they run on SQLite by default and on the database `NOCOBASE_TEST_DB_DIALECT` selects otherwise. Schema assertions that read `PRAGMA` output or `sqlite_master` are written with `expectCollection()` against Field and Collection names, migration up and down tests use `describeMigration()`, and the SQLite triggers that made a write fail are replaced by spies on the write. Each package replaces its `@nocobase/db-sqlite` development dependency with `@nocobase/db-testing`; nothing any of them ships changes.
