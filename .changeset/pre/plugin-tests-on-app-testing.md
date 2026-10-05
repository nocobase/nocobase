---
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-cli-example': patch
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
'@nocobase/app-plugin-workflow': patch
---

Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
