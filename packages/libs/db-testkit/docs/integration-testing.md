# Database integration testing

## Dialect test boundary

Each dialect package owns a `DatabaseDialectTestAdapter`. The adapter creates one isolated context and is responsible for its connection, schema setup, physical cleanup, and native driver options. Shared contracts consume only the portable operations exposed by `DatabaseContractContext`.

The shared package must not import a concrete dialect or inspect a dialect name. Catalog queries such as `PRAGMA`, `information_schema`, `user_*`, and `sys.*` belong to the dialect package that owns the database.

The shared integration suite lives in this package under `tests/integration`. It exercises the `@nocobase/db` manager, builder, repository, query, metadata, migration, seed, and schema contracts without choosing a database. Each dialect package loads the same suite through its own adapter, so adding a new dialect does not require changing the core package or copying the suite.

Dialect-specific SQL, catalog inspection, native types, and driver behavior remain in the matching `@nocobase/db-<dialect>` package. A shared contract may be run by many dialect packages through their adapters, so a test added under `tests/integration` must stay portable: no dialect name and no catalog SQL.

## Choosing which suites to run locally

Run the least that covers the change, one suite at a time, and let CI cover the matrix it selects. The scheduling rules and CI selection are in the repository `AGENTS.md` under "Database Integration Test Scheduling".

| What changed                                                                                           | Run                                                                  |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `packages/libs/db-<dialect>/` — adapter, SQL, catalog inspection, driver options                       | that dialect only                                                    |
| `packages/libs/db-testkit/tests/integration/` — a shared contract every dialect loads                  | `sqlite`, then one Docker-backed dialect such as `postgres`          |
| `packages/libs/db-testkit/src/` — runner, loader, adapter contract, profile                            | `sqlite`, then one Docker-backed dialect: the harness itself changed |
| `packages/libs/db/src/` under `query/`, `schema/`, `repository/`, `metadata/`, `migration/`, `json.ts` | `sqlite`, then `postgres`, `mysql`, `kingbase`, one after another    |
| `packages/libs/db/src/` elsewhere — `naming/`, types, tokens                                           | unit tests only; no integration suite                                |
| A dialect-specific defect reported against one database                                                | that dialect, with `--test-file` narrowed to the failing contract    |

## Commands

Run one dialect from the repository root:

```bash
pnpm --filter @nocobase/db-postgres test:integration
```

Narrow to shared contract files. The standalone `--` is what forwards the arguments to the runner, and paths are relative to `packages/libs/db-testkit/tests/integration`:

```bash
pnpm --filter @nocobase/db-mysql test:integration -- \
  --test-file tests/integration/schema/inspector.test.ts \
  --test-file tests/integration/query/where.test.ts
```

The wrapper always runs `core-suite.test.ts` first so the dialect adapter is installed before a selected file loads. When a run fails, `--pause-on-failure` keeps the containers alive until you press Enter; it is for an interactive terminal and exits normally in CI. `KEEP_TEST_DB=1` keeps the database without pausing.

If a run was interrupted, check for leftover Compose services before starting the next suite. The runner uses a random project name and removes its own containers, volumes, and orphans on exit.

## Running other packages' tests on a dialect

Each server dialect declares its Compose service once, in `packages/libs/db-<dialect>/scripts/integration-service.ts`. Its own `test:integration` runs the shared suite against it through `runDatabaseIntegration`, and the repository's `pnpm test:db` runs any package's tests against it through `runWithDatabaseService`, with `NOCOBASE_TEST_DB_DIALECT` set so that `@nocobase/db-testing` selects the dialect:

```bash
pnpm test:db postgres --filter @nocobase/app-plugin-scheduler -- tests/database.test.ts
```

Arguments after the standalone `--` reach every filtered package's `test` script, and the packages run one after another. `sqlite` starts nothing. The same rules apply as to the integration suites: one run at a time, and `KEEP_TEST_DB=1` keeps the service.

## Commands that silently run less than they appear to

- `pnpm --filter @nocobase/db test:integration` does nothing useful: `@nocobase/db` has no integration script. It used to forward to each dialect and read as a full run while only running SQLite. Always name the dialect package, and for full verification run the eight suites one after another.
- Dropping the standalone `--` leaves `--test-file` unconsumed by the runner and silently runs the whole shared suite.
- `pnpm -r test` excludes `**/tests/integration/**` in every `db-*` package, so it reports success having executed no integration test at all.
