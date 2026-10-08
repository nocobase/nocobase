# @nocobase/db-mysql

## 0.1.0-beta.4

### Patch Changes

- 8a6a296: The schema inspector reads back the default of a character, enum or temporal column as the value it was given. MySQL and OceanBase report a literal default as the bare text, `draft` rather than `'draft'`, which was taken for an expression, so a resolved Collection lost every such default: a defaulted NOT NULL string or enum field was listed as required in the API document's create schema, and a default such as `'42'` or `'NULL'` read back as a number or as null. MariaDB 10.2.7 and later, which report the default as it was declared, are recognized from `version()`: their backslash escapes are resolved, so a default such as `it's` or `back\slash` no longer reads back with an escape left in it, and the bare `NULL` they report for a column without a default reads as no default. The JSON field filters run on MariaDB 10.9 and later, which has no `cast(… as json)`: equality and membership are compared through `JSON_OVERLAPS`, equality in both directions because MariaDB alone takes `[1, 2]` for equal to `[1]`, and the JSON filters therefore need MySQL 8.0.17 or later, as membership already did. A temporal default that does not start like a date or a time, such as `curdate()`, stays an expression, and on OceanBase, which reports `default (uuid())` exactly as it reports `default 'uuid()'`, a character column's default is told apart by reading the table's DDL, so an expression default is never handed to the Repository as a value to write; a view, whose DDL declares no defaults, reads a character default shaped like a function call as an expression.
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
  - @nocobase/db@1.0.0-beta.18

## 0.1.0-beta.3

### Minor Changes

- be0fbbd: Connections run their transactions at READ COMMITTED, the isolation level PostgreSQL, SQL Server, Oracle and OceanBase default to and the one NocoBase's code is written and tested against. Under MySQL's REPEATABLE READ default a transaction's snapshot was taken at its first read — the Collection metadata lookup every transaction starts with — so a check made after taking a lock still saw rows a concurrent transaction had committed away. Two administrators could delete each other and leave no enabled administrator, although the guard locks the Permission Set before counting. Each pooled connection sets `transaction isolation level read committed` for its session when it is created; within a transaction, a repeated read now sees what other transactions committed in between, as it does on PostgreSQL.
- be0fbbd: `@nocobase/db/testing` exports `TestDatabaseProvisioner`, the contract a dialect package implements so `@nocobase/db-testing` can create isolated databases on it, with `ProvisionedTestDatabase`, `TestDatabaseProvisionOptions` and `TestDatabaseEnvironment`. `@nocobase/db-sqlite`, `@nocobase/db-postgres` and `@nocobase/db-mysql` export one as `testDatabaseProvisioner` from a new `./testing` entry: SQLite creates a database file under `NOCOBASE_TEST_DB_SQLITE_DIRECTORY` or the system's temporary directory, so a second manager opens the same database as on a server, PostgreSQL creates a schema in the database its `POSTGRES_*` variables name, and MySQL creates a database through the administrative account in `MYSQL_ADMIN_USER` and `MYSQL_ADMIN_PASSWORD` (or `MYSQL_ROOT_PASSWORD`). `postgresTestConnection()` and `mysqlTestConnection()` return the connection options those variables describe. All three also implement the optional `listProvisioned` and `dropProvisioned`, which `@nocobase/db-testing` uses to remove the databases an interrupted run left behind; `TestDatabaseListOptions` describes the first. A provisioner also carries `capabilities`, the capabilities its driver declares. `createSqlTestDatabaseProvisioner()` builds one for a server dialect from its connection options and the statements that create, drop and list isolated databases, each run on an administrative connection opened for it and closed afterwards; the PostgreSQL and MySQL provisioners are built with it.

### Patch Changes

- 4403687: A text field's `defaultValue` reaches the MySQL table. Knex compiles a column default as a literal and drops any default on a TEXT or BLOB column without a warning, because MySQL accepts one there only in the expression form `default ('…')`, available since 8.0.13. A Repository still filled the value in, but a row inserted any other way — a migration's `query`, another service, a SQL prompt — failed on a NOT NULL text column with "Field doesn't have a default value". The MySQL dialect now gives a `text`, `tinytext`, `mediumtext` or `longtext` column with a string, number or boolean default the expression form `default ('…')`, through the new `schema.columnDefault` hook of `@nocobase/db`, when a Collection is created and when a field is added or altered. A table created before this keeps its column as it is: run an alteration that redeclares the field to give it the default. The expression form needs MySQL 8.0.13 or MariaDB 10.2.1; on an earlier server, a Collection that gives a text field a default now fails to create or alter with a syntax error instead of silently losing the default. The inspector reads such a default back as the value it was given: MySQL reports an expression default escaped twice, once as a string literal and again by `information_schema`, and a quote or backslash in the value used to come back with an escape left in it.
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

## 0.1.0-beta.2

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

## 0.1.0-beta.1

### Patch Changes

- 1d5ee9a: Read the value of an expression default from `information_schema`

  MySQL reports an expression default — which every defaulted `json` column has, since MySQL accepts no literal default on `json` — as the expression it evaluates, `_utf8mb4\'{"enabled":true}\'`, rather than as a value. The shared literal parser did not recognise the character-set introducer or the backslash-escaped quotes, so the inspector returned the default's expression without a value and a resolved json Field carried no `defaultValue`. The introducer is now stripped and the escapes undone before parsing, so the default reads as the `'...'` literal it stands for.

- Updated dependencies [1d5ee9a]
- Updated dependencies [211538b]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
  - @nocobase/db@1.0.0-beta.6

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

- ceb356b: Make dialect integration tests own their disposable Docker Compose environments
  with random host ports and automatic cleanup.
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

- Add the MySQL dialect factory, driver descriptor, schema inspector, and Knex client integration for `@nocobase/db`.
