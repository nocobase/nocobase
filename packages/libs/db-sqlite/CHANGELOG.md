# @nocobase/db-sqlite

## 0.1.0-beta.4

### Minor Changes

- 7dbc54b: Repository writes can now be observed. `connection.onRepositoryMutation({ collections, keys?, values?, id? }, { inTransaction?, afterCommit? })` subscribes to the rows Repository writes change and returns a function that unsubscribes. Every write method emits one event per call that wrote at least one row, listing each row it created, updated or deleted — nested relation targets, foreign keys and through rows included — with its key and the fields written; a subscription matches when any of those rows belongs to one of its Collections. Subscriptions belong to the root connection and are shared with its transactions and policy-bound connections.

  `inTransaction(event, connection)` runs inside the call's transaction once its writes are done; throwing fails the call with that error and rolls back an implicit transaction. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and drops them when the transaction or savepoint rolls back; its errors go to the new connection option `onRepositoryEventError(error, { subscriptionId, operationIds })`, or become a process warning whose `code` is `REPOSITORY_EVENT_LISTENER_FAILED` and whose `cause` is the error. Writes made through the connection either listener receives emit events with `parentOperationId`, nested at most `repositoryEventMaxDepth` levels (a new connection option, default 8) before they fail with the new `RepositoryError` code `REPOSITORY_EVENT_RECURSION`. A subscription matches an event by its root Collection or any Collection among its row changes.

  A connection without subscriptions runs every write exactly as before. When a subscription asks for keys (the default), `updateMany` and `deleteMany` lock the matching rows and write them by key, and `createMany` keeps its single statement when every row supplies its key, otherwise uses one multi-row `INSERT … RETURNING` where the dialect runtime declares the new `insertManyReturning` flag (`@nocobase/db-sqlite` does) or inserts row by row. Subscriptions declaring `keys: false`, and Collections whose rows have no primary key or non-null unique key, keep the single statement and receive a `count` event. `connection.explainRepositoryEvents({ collection, operation })` reports the strategy, granularity and whether an implicit transaction is opened.

  The write methods accept a `meta` option built with the new `defineRepositoryEventMeta<T>(namespace)` handle, whose `read(event)` returns the typed value; `values: true` subscriptions also receive the written values. Writes made through `query`, `client()`, migration and seed tasks, and rows changed by database cascades emit nothing, and events are delivered only in the process that wrote.

  `@nocobase/app-server` ignores the two new connection options when deciding whether two connections point at the same database, and answers `REPOSITORY_EVENT_RECURSION` as a server error.

- be0fbbd: `@nocobase/db/testing` exports `TestDatabaseProvisioner`, the contract a dialect package implements so `@nocobase/db-testing` can create isolated databases on it, with `ProvisionedTestDatabase`, `TestDatabaseProvisionOptions` and `TestDatabaseEnvironment`. `@nocobase/db-sqlite`, `@nocobase/db-postgres` and `@nocobase/db-mysql` export one as `testDatabaseProvisioner` from a new `./testing` entry: SQLite creates a database file under `NOCOBASE_TEST_DB_SQLITE_DIRECTORY` or the system's temporary directory, so a second manager opens the same database as on a server, PostgreSQL creates a schema in the database its `POSTGRES_*` variables name, and MySQL creates a database through the administrative account in `MYSQL_ADMIN_USER` and `MYSQL_ADMIN_PASSWORD` (or `MYSQL_ROOT_PASSWORD`). `postgresTestConnection()` and `mysqlTestConnection()` return the connection options those variables describe. All three also implement the optional `listProvisioned` and `dropProvisioned`, which `@nocobase/db-testing` uses to remove the databases an interrupted run left behind; `TestDatabaseListOptions` describes the first. A provisioner also carries `capabilities`, the capabilities its driver declares. `createSqlTestDatabaseProvisioner()` builds one for a server dialect from its connection options and the statements that create, drop and list isolated databases, each run on an administrative connection opened for it and closed afterwards; the PostgreSQL and MySQL provisioners are built with it.

### Patch Changes

- 27f09bd: A transaction whose COMMIT fails on SQLite is now rolled back. SQLite keeps the transaction open when COMMIT fails — on a deferred foreign key violation, or with `SQLITE_BUSY` while another process reads the file — and Knex released the connection without rolling it back, so every later `transaction()` failed with `cannot start a transaction within a transaction` and every later query ran inside the failed transaction, seeing its writes and losing its own. The transaction still rejects with the COMMIT's error; if the rollback itself fails, the connection is discarded instead of being reused.
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

## 0.1.0-beta.3

### Minor Changes

- ec92b20: A busy migration or seed lock throws `TaskLockBusyError` (checked with `isTaskLockBusyError()`), carrying the lock table, the holder, its heartbeat and whether it expired, instead of a plain `Error`; the messages are unchanged. `Seeder.history()` reads the executed seeds without taking a lock, as `Migrator.history()` does for migrations. The application's database task runner accepts `dryRun` for `run` and reports the pending migrations and seeds per connection in each result's `pending`, which `nocobase db apply --dry-run` uses. A driver may implement `hasStorage(config)` to say whether the local storage a connection opens exists yet; `@nocobase/db-sqlite` checks for the database file. A dry run consults it and answers for an empty database rather than preparing storage and connecting, so previewing an application whose SQLite file does not exist yet no longer creates it.

### Patch Changes

- Updated dependencies [02d5402]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
  - @nocobase/db@1.0.0-beta.16

## 0.1.0-beta.2

### Patch Changes

- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.1

### Minor Changes

- 63db898: Move concrete database connection types into their owning dialect packages and keep the core connection contract independent of installed dialects. Import `SqliteConnectionConfig`, `PostgresConnectionConfig`, `MysqlConnectionConfig`, `OracleConnectionConfig`, and `MssqlConnectionConfig` from the corresponding `@nocobase/db-<dialect>` package instead of `@nocobase/db`.

  `ConnectionConfig` and the default `DatabaseConfig` and `AppDatabaseConfig` now describe the common runtime contract. For strict configuration checking, supply a concrete connection type or use `DatabaseConfigFromDrivers` and `AppDatabaseConfigFromDrivers`. The core also exports `DriverConnectionConfig` and `ConnectionConfigFromDrivers` for reusable driver inference. Preserve mutually exclusive host and socket targets in MySQL and OceanBase configuration and factory options.

### Patch Changes

- 63db898: Let a driver declare the connection shape its hooks receive.

  Splitting the dialects into packages left the driver descriptor's hooks disagreeing about how to say "a connection": seven took `unknown` and `resolveConnection` took the closed `ConnectionConfig` union. Neither is a type a contributed dialect can work with, so each package asserted its way back to its own — `@nocobase/db-dameng` through `source as unknown as DamengConnectionConfig`, a double assertion, which is what two types with no overlap require.

  `DatabaseDriverDefinition<TDialect, TConfig>` now carries the connection type, and every hook receives it. All eight dialect packages name theirs and the assertions are gone; the lint rule that reports a redundant assertion is what removed the last of them.

  The hooks are declared as methods rather than function properties. TypeScript checks method parameters bivariantly, which is what lets a driver narrowed to one dialect sit in the `drivers` map holding drivers for all of them. The pairing that gives up on is one the runtime enforces anyway: a driver is looked up by the connection's own dialect, so it is only ever handed a config of the dialect it declares.

  `DatabaseConfig` is now an alias of `ExtensibleDatabaseConfig<ConnectionConfig>` rather than a second interface. The two were written out separately and stayed field-for-field identical, which left every consumer choosing between two names for one shape — `@nocobase/app-server` chose the closed one, which is why an application could not configure a contributed dialect at all.

  Also: `AnyConnectionConfig` is exported as the constraint to write connection-generic code against; `BaseConnectionConfig.pool` is `Knex.PoolConfig` instead of `unknown`, which is what `configurePool` already said it was; and `@nocobase/db-oceanbase` declares `OceanbaseConnectionConfig` instead of reusing `MysqlConnectionConfig`, whose dialect literal is `'mysql'`.

  This is a step toward inferring a database's connections from its registered `drivers`, which would turn `Database dialect "..." is not registered.` from a startup error into a compile error. That inference needs the driver to own its connection type first.

- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.0

### Minor Changes

- ceb356b: Add dialect factories and driver descriptors for MySQL, SQLite, MSSQL, and Oracle.

### Patch Changes

- ceb356b: Move all concrete dialect connection resolution, schema inspectors, native
  driver loading, pool hooks, precise integer codecs, and capability profiles into
  the corresponding dialect packages. `@nocobase/db` now requires an explicitly
  registered dialect driver and no longer exports concrete dialect inspectors or
  native-driver fallbacks.
- ceb356b: Expose the dialect runtime strategy contract used by database connections and
  the Knex-backed query, repository, schema, and application composition
  adapters. Dialect packages now own connection defaults, ownership identity, and
  local storage preparation, while the database configuration API accepts
  additional dialect identifiers without core changes.
- ceb356b: Add the destructive `pnpm migrate --fresh --force` workflow for managed
  connections. It clears dialect-owned schema objects, reruns visible migrations,
  requires confirmation in interactive terminals, and rejects external
  connections.
- 590861e: Decode JSON columns according to a result form the dialect declares instead of guessing from the value.

  A driver either parses a JSON column before returning the row or hands back the stored text, and the returned value carries no evidence of which. Decoding by attempting to parse any string therefore corrupted a JSON string whose content is itself JSON: writing `'{"a":1}'` and reading it back produced the object `{ a: 1 }` on PostgreSQL, Kingbase, MySQL, and OceanBase, whose drivers parse JSON themselves. Each dialect now declares `jsonResults`, and a value that a text driver cannot parse is reported as `INVALID_STORED_VALUE` rather than returned as the raw string.

  Where the driver can be told to behave the other way, the declaration is derived from the resolved connection rather than fixed: mysql2 returns a json column as text under `jsonStrings`, which reaches it through `driverOptions`, and the Dameng driver decodes the column under `parseJson`. A fixed declaration would be wrong for exactly those connections, which is the failure this change exists to remove.

  Query and Repository also no longer disagree about a column holding the JSON literal `null`: Query fell back to the raw value whenever a decoder legitimately returned `null`, so the stored text leaked back to the caller.

  Altering a JSON column on Oracle no longer fails with `ORA-40664`. Knex compiles a JSON column to `varchar2(4000) check (col is json)`, and repeating that definition on a MODIFY asks Oracle for a second IS JSON check constraint on the same column. A dialect now learns whether a column is being created or redefined, and Oracle omits the constraint while altering; the MODIFY leaves the constraint the original definition created in place.

  A dialect that builds a JSON column as something other than Knex's `json()` also loses the JSON default handling that comes with it, and an object default would reach the column as `[object Object]` — on Oracle that is text its own IS JSON constraint then rejects. Such a dialect now asks for the default as encoded text, while MySQL keeps receiving the value because that is what makes it compile the expression form its engine requires. A JSON default consequently works on Dameng, where the column is a plain clob and the default was silently stored as something that could not be read back.

- 35f9722: Give every dialect package a `check` script.

  `db-sqlite`, `db-mysql`, `db-oracle`, `db-mssql` and
  `db-testkit` gain the `check` script the other dialect packages already had;
  `db-testkit` also typechecks its unit and integration trees there, which its
  base `typecheck` does not cover.

- ceb356b: Add explicit `--test-file` selection and `--pause-on-failure` support to database integration test commands.
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

- Add the SQLite dialect factory, driver descriptor, schema inspector, precise integer client, and Knex client integration for `@nocobase/db`.
