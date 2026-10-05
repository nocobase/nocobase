# @nocobase/db-oceanbase

## 0.1.0-beta.2

### Minor Changes

- 463a7a8: `@nocobase/db-testing` can run tests on every server dialect. `@nocobase/db-kingbase`, `@nocobase/db-oceanbase`, `@nocobase/db-mssql`, `@nocobase/db-oracle` and `@nocobase/db-dameng` each export a `testDatabaseProvisioner` from a new `./testing` entry, with defaults matching the services in the examples application's `docker-compose.yml`: KingbaseES isolates a test database in a schema, OceanBase and SQL Server in a database, and Oracle and Dameng in a user of its own, since both inspect the connected user's objects. `@nocobase/db-testing` declares the five as optional peers. `createSqlTestDatabaseProvisioner()` from `@nocobase/db/testing` accepts a list of statements for a step, binds every `??` and `?` in them to the database's identifier, and takes an `identifier` option for a server that folds unquoted names to upper case; when a later create statement fails, it drops what the earlier ones created. The Oracle provisioner drops a test user on every supported version rather than only on 23ai, and grants it the materialized view and synonym privileges a migration may need. `@nocobase/db-testkit` exports `describeTestDatabaseProvisioner()`, the suite each dialect's integration tests run against its provisioner.

### Patch Changes

- be0fbbd: Each dialect's Compose service for its integration suite is declared in `scripts/integration-service.ts`, which the suite's runner and the repository's `pnpm test:db` both read. Nothing these packages ship changes.
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

- ceb356b: Add an OceanBase CE dialect package with an isolated integration test environment.

### Patch Changes

- 590861e: Decode JSON columns according to a result form the dialect declares instead of guessing from the value.

  A driver either parses a JSON column before returning the row or hands back the stored text, and the returned value carries no evidence of which. Decoding by attempting to parse any string therefore corrupted a JSON string whose content is itself JSON: writing `'{"a":1}'` and reading it back produced the object `{ a: 1 }` on PostgreSQL, Kingbase, MySQL, and OceanBase, whose drivers parse JSON themselves. Each dialect now declares `jsonResults`, and a value that a text driver cannot parse is reported as `INVALID_STORED_VALUE` rather than returned as the raw string.

  Where the driver can be told to behave the other way, the declaration is derived from the resolved connection rather than fixed: mysql2 returns a json column as text under `jsonStrings`, which reaches it through `driverOptions`, and the Dameng driver decodes the column under `parseJson`. A fixed declaration would be wrong for exactly those connections, which is the failure this change exists to remove.

  Query and Repository also no longer disagree about a column holding the JSON literal `null`: Query fell back to the raw value whenever a decoder legitimately returned `null`, so the stored text leaked back to the caller.

  Altering a JSON column on Oracle no longer fails with `ORA-40664`. Knex compiles a JSON column to `varchar2(4000) check (col is json)`, and repeating that definition on a MODIFY asks Oracle for a second IS JSON check constraint on the same column. A dialect now learns whether a column is being created or redefined, and Oracle omits the constraint while altering; the MODIFY leaves the constraint the original definition created in place.

  A dialect that builds a JSON column as something other than Knex's `json()` also loses the JSON default handling that comes with it, and an object default would reach the column as `[object Object]` — on Oracle that is text its own IS JSON constraint then rejects. Such a dialect now asks for the default as encoded text, while MySQL keeps receiving the value because that is what makes it compile the expression form its engine requires. A JSON default consequently works on Dameng, where the column is a plain clob and the default was silently stored as something that could not be read back.

- ceb356b: Describe JSON default support in dialect integration profiles and avoid
  misclassifying OceanBase expression defaults as generated columns.
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

- Add the OceanBase CE dialect factory, driver descriptor, schema inspector, and integration test environment.
