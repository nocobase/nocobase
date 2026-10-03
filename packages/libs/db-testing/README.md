# @nocobase/db-testing

Database fixtures for tests outside the `@nocobase/db` packages — plugins, libraries, applications — that must not depend on one dialect. A test written with it runs on SQLite by default and on any other dialect when the environment names one, without changing a line. A plugin's or an application's tests reach all of it through `@nocobase/app-testing/server`, which re-exports `./vitest`, and depend on that package instead; a library imports this one directly.

`@nocobase/db-testkit` is the other database test package and serves a different reader: it holds the shared contract suite every `@nocobase/db-<dialect>` package runs against itself. Use this package to test code that uses a database, and that one to test a database dialect.

## Selecting the dialect

| Variable                   | Effect                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| `NOCOBASE_TEST_DB_DIALECT` | `sqlite` when unset. Any other value loads `@nocobase/db-<dialect>/testing` |

The dialect packages are optional peer dependencies: SQLite is required, every other dialect only when it is selected, and a dialect that is not installed fails with the name of the package to add. In this repository they are development dependencies of this package, so every workspace package can select any of them.

Each dialect reads its server from the variables its own integration suite uses:

| Dialect     | Variables and defaults                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postgres`  | `POSTGRES_HOST` (`127.0.0.1`), `POSTGRES_PORT` (`15432`), `POSTGRES_USER` / `POSTGRES_PASSWORD` (`nocobase`), `POSTGRES_DATABASE` (`nocobase_collection_builder`); `PG*` also work |
| `mysql`     | `MYSQL_HOST` (`127.0.0.1`), `MYSQL_PORT` (`3306`), `MYSQL_ADMIN_USER` (`root`), `MYSQL_ADMIN_PASSWORD` or `MYSQL_ROOT_PASSWORD` (`root`)                                           |
| `kingbase`  | `KINGBASE_HOST` (`127.0.0.1`), `KINGBASE_PORT` (`54321`), `KINGBASE_USER` / `KINGBASE_PASSWORD` (`nocobase`), `KINGBASE_DATABASE` (`test`); `PG*` also work                        |
| `oceanbase` | `OCEANBASE_HOST` (`127.0.0.1`), `OCEANBASE_PORT` (`2881`), `OCEANBASE_USER` (`root@test`), `OCEANBASE_PASSWORD` (`ObTest_123456`)                                                  |
| `mssql`     | `MSSQL_HOST` (`127.0.0.1`), `MSSQL_PORT` (`1433`), `MSSQL_USER` (`sa`), `MSSQL_PASSWORD` (`NocoBase_Mssql_2026`)                                                                   |
| `oracle`    | `ORACLE_HOST` (`127.0.0.1`), `ORACLE_PORT` (`1521`), `ORACLE_ADMIN_USER` (`system`), `ORACLE_ADMIN_PASSWORD` (`nocobase`), `ORACLE_SERVICE_NAME` (`FREEPDB1`)                      |
| `dameng`    | `DAMENG_HOST` (`127.0.0.1`), `DAMENG_PORT` (`5236`), `DAMENG_USER` (`SYSDBA`), `DAMENG_PASSWORD` (`SYSDBA001`)                                                                     |

The defaults are those of the services in `docker-compose.yml` of `@nocobase/app-template-examples`, which also ships in every application created from that template and reads the same port variables. Starting a service from it is enough to run tests on that dialect without setting anything else:

```bash
docker compose -f packages/templates/app-template-examples/docker-compose.yml up -d --wait postgres
NOCOBASE_TEST_DB_DIALECT=postgres pnpm --filter @nocobase/app-plugin-scheduler test
```

In this repository, `pnpm test:db` does the same with a disposable server instead: it starts the dialect from its package's Compose file on a random port, runs the filtered packages' tests one after another, and removes the server afterwards.

```bash
pnpm test:db mysql --filter @nocobase/app-plugin-scheduler -- tests/database.test.ts
```

`pnpm test:db <dialect> --all` runs every package that declares this package. The repository's Database tests workflow runs it on PostgreSQL and MySQL every night, and on any dialect, or for one package, when started by hand.

Every test file gets databases of its own — a schema on PostgreSQL and KingbaseES, a database on MySQL, OceanBase and SQL Server, a user on Oracle and Dameng, a file under the system's temporary directory on SQLite (`NOCOBASE_TEST_DB_SQLITE_DIRECTORY` moves it) — named `nbt_<host>_<pid>_…`, and drops them when it finishes, so files running in parallel never share state.

A run that is killed cannot drop its databases. The next run on the same machine removes them: before it provisions anything, it drops every `nbt_` database whose host tag is this machine's and whose process no longer exists. Databases another machine created on a shared server, and those of runs still in progress, are left alone. A failure to clean up is reported as a warning and never fails the run.

## A test with a database

```ts
// tests/fixtures.ts
import { fileURLToPath } from 'node:url';
import { createDatabaseTest } from '@nocobase/db-testing/vitest';

export const migrations = [
  {
    packageName: '@nocobase/app-plugin-example',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

export const test = createDatabaseTest({ migrations });
```

```ts
// tests/orders.test.ts
import { expect } from 'vitest';
import { test } from './fixtures.js';

test('creates an order', async ({ connection }) => {
  await connection.repository('orders').createOne({ values: { id: 'o1' } });
  await expect(connection.repository('orders').count()).resolves.toBe(1);
});
```

The context carries `database` (the `DatabaseManager`), `connection` (its default connection), `dialect`, `capabilities`, and `expectCollection`. Name the export `test` or `it`: the shared ESLint configuration recognises those names as test blocks.

| Option          | Meaning                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations`    | Applied, in name order across all sources, before every test                                                                                                                                                                    |
| `seeds`         | Run after the migrations                                                                                                                                                                                                        |
| `isolation`     | `'schema'` (default): every test starts from emptied databases; a test that runs concurrently with its siblings (`test.concurrent`, `describe.concurrent`) gets databases of its own. `'none'`: one database for the whole file |
| `connections`   | Names of the connections to provision, each its own database; the first is the default                                                                                                                                          |
| `metadataStore` | A factory for the Collection metadata store; defaults to the store the connection keeps in its database. A store supplied here is emptied together with the schema                                                              |

`'schema'` matches what a new in-memory database in every `beforeEach` gives today. It runs the migrations again for each test, which costs little on SQLite and noticeably more on a server; choose `'none'` for a file whose tests are written to share state.

## Skipping what a dialect cannot do

`testDatabaseCapabilities()` resolves the selected dialect's capabilities before any database exists, so a test file can decide what to skip while its tests are being collected:

```ts
import { testDatabaseCapabilities } from '@nocobase/db-testing';
import { test } from './fixtures.js';

const capabilities = await testDatabaseCapabilities();

test.skipIf(!capabilities.partialIndexes)(
  'allows repeated empty keys',
  async ({ connection }) => {
    // …
  },
);
```

Branch on a capability rather than on a dialect name where one describes the difference, so a dialect added later is handled without editing the test. `testDatabaseDialect()` returns the name synchronously for the rare test that is about one database's behaviour.

## Testing a migration

`describeMigration` declares the test every migration needs. It applies the migrations before this one, runs `before`, applies this one and runs `up`, rolls it back and checks that every table is exactly what it was before it ran — its Fields, indexes and foreign keys, not only its name — runs `down`, then applies it again and runs `up` once more. After every step it checks that Collection metadata and physical tables agree.

```ts
import { describeMigration } from '@nocobase/db-testing/vitest';
import { migrations } from './fixtures.js';

describeMigration('202609020001_example_create_orders', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('orders').toHaveIndex(['number'], { unique: true });
    await expectCollection('orderItems').toHaveForeignKey(
      ['orderId'],
      'orders',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('orders').not.toExist();
  },
});
```

`before` is where a data migration's test writes the rows the migration has to carry forward. `reversible: false` is for a migration without `down`, which is then only applied. `verifyMigration` runs the same steps without declaring a test.

## Asserting on the schema

`expectCollection(name)` reads the physical schema through the connection's inspector and resolves it back to Field and Collection names, so one expectation holds on every dialect:

- `toExist()` — resolves with the snapshot for further assertions
- `toHaveField(name, { type?, nullable?, length? })`
- `toHaveIndex(fields, { unique? })` — an index or a unique constraint over exactly these Fields
- `toHaveForeignKey(fields, collection, { referencedFields?, onDelete?, onUpdate? })`
- `not.toExist()`, `not.toHaveField(name)`, `not.toHaveIndex(fields)`, `not.toHaveForeignKey(fields, collection)`

Physical names are deliberately not compared: index and constraint names are truncated, case-folded or generated differently by each database. Referential actions are reported as the database stores them, and not every database supports every action — Oracle has no `ON DELETE RESTRICT` — so assert on `onDelete` only where the behaviour itself is under test. `inspectCollection(connection, name)` returns the same snapshot without asserting.

## What to write instead of SQLite-specific code

| Instead of                                            | Write                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `drivers: { sqlite }` with `filename: ':memory:'`     | `createDatabaseTest()`, or `createTestDatabase()` outside Vitest      |
| Importing migrations and calling `up()` by hand       | `migrations` sources, which run in the order an application runs them |
| `PRAGMA index_list`, `foreign_key_list`, `table_info` | `expectCollection()` or `inspectCollection()`                         |
| `select … from sqlite_master`                         | `connection.schemaInspector.listPhysicalCollections()`                |
| Raw `insert` statements to prepare rows               | `connection.repository(…)` or `connection.query.insertInto(…)`        |
| A `CREATE TRIGGER` that makes a write fail            | `vi.spyOn(…).mockRejectedValueOnce(…)` on the repository or service   |

## Without Vitest

`createTestDatabase(options)` provisions and opens in one call and `destroy()` drops everything again. `provisionTestDatabases(options)` provisions once and `open()` gives a fresh `DatabaseManager` on emptied databases as often as needed; `connectionConfig(name)` returns a connection configuration for code that builds its own manager. Vitest is an optional peer dependency that only the `@nocobase/db-testing/vitest` entry needs; the root entry works under any test runner.

## Adding a dialect

A dialect package exports a `TestDatabaseProvisioner` — the interface is in `@nocobase/db/testing` — as `testDatabaseProvisioner` from a `./testing` entry. A server dialect builds it with `createSqlTestDatabaseProvisioner()` from the same entry, giving it the connection options for the server and for an isolated database and the statements that create, drop and list isolated databases, as `@nocobase/db-postgres` and `@nocobase/db-mysql` do; a step may take several statements, and `identifier` names the database the way a server that folds names to upper case keeps it, as `@nocobase/db-oracle` does. Its integration suite runs `describeTestDatabaseProvisioner()` from `@nocobase/db-testkit` against the provisioner. `capabilities` is the capabilities its driver declares. `provision({ name, env })` creates the isolated database or schema called `name` and returns its connection configuration with a `drop()` that removes it. A dialect whose databases outlive the process also implements `listProvisioned({ prefix, env })` and `dropProvisioned({ name, env })`, which the cleanup of interrupted runs uses. `provisionTestDatabases({ provisioner })` takes one directly instead of loading it by dialect, which is how a provisioner is tried before its package exports it. Everything specific to the database stays in the dialect package; this package only selects the provisioner by name.
