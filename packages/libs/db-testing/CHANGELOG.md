# @nocobase/db-testing

## 0.1.0-beta.0

### Minor Changes

- be0fbbd: A new package of database fixtures for tests outside the `@nocobase/db` packages. A test written with it runs on SQLite by default and on the dialect `NOCOBASE_TEST_DB_DIALECT` names otherwise, with each test file isolated in databases of its own. `createDatabaseTest()` from `@nocobase/db-testing/vitest` returns a Vitest `test` whose context carries a migrated and seeded `database`, `connection`, `dialect`, `capabilities` and `expectCollection`, with `isolation: 'schema'` (the default) emptying the databases before every test — a test that runs concurrently with its siblings gets databases of its own — and `isolation: 'none'` sharing one for the file. `describeMigration()` declares the test every migration needs: it applies the migrations before this one, runs an optional `before` step, applies, rolls back and reapplies this one, and checks after each step that Collection metadata and tables agree and that rolling back restores every table exactly as it was, Fields, indexes and foreign keys included; `verifyMigration()` runs the same steps without declaring a test. `expectCollection(name)` asserts on a Collection's indexes, foreign keys and Fields by Field and Collection name rather than by physical name, so one expectation holds on every dialect, and `inspectCollection()` returns the same snapshot. Outside Vitest, `createTestDatabase()` and `provisionTestDatabases()` provision and open the databases directly. The dialect packages are optional peers: SQLite is required, every other dialect only when it is selected; Vitest is an optional peer that only the `./vitest` entry needs. A metadata store supplied by the test is emptied with the schema when a database is reset. Isolated databases are named `nbt_<host>_<pid>_…`, and each run first drops those that a run on the same machine left behind when it was killed, leaving other machines' databases and running processes' databases alone. `provisionTestDatabases({ provisioner })` uses a given provisioner instead of loading one by dialect. `toHaveField` also compares a string Field's `length`. `testDatabaseCapabilities()` resolves the selected dialect's capabilities before any database exists, so a test file can pass them to `test.skipIf()` while tests are collected.

### Patch Changes

- 463a7a8: The in-process check of a migration or seed lock is kept per Database Connection instead of per connection name. Two Database Managers in one process — two applications a host embeds, or two tests — each have a connection called `main` on databases of their own, and one migrating while the other did failed with `TaskLockBusyError` ("already held for connection \"main\"") although the two never shared a database. Two managers on the same database still take turns through the lock row. `@nocobase/db-testing` no longer runs the migrations and seeds of its test databases one after another, which it did only to avoid that error.
- 4403687: `withoutDecimalPadding(value)` reduces a decimal string to its value, without the trailing zeros PostgreSQL and MySQL pad it to its column's or its aggregate's scale, and does the same to every decimal string inside an array or an object, so one assertion on a decimal holds on every dialect. `@nocobase/app-testing/server` re-exports it.
- 463a7a8: `@nocobase/db-testing` can run tests on every server dialect. `@nocobase/db-kingbase`, `@nocobase/db-oceanbase`, `@nocobase/db-mssql`, `@nocobase/db-oracle` and `@nocobase/db-dameng` each export a `testDatabaseProvisioner` from a new `./testing` entry, with defaults matching the services in the examples application's `docker-compose.yml`: KingbaseES isolates a test database in a schema, OceanBase and SQL Server in a database, and Oracle and Dameng in a user of its own, since both inspect the connected user's objects. `@nocobase/db-testing` declares the five as optional peers. `createSqlTestDatabaseProvisioner()` from `@nocobase/db/testing` accepts a list of statements for a step, binds every `??` and `?` in them to the database's identifier, and takes an `identifier` option for a server that folds unquoted names to upper case; when a later create statement fails, it drops what the earlier ones created. The Oracle provisioner drops a test user on every supported version rather than only on 23ai, and grants it the materialized view and synonym privileges a migration may need. `@nocobase/db-testkit` exports `describeTestDatabaseProvisioner()`, the suite each dialect's integration tests run against its provisioner.
- Updated dependencies [21d274c]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [27f09bd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [be0fbbd]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/db-mysql@0.1.0-beta.3
  - @nocobase/db-sqlite@0.1.0-beta.4
  - @nocobase/db-postgres@0.1.0-beta.3
  - @nocobase/db-kingbase@0.1.0-beta.3
  - @nocobase/db-oceanbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.2
  - @nocobase/db-oracle@0.1.0-beta.3
  - @nocobase/db-dameng@0.1.0-beta.3

## 0.0.1

Initial version.
