# @nocobase/db-testkit

## 0.1.0-beta.2

### Minor Changes

- 463a7a8: `@nocobase/db-testing` can run tests on every server dialect. `@nocobase/db-kingbase`, `@nocobase/db-oceanbase`, `@nocobase/db-mssql`, `@nocobase/db-oracle` and `@nocobase/db-dameng` each export a `testDatabaseProvisioner` from a new `./testing` entry, with defaults matching the services in the examples application's `docker-compose.yml`: KingbaseES isolates a test database in a schema, OceanBase and SQL Server in a database, and Oracle and Dameng in a user of its own, since both inspect the connected user's objects. `@nocobase/db-testing` declares the five as optional peers. `createSqlTestDatabaseProvisioner()` from `@nocobase/db/testing` accepts a list of statements for a step, binds every `??` and `?` in them to the database's identifier, and takes an `identifier` option for a server that folds unquoted names to upper case; when a later create statement fails, it drops what the earlier ones created. The Oracle provisioner drops a test user on every supported version rather than only on 23ai, and grants it the materialized view and synonym privileges a migration may need. `@nocobase/db-testkit` exports `describeTestDatabaseProvisioner()`, the suite each dialect's integration tests run against its provisioner.
- be0fbbd: `@nocobase/db-testkit/integration-runner` exports `runWithDatabaseService()`, which starts a dialect's database in a disposable Compose project with a random name and published port, runs any command against it with the service address in its environment, and removes the project afterwards, as `runDatabaseIntegration()` does for the shared suite — now built on it. `DatabaseServiceOptions` describes the service and `DatabaseServiceCommandOptions` the command. The runner's messages say "tests" rather than "integration tests", since it also runs other packages' tests.

### Patch Changes

- 4403687: A dialect's integration profile can declare `schema.textDefaults: 'unsupported'` when a TEXT column cannot keep a default in the table, as on OceanBase, so the shared contract that inserts a row without a text column's value skips that dialect. It is `supported` when omitted. `schema.textAlterations: 'unsupported'` likewise skips the case that redefines an existing text column, which Oracle refuses for a CLOB.
- Updated dependencies [21d274c]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/db@1.0.0-beta.17

## 0.0.2-beta.1

### Patch Changes

- 24e771f: Remove circular development dependencies between the database core, shared testkit, and dialect packages. Move runnable database examples, the playground, and benchmarks to repository development tools.
- Updated dependencies [24e771f]
- Updated dependencies [26ac480]
  - @nocobase/db@1.0.0-beta.9

## 0.0.2-beta.0

### Patch Changes

- ceb356b: Improve Dameng integration compatibility for typed numeric query results, streaming rows, temporal projections, default-only inserts, schema capability warnings, and native constraint error messages.
- ceb356b: Distinguish native numeric results from dialect support for insert returning in the integration profile.
- 35f9722: Give every dialect package a `check` script.

  `db-sqlite`, `db-mysql`, `db-oracle`, `db-mssql` and
  `db-testkit` gain the `check` script the other dialect packages already had;
  `db-testkit` also typechecks its unit and integration trees there, which its
  base `typecheck` does not cover.

- ceb356b: Describe JSON default support in dialect integration profiles and avoid
  misclassifying OceanBase expression defaults as generated columns.
- ceb356b: Make dialect integration tests own their disposable Docker Compose environments
  with random host ports and automatic cleanup.
- ceb356b: Add explicit `--test-file` selection and `--pause-on-failure` support to database integration test commands.
- ceb356b: Declare runtime imports in the published package dependencies.
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/db@1.0.0-beta.5

## 0.0.1

### Minor Changes

- Add shared database contract types and integration test helpers for NocoBase dialect packages.
