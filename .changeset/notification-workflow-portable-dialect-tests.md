---
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-workflow': patch
---

The notification migration-runner test and the workflow integration tests run on the database `NOCOBASE_TEST_DB_DIALECT` selects through `@nocobase/db-testing`, instead of each reading a variable of its own (`NOTIFICATION_MIGRATION_DIALECT`, `INTEGRATION_DB_CONNECTIONS`) and configuring the server by hand; the notification test previously ran only when that variable was set, which no script did. Workflow's `test:integration:postgres` and `test:integration:mysql` set the new variable. Both packages replace their `@nocobase/db-mysql`, `@nocobase/db-oracle` and `@nocobase/db-postgres` development dependencies with `@nocobase/db-testing`; nothing either package ships changes.
