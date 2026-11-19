# 3. Migration and Seed

[Contents](./README.md) · [Previous: Connection](./connection.md) · [Next: Collection and Schema](./collection-and-schema.md)

Migrations describe schema evolution and seeds describe installation or sample data. Create their runners from DatabaseManager or the standalone factory functions.

## Runner overview

| API                               | Operations                                                                 |
| --------------------------------- | -------------------------------------------------------------------------- |
| Migration definitions and loading | `defineMigration`, `loadMigrations`, `validateMigrations`                  |
| Migrator creation                 | `db.createMigrator(options)` or `createMigrator({ database, ...options })` |
| `Migrator`                        | `latest`, `upTo`, `rollback`, `repair`, `history`, `lock`, `unlock`        |
| Seed definitions and loading      | `defineSeed`, `loadSeeds`, `validateSeeds`                                 |
| Seeder creation                   | `db.createSeeder(options)` or `createSeeder({ database, ...options })`     |
| `Seeder`                          | `run`, `runSamples`, `record`, `repair`, `history`, `lock`, `unlock`       |

## Migration definitions, sources and execution

`defineMigration()` defines a migration. `loadMigrations()` and `validateMigrations()` load and validate sources; `MigrationSource` identifies a directory and package. `createMigrator()` accepts a database dependency, while `db.createMigrator()` supplies it. `latest()` runs pending migrations, `upTo()` advances to a target, and `rollback()` uses the available down operations.

`MigrationContext` provides task-bound schema and data handles, configuration and service resolution. Take handles from the context so they participate in the runner's connection and transaction. Merged migrations are immutable and self-contained; corrections require a new migration. See [Migration signatures](./signatures/migration.md), [definition examples](../zh-CN/migration/define-migration.md) and [execution options](../zh-CN/migration/create-migrator.md).

`shouldRun()` is evaluated for pending migrations under the migration lock; returning `false` skips execution without recording history. Source `parameters` contribute to the migration's history identity, while applicability `configuration` does not. Keep that distinction when generating sources for several targets.

## Seed definitions and sample data

`defineSeed()`, `loadSeeds()` and `validateSeeds()` describe and load installation data. `SeedContext` exposes repository/query access, configuration and service resolution through a restricted connection; it has no schema builder.

`run()` handles pending seeds. Sample seeds run when sample loading is enabled, otherwise they are recorded as skipped. `runSamples()` executes previously skipped sample seeds; it leaves never-run seeds to `run()`. `record()` writes a history entry without executing a seed. See [Seed signatures](./signatures/seed.md) and [seed examples](../zh-CN/seed/define-seed.md).

## History, checksums and task locks

Both runners expose `history()`, `repair()`, `lock()` and `unlock()`. `repair()` changes stored checksums without running schema or data operations. Unlocking an active task requires the explicit force option. Task-lock exports include `TaskLockBusyError`, `isTaskLockBusyError`, lock-state/release types and expiry/heartbeat constants.

Checksum mismatch policies, takeover notifications and lock timeouts belong to the runner options. Use the [Migration](./signatures/migration.md) and [Seed](./signatures/seed.md) signatures for exact inputs and result types.

`onChecksumMismatch` defaults to `warn`, which reports drift while allowing execution to continue. Use `error` when drift must stop the runner; migration immutability is not enforced by the default warning policy alone.

## Missing migration sources and rollback

`onMissingSource` defaults to `warn`: `latest()` and `upTo()` report missing applied sources in `warnings` and continue without deleting or rerunning their history. Set it to `error` for strict validation of packages still present in the configured sources. History belonging to uninstalled packages is ignored during forward migration. If a missing record sorts after the same package's newest available source, the database is newer than the code and always fails, even with `warn`. A package with no remaining sources has no newest migration to compare; its missing history follows the configured policy.

Migration results use `MigrationWarning`, a union of `ChecksumMismatch` and `MissingMigrationSource`. Missing sources carry `kind: 'missing-source'`, `packageName` and `name`; checksum warnings keep their existing fields. Database commands and automatic startup logs report each warning.

`rollback()` selects the latest global batch, validates every target migration before executing any `down()`, and reports all missing or irreversible targets together. A missing target always blocks rollback, including an uninstalled plugin and regardless of `onMissingSource`. Restore compatible plugin or package versions and roll back before uninstalling, or make the structural change in a new forward migration. Rollback never skips the target batch or removes history without executing its `down()`. Missing sources and checksum drift in older batches are warnings; strict checksum validation applies only to the target batch. A dry run performs the same preflight and changes no schema or history.

## Transaction and event behavior

Definitions declare their transaction mode; the runner binds context handles accordingly. See [Transactions](./transactions.md#transactions-in-migrations-and-seeds) for how task transactions relate to connection transactions. Writes through migration/seed task handles do not produce application Repository mutation events.

Currently `true`, `'auto'` and an omitted transaction mode all open a connection transaction. `'auto'` does not detect unsupported DDL and retry without a transaction. `false` runs directly, so a failure can leave partial work without a completion history record. DDL rollback behavior remains dialect-dependent.

[Contents](./README.md) · [Previous: Connection](./connection.md) · [Next: Collection and Schema](./collection-and-schema.md)
