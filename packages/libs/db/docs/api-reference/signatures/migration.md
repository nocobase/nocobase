# Migrations and task locks: signatures

Define, load, validate and execute immutable migrations; inspect history, repair checksums deliberately, and inspect or release task locks. Take schema/data handles from the migration context.

[Chapter](../migration-and-seed.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                         | Access               |
| ------------------------------------------------------------------- | -------------------- |
| [ChecksumMismatch](#checksummismatch)                               | `@nocobase/db` type  |
| [ChecksumMismatchPolicy](#checksummismatchpolicy)                   | `@nocobase/db` type  |
| [CreateMigratorOptions](#createmigratoroptions)                     | `@nocobase/db` type  |
| [DatabaseMigratorOptions](#databasemigratoroptions)                 | `@nocobase/db` type  |
| [DatabaseTaskConfig](#databasetaskconfig)                           | `@nocobase/db` type  |
| [LoadMigrationsOptions](#loadmigrationsoptions)                     | Supporting contract  |
| [LoadedMigration](#loadedmigration)                                 | Supporting contract  |
| [MigrationConnection](#migrationconnection)                         | Supporting contract  |
| [MigrationContext](#migrationcontext)                               | `@nocobase/db` type  |
| [MigrationDefinition](#migrationdefinition)                         | `@nocobase/db` type  |
| [MigrationHistoryRecord](#migrationhistoryrecord)                   | `@nocobase/db` type  |
| [MigrationRepairOptions](#migrationrepairoptions)                   | `@nocobase/db` type  |
| [MigrationRepairResult](#migrationrepairresult)                     | `@nocobase/db` type  |
| [MigrationRollbackOptions](#migrationrollbackoptions)               | `@nocobase/db` type  |
| [MigrationRollbackResult](#migrationrollbackresult)                 | `@nocobase/db` type  |
| [MigrationRunResult](#migrationrunresult)                           | `@nocobase/db` type  |
| [MigrationSource](#migrationsource)                                 | `@nocobase/db` type  |
| [MigrationTransactionMode](#migrationtransactionmode)               | `@nocobase/db` type  |
| [Migrator](#migrator)                                               | `@nocobase/db` type  |
| [StaleTaskLockTakeover](#staletasklocktakeover)                     | `@nocobase/db` type  |
| [TASK_LOCK_EXPIRY_MS](#task_lock_expiry_ms)                         | `@nocobase/db` value |
| [TASK_LOCK_HEARTBEAT_INTERVAL_MS](#task_lock_heartbeat_interval_ms) | `@nocobase/db` value |
| [TaskLockBusyDetails](#tasklockbusydetails)                         | `@nocobase/db` type  |
| [TaskLockBusyError](#tasklockbusyerror)                             | `@nocobase/db` value |
| [TaskLockReleaseOptions](#tasklockreleaseoptions)                   | `@nocobase/db` type  |
| [TaskLockReleaseResult](#tasklockreleaseresult)                     | `@nocobase/db` type  |
| [TaskLockState](#tasklockstate)                                     | `@nocobase/db` type  |
| [createMigrator](#createmigrator)                                   | `@nocobase/db` value |
| [defineMigration](#definemigration)                                 | `@nocobase/db` value |
| [isTaskLockBusyError](#istasklockbusyerror)                         | `@nocobase/db` value |
| [loadMigrations](#loadmigrations)                                   | `@nocobase/db` value |
| [validateMigrations](#validatemigrations)                           | `@nocobase/db` value |

## ChecksumMismatch

[Source](../../../src/migration/checksum-history.ts)

Import: `import type { ChecksumMismatch } from '@nocobase/db'`.

One executed task whose recorded checksum no longer matches its source.

```ts
/** One executed task whose recorded checksum no longer matches its source. */
export interface ChecksumMismatch {
  readonly packageName: string;
  readonly name: string;
  /** The checksum stored in history when the task was executed. */
  readonly recordedChecksum: string;
  /** The checksum of the task as it exists in the current sources. */
  readonly sourceChecksum: string;
}
```

## ChecksumMismatchPolicy

[Source](../../../src/migration/checksum-history.ts)

Import: `import type { ChecksumMismatchPolicy } from '@nocobase/db'`.

How a runner reacts when an executed task's recorded checksum no longer matches its source. `warn` reports the drift and continues; `error` refuses to run.

```ts
/**
 * How a runner reacts when an executed task's recorded checksum no longer
 * matches its source. `warn` reports the drift and continues; `error` refuses
 * to run.
 */
export type ChecksumMismatchPolicy = 'error' | 'warn';
```

## CreateMigratorOptions

[Source](../../../src/migration/types.ts)

Import: `import type { CreateMigratorOptions } from '@nocobase/db'`.

Configuration for a standalone Migrator, including its database dependency.

```ts
/** Configuration for a standalone Migrator, including its database dependency. */
export interface CreateMigratorOptions extends LoadMigrationsOptions {
  readonly config?: DatabaseTaskConfig;
  readonly container?: ServiceResolver;
  readonly database: {
    connection(name?: string): DatabaseConnection;
  };
  readonly connection?: string;
  readonly tableName?: string;
  readonly lockTableName?: string;
  /**
   * How long to wait for a concurrent run to release the lock before failing.
   * Defaults to 30 seconds.
   */
  readonly lockAcquireTimeoutMs?: number;
  /**
   * Called when a lock whose holder stopped sending heartbeats is taken over,
   * which is how a run recovers from a previous one being killed.
   */
  readonly onStaleLock?: (takeover: StaleTaskLockTakeover) => void;
  /**
   * How to react when an executed migration's source no longer hashes to the
   * checksum recorded for it. Defaults to `warn`.
   */
  readonly onChecksumMismatch?: ChecksumMismatchPolicy;
}
```

Related declarations: [ChecksumMismatchPolicy](./migration.md#checksummismatchpolicy), [DatabaseConnection](./connection.md#databaseconnection), [DatabaseTaskConfig](./migration.md#databasetaskconfig), [LoadMigrationsOptions](./migration.md#loadmigrationsoptions), [StaleTaskLockTakeover](./migration.md#staletasklocktakeover).

## DatabaseMigratorOptions

[Source](../../../src/migration/types.ts)

Import: `import type { DatabaseMigratorOptions } from '@nocobase/db'`.

Configuration accepted by DatabaseManager.createMigrator().

```ts
/** Configuration accepted by DatabaseManager.createMigrator(). */
export type DatabaseMigratorOptions = Omit<CreateMigratorOptions, 'database'>;
```

Related declarations: [CreateMigratorOptions](./migration.md#createmigratoroptions).

## DatabaseTaskConfig

[Source](../../../src/task-config.ts)

Import: `import type { DatabaseTaskConfig } from '@nocobase/db'`.

Read-only runtime configuration supplied by the task owner.

```ts
/** Read-only runtime configuration supplied by the task owner. */
export interface DatabaseTaskConfig {
  get<T = unknown>(key: string): T | undefined;
}
```

## LoadMigrationsOptions

[Source](../../../src/migration/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

Selects either one migration directory or an ordered set of named sources.

```ts
/** Selects either one migration directory or an ordered set of named sources. */
export interface LoadMigrationsOptions {
  readonly directory?: string;
  readonly packageName?: string;
  readonly extensions?: readonly string[];
  readonly sources?: readonly MigrationSource[];
}
```

Related declarations: [MigrationSource](./migration.md#migrationsource).

## LoadedMigration

[Source](../../../src/migration/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface LoadedMigration {
  /** Runtime configuration for applicability; excluded from history identity. */
  readonly configuration?: readonly Readonly<Record<string, unknown>>[];
  readonly parameters?: Readonly<Record<string, string>>;
  readonly packageName: string;
  readonly name: string;
  readonly filePath: string;
  readonly fileName: string;
  readonly checksum: string;
  /** Verified pre-manifest artifact hash used only to upgrade legacy history. */
  readonly legacyChecksum?: string;
  readonly migration: MigrationDefinition;
}
```

Related declarations: [MigrationDefinition](./migration.md#migrationdefinition).

## MigrationConnection

[Source](../../../src/migration/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

Restricted connection capabilities exposed to migration definitions.

```ts
/** Restricted connection capabilities exposed to migration definitions. */
export interface MigrationConnection {
  readonly name: string;
  readonly driver: DatabaseDriver;
  readonly dialect: DatabaseDialect;
  readonly capabilities: DatabaseCapabilities;
  client<T = unknown>(): Promise<T>;
}
```

Related declarations: [DatabaseCapabilities](./drivers.md#databasecapabilities), [DatabaseDialect](./connection.md#databasedialect), [DatabaseDriver](./connection.md#databasedriver).

## MigrationContext

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationContext } from '@nocobase/db'`.

Services available while applying or rolling back a migration.

```ts
/** Services available while applying or rolling back a migration. */
export interface MigrationContext {
  readonly config: DatabaseTaskConfig;
  readonly container: ServiceResolver;
  /** Runtime configuration for applicability; excluded from history identity. */
  readonly configuration?: readonly Readonly<Record<string, unknown>>[];
  /** Immutable target parameters declared by this migration source. */
  readonly parameters?: Readonly<Record<string, string>>;
  /** Structural changes. Every Collection, Field, Index and Constraint edit. */
  readonly builder: CollectionBuilder;
  /**
   * The default tool for data work. Reads and writes rows through the
   * Connection naming strategy, without Collection-level overrides.
   */
  readonly query: QueryAdapter;
  /**
   * Collection-level record access, bound to the connection this migration
   * runs on — the transaction's connection when it runs in one.
   *
   * Reach for it only where `query` would get the write wrong: cross-dialect
   * field encoding and decoding, Collection-level naming overrides, and
   * relation writes. Anything `query` expresses correctly stays on `query`.
   *
   * It resolves the Collection as it stands when the migration runs, so a
   * migration that uses it is betting on a shape it did not declare itself.
   * Keep that bet small, say in a comment why `query` was not enough, and do
   * not extend it to `down`, where the Collection has already moved on.
   */
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
  ): Repository<TRecord, TCreate, TUpdate>;
  readonly connection: MigrationConnection;
}
```

Related declarations: [CollectionBuilder](./builder.md#collectionbuilder), [DatabaseTaskConfig](./migration.md#databasetaskconfig), [MigrationConnection](./migration.md#migrationconnection), [QueryAdapter](./query.md#queryadapter), [Repository](./repository.md#repository), [RepositoryRecord](./inputs.md#repositoryrecord).

## MigrationDefinition

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationDefinition } from '@nocobase/db'`.

Named database change loaded and executed by a Migrator.

```ts
/** Named database change loaded and executed by a Migrator. */
export interface MigrationDefinition {
  readonly name: string;
  readonly transaction?: MigrationTransactionMode;
  readonly irreversible?: boolean;
  /** Evaluated for pending migrations under the migration lock. False does not record history. */
  shouldRun?(context: MigrationContext): boolean | Promise<boolean>;
  up(context: MigrationContext): Promise<void>;
  down?(context: MigrationContext): Promise<void>;
}
```

Related declarations: [MigrationContext](./migration.md#migrationcontext), [MigrationTransactionMode](./migration.md#migrationtransactionmode).

## MigrationHistoryRecord

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationHistoryRecord } from '@nocobase/db'`.

```ts
export interface MigrationHistoryRecord {
  readonly id: number;
  readonly packageName: string;
  readonly name: string;
  readonly batch: number;
  readonly checksum: string;
  readonly executedAt: Date | string;
  readonly durationMs: number | null;
}
```

## MigrationRepairOptions

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationRepairOptions } from '@nocobase/db'`.

Options accepted by Migrator.repair().

```ts
/** Options accepted by Migrator.repair(). */
export interface MigrationRepairOptions {
  /** Report what would be rewritten without writing anything. */
  readonly dryRun?: boolean;
}
```

## MigrationRepairResult

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationRepairResult } from '@nocobase/db'`.

Summary returned after realigning recorded migration checksums.

```ts
/** Summary returned after realigning recorded migration checksums. */
export interface MigrationRepairResult {
  /** Records rewritten, or the records a dry run would rewrite. */
  readonly repaired: ChecksumMismatch[];
  readonly dryRun: boolean;
}
```

Related declarations: [ChecksumMismatch](./migration.md#checksummismatch).

## MigrationRollbackOptions

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationRollbackOptions } from '@nocobase/db'`.

Options accepted by Migrator.rollback().

```ts
/** Options accepted by Migrator.rollback(). */
export interface MigrationRollbackOptions {
  /** Report the batch that would roll back without running any `down`. */
  readonly dryRun?: boolean;
}
```

## MigrationRollbackResult

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationRollbackResult } from '@nocobase/db'`.

Summary returned after rolling back the latest migration batch.

```ts
/** Summary returned after rolling back the latest migration batch. */
export interface MigrationRollbackResult {
  readonly batch: number;
  readonly rolledBack: string[];
  /**
   * The batch's history records, in the order they roll back. Present for a
   * dry run too, so a caller can show what a run would undo and which package
   * each migration belongs to.
   */
  readonly records: MigrationHistoryRecord[];
  /** Checksum drift the `warn` policy allowed the rollback to continue past. */
  readonly warnings: ChecksumMismatch[];
  readonly dryRun: boolean;
}
```

Related declarations: [ChecksumMismatch](./migration.md#checksummismatch), [MigrationHistoryRecord](./migration.md#migrationhistoryrecord).

## MigrationRunResult

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationRunResult } from '@nocobase/db'`.

Summary returned after applying migrations.

```ts
/** Summary returned after applying migrations. */
export interface MigrationRunResult {
  readonly batch: number;
  readonly executed: string[];
  readonly skipped: string[];
  /** Checksum drift the `warn` policy allowed the run to continue past. */
  readonly warnings: ChecksumMismatch[];
}
```

Related declarations: [ChecksumMismatch](./migration.md#checksummismatch).

## MigrationSource

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationSource } from '@nocobase/db'`.

Filesystem source containing migration definition modules.

```ts
/** Filesystem source containing migration definition modules. */
export interface MigrationSource {
  /** Runtime configuration for applicability; excluded from history identity. */
  readonly configuration?: readonly Readonly<Record<string, unknown>>[];
  /** Distinct parameter sets receive distinct migration history identities. */
  readonly parameters?: Readonly<Record<string, string>>;
  readonly packageName: string;
  readonly directory: string;
  readonly extensions?: readonly string[];
}
```

## MigrationTransactionMode

[Source](../../../src/migration/types.ts)

Import: `import type { MigrationTransactionMode } from '@nocobase/db'`.

Controls whether an individual migration runs in a database transaction.

```ts
/** Controls whether an individual migration runs in a database transaction. */
export type MigrationTransactionMode = true | false | 'auto';
```

## Migrator

[Source](../../../src/migration/migrator.ts)

Import: `import type { Migrator } from '@nocobase/db'`.

Executes and rolls back ordered migrations for one database connection.

```ts
/** Executes and rolls back ordered migrations for one database connection. */
export interface Migrator {
  /** Applies every pending migration. */
  latest(): Promise<MigrationRunResult>;
  /** Applies pending migrations through the named migration, inclusive. */
  upTo(name: string): Promise<MigrationRunResult>;
  /** Rolls back the most recently applied migration batch. */
  rollback(
    options?: MigrationRollbackOptions,
  ): Promise<MigrationRollbackResult>;
  /**
   * Rewrites recorded checksums to match the current sources, clearing drift
   * reported by a run. Executes no migration and changes no schema.
   */
  repair(options?: MigrationRepairOptions): Promise<MigrationRepairResult>;
  /**
   * Migrations already applied on the connection, oldest first. Reads only:
   * a connection without a history table yields an empty list rather than
   * getting one created.
   */
  history(): Promise<MigrationHistoryRecord[]>;
  /**
   * The lock as it stands, or undefined when no run holds it. Reads only, and
   * creates no table.
   */
  lock(): Promise<TaskLockState | undefined>;
  /**
   * Deletes the lock row so a later run can proceed. An expired lock — one
   * whose holder stopped sending heartbeats — is released; an active one needs
   * `force`, because releasing it lets a second run start beside the first.
   */
  unlock(options?: TaskLockReleaseOptions): Promise<TaskLockReleaseResult>;
}
```

Related declarations: [MigrationHistoryRecord](./migration.md#migrationhistoryrecord), [MigrationRepairOptions](./migration.md#migrationrepairoptions), [MigrationRepairResult](./migration.md#migrationrepairresult), [MigrationRollbackOptions](./migration.md#migrationrollbackoptions), [MigrationRollbackResult](./migration.md#migrationrollbackresult), [MigrationRunResult](./migration.md#migrationrunresult), [TaskLockReleaseOptions](./migration.md#tasklockreleaseoptions), [TaskLockReleaseResult](./migration.md#tasklockreleaseresult), [TaskLockState](./migration.md#tasklockstate).

## StaleTaskLockTakeover

[Source](../../../src/migration/internal/lock.ts)

Import: `import type { StaleTaskLockTakeover } from '@nocobase/db'`.

Why a lock was taken over, for a caller that reports it.

```ts
/** Why a lock was taken over, for a caller that reports it. */
export interface StaleTaskLockTakeover {
  readonly tableName: string;
  readonly lockedBy: string;
  readonly heartbeatAt: Date | undefined;
  readonly staleForMs: number;
}
```

## TASK_LOCK_EXPIRY_MS

[Source](../../../src/migration/internal/lock.ts)

Import: `import { TASK_LOCK_EXPIRY_MS } from '@nocobase/db'`.

How long a lock survives without a heartbeat before another run may take it over. A hard kill — SIGKILL, a container stopped, a machine lost — runs no cleanup, so the row would otherwise block every later run until someone deleted it by hand. Several missed beats are tolerated so a slow database does not hand the lock to a second run while the first is still working.

```ts
/**
 * How long a lock survives without a heartbeat before another run may take it
 * over. A hard kill — SIGKILL, a container stopped, a machine lost — runs no
 * cleanup, so the row would otherwise block every later run until someone
 * deleted it by hand. Several missed beats are tolerated so a slow database
 * does not hand the lock to a second run while the first is still working.
 */
export declare const TASK_LOCK_EXPIRY_MS = 30000;
```

## TASK_LOCK_HEARTBEAT_INTERVAL_MS

[Source](../../../src/migration/internal/lock.ts)

Import: `import { TASK_LOCK_HEARTBEAT_INTERVAL_MS } from '@nocobase/db'`.

How often a holder proves it is still alive.

```ts
/** How often a holder proves it is still alive. */
export declare const TASK_LOCK_HEARTBEAT_INTERVAL_MS = 5000;
```

## TaskLockBusyDetails

[Source](../../../src/migration/internal/lock.ts)

Import: `import type { TaskLockBusyDetails } from '@nocobase/db'`.

Who holds a lock that could not be taken, and how long acquiring waited for it.

```ts
/** Who holds a lock that could not be taken, and how long acquiring waited for it. */
export interface TaskLockBusyDetails extends TaskLockState {
  /** Whose lock it is, as messages name it: `Migration` or `Seed`. */
  readonly label: string;
  /** The connection the lock guards. */
  readonly connection: string;
  /** How long acquiring waited for the holder to release it before giving up. */
  readonly waitedMs: number;
  /**
   * Held by another task in this same process rather than by another run.
   * Releasing the row cannot help then: the holder is still running here.
   */
  readonly inProcess: boolean;
}
```

Related declarations: [TaskLockState](./migration.md#tasklockstate).

## TaskLockBusyError

[Source](../../../src/migration/internal/lock.ts)

Import: `import { TaskLockBusyError } from '@nocobase/db'`.

A task lock is held by another run, so the task did not start. Contention is ordinary: two starts race, or a deploy overlaps a manual run. The holder is named so a caller can decide whether to wait or, once someone has confirmed the holder is gone, release the lock: an expired one (see {@link TaskLockState.expired}) needs no force to release, a live one does.

```ts
export declare class TaskLockBusyError
  extends Error
  implements TaskLockBusyDetails
{
  readonly code: 'TASK_LOCK_BUSY';
  readonly label: string;
  readonly connection: string;
  readonly tableName: string;
  readonly lockedBy: string;
  readonly lockedAt: Date | undefined;
  readonly heartbeatAt: Date | undefined;
  readonly expired: boolean;
  readonly waitedMs: number;
  readonly inProcess: boolean;
  constructor(details: TaskLockBusyDetails, options?: ErrorOptions);
}
```

Related declarations: [TaskLockBusyDetails](./migration.md#tasklockbusydetails).

## TaskLockReleaseOptions

[Source](../../../src/migration/types.ts)

Import: `import type { TaskLockReleaseOptions } from '@nocobase/db'`.

Options accepted by Migrator.unlock().

```ts
/** Options accepted by Migrator.unlock(). */
export interface TaskLockReleaseOptions {
  /** Release a lock that is still sending heartbeats. */
  readonly force?: boolean;
}
```

## TaskLockReleaseResult

[Source](../../../src/migration/internal/lock.ts)

Import: `import type { TaskLockReleaseResult } from '@nocobase/db'`.

```ts
export interface TaskLockReleaseResult {
  readonly released: boolean;
  readonly lock: TaskLockState | undefined;
  /** `not-held` when there was nothing to release, `active` when it is alive. */
  readonly reason: 'not-held' | 'active' | undefined;
}
```

Related declarations: [TaskLockState](./migration.md#tasklockstate).

## TaskLockState

[Source](../../../src/migration/internal/lock.ts)

Import: `import type { TaskLockState } from '@nocobase/db'`.

A lock as it stands in the database, as reported to an operator.

```ts
/** A lock as it stands in the database, as reported to an operator. */
export interface TaskLockState {
  readonly tableName: string;
  readonly lockedBy: string;
  readonly lockedAt: Date | undefined;
  readonly heartbeatAt: Date | undefined;
  /** No heartbeat within {@link TASK_LOCK_EXPIRY_MS}: the holder is gone. */
  readonly expired: boolean;
}
```

## createMigrator

[Source](../../../src/migration/migrator.ts)

Import: `import { createMigrator } from '@nocobase/db'`.

Creates a migration runner backed by the supplied database manager.

```ts
/** Creates a migration runner backed by the supplied database manager. */
export declare function createMigrator(
  options: CreateMigratorOptions,
): Migrator;
```

Related declarations: [CreateMigratorOptions](./migration.md#createmigratoroptions), [Migrator](./migration.md#migrator).

## defineMigration

[Source](../../../src/migration/define.ts)

Import: `import { defineMigration } from '@nocobase/db'`.

Marks and returns a migration definition for discovery by the migration loader.

```ts
/** Marks and returns a migration definition for discovery by the migration loader. */
export declare function defineMigration<T extends MigrationDefinition>(
  definition: T,
): T;
```

Related declarations: [MigrationDefinition](./migration.md#migrationdefinition).

## isTaskLockBusyError

[Source](../../../src/migration/internal/lock.ts)

Import: `import { isTaskLockBusyError } from '@nocobase/db'`.

Whether `error` is a {@link TaskLockBusyError}, including one created by another copy of this package. The brand is a registered symbol rather than `instanceof`, which a duplicated installation would defeat.

```ts
/**
 * Whether `error` is a {@link TaskLockBusyError}, including one created by
 * another copy of this package. The brand is a registered symbol rather than
 * `instanceof`, which a duplicated installation would defeat.
 */
export declare function isTaskLockBusyError(
  error: unknown,
): error is TaskLockBusyError;
```

Related declarations: [TaskLockBusyError](./migration.md#tasklockbusyerror).

## loadMigrations

[Source](../../../src/migration/loader.ts)

Import: `import { loadMigrations } from '@nocobase/db'`.

Loads, validates, and deterministically orders migration definitions from configured sources.

```ts
/** Loads, validates, and deterministically orders migration definitions from configured sources. */
export declare function loadMigrations(
  options: LoadMigrationsOptions,
): Promise<LoadedMigration[]>;
```

Related declarations: [LoadMigrationsOptions](./migration.md#loadmigrationsoptions), [LoadedMigration](./migration.md#loadedmigration).

## validateMigrations

[Source](../../../src/migration/loader.ts)

Import: `import { validateMigrations } from '@nocobase/db'`.

Loads migration definitions without executing them.

```ts
/** Loads migration definitions without executing them. */
export declare function validateMigrations(
  options: string | LoadMigrationsOptions,
): Promise<LoadedMigration[]>;
```

Related declarations: [LoadMigrationsOptions](./migration.md#loadmigrationsoptions), [LoadedMigration](./migration.md#loadedmigration).
