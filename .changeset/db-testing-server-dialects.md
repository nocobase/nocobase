---
'@nocobase/db': minor
'@nocobase/db-testkit': minor
'@nocobase/db-testing': patch
'@nocobase/db-kingbase': minor
'@nocobase/db-oceanbase': minor
'@nocobase/db-mssql': minor
'@nocobase/db-oracle': minor
'@nocobase/db-dameng': minor
---

`@nocobase/db-testing` can run tests on every server dialect. `@nocobase/db-kingbase`, `@nocobase/db-oceanbase`, `@nocobase/db-mssql`, `@nocobase/db-oracle` and `@nocobase/db-dameng` each export a `testDatabaseProvisioner` from a new `./testing` entry, with defaults matching the services in the examples application's `docker-compose.yml`: KingbaseES isolates a test database in a schema, OceanBase and SQL Server in a database, and Oracle and Dameng in a user of its own, since both inspect the connected user's objects. `@nocobase/db-testing` declares the five as optional peers. `createSqlTestDatabaseProvisioner()` from `@nocobase/db/testing` accepts a list of statements for a step, binds every `??` and `?` in them to the database's identifier, and takes an `identifier` option for a server that folds unquoted names to upper case; when a later create statement fails, it drops what the earlier ones created. The Oracle provisioner drops a test user on every supported version rather than only on 23ai, and grants it the materialized view and synonym privileges a migration may need. `@nocobase/db-testkit` exports `describeTestDatabaseProvisioner()`, the suite each dialect's integration tests run against its provisioner.
