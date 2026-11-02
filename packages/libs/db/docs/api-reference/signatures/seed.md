# Seeds and sample data: signatures

Define and run installation seeds, record history and execute pending sample seeds. Seed contexts provide data access without a schema builder.

[Chapter](../migration-and-seed.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                     | Access               |
| ----------------------------------------------- | -------------------- |
| [CreateSeederOptions](#createseederoptions)     | `@nocobase/db` type  |
| [DatabaseSeederOptions](#databaseseederoptions) | `@nocobase/db` type  |
| [LoadSeedsOptions](#loadseedsoptions)           | Supporting contract  |
| [LoadedSeed](#loadedseed)                       | Supporting contract  |
| [SeedConnection](#seedconnection)               | Supporting contract  |
| [SeedContext](#seedcontext)                     | `@nocobase/db` type  |
| [SeedDefinition](#seeddefinition)               | `@nocobase/db` type  |
| [SeedHistoryEntry](#seedhistoryentry)           | `@nocobase/db` type  |
| [SeedHistoryRecord](#seedhistoryrecord)         | `@nocobase/db` type  |
| [SeedHistoryStatus](#seedhistorystatus)         | `@nocobase/db` type  |
| [SeedRepairOptions](#seedrepairoptions)         | `@nocobase/db` type  |
| [SeedRepairResult](#seedrepairresult)           | `@nocobase/db` type  |
| [SeedRunResult](#seedrunresult)                 | `@nocobase/db` type  |
| [SeedSampleOptions](#seedsampleoptions)         | `@nocobase/db` type  |
| [SeedSampleRunResult](#seedsamplerunresult)     | `@nocobase/db` type  |
| [SeedSource](#seedsource)                       | `@nocobase/db` type  |
| [SeedTransactionMode](#seedtransactionmode)     | `@nocobase/db` type  |
| [Seeder](#seeder)                               | `@nocobase/db` type  |
| [createSeeder](#createseeder)                   | `@nocobase/db` value |
| [defineSeed](#defineseed)                       | `@nocobase/db` value |
| [loadSeeds](#loadseeds)                         | `@nocobase/db` value |
| [validateSeeds](#validateseeds)                 | `@nocobase/db` value |

## CreateSeederOptions

[Source](../../../src/seed/types.ts)

Import: `import type { CreateSeederOptions } from '@nocobase/db'`.

Configuration for a standalone Seeder, including its database dependency.

```ts
/** Configuration for a standalone Seeder, including its database dependency. */
export interface CreateSeederOptions extends LoadSeedsOptions {
  /** Sample seeds are recorded as skipped unless this enables them. */
  readonly sample?: SeedSampleOptions;
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
  /** Called when a lock whose holder stopped sending heartbeats is taken over. */
  readonly onStaleLock?: (takeover: StaleTaskLockTakeover) => void;
  /**
   * How to react when an executed seed's source no longer hashes to the
   * checksum recorded for it. Defaults to `warn`.
   */
  readonly onChecksumMismatch?: ChecksumMismatchPolicy;
}
```

Related declarations: [ChecksumMismatchPolicy](./migration.md#checksummismatchpolicy), [DatabaseConnection](./connection.md#databaseconnection), [DatabaseTaskConfig](./migration.md#databasetaskconfig), [LoadSeedsOptions](./seed.md#loadseedsoptions), [SeedSampleOptions](./seed.md#seedsampleoptions), [StaleTaskLockTakeover](./migration.md#staletasklocktakeover).

## DatabaseSeederOptions

[Source](../../../src/seed/types.ts)

Import: `import type { DatabaseSeederOptions } from '@nocobase/db'`.

Configuration accepted by DatabaseManager.createSeeder().

```ts
/** Configuration accepted by DatabaseManager.createSeeder(). */
export type DatabaseSeederOptions = Omit<CreateSeederOptions, 'database'>;
```

Related declarations: [CreateSeederOptions](./seed.md#createseederoptions).

## LoadSeedsOptions

[Source](../../../src/seed/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

Selects either one seed directory or an ordered set of named sources.

```ts
/** Selects either one seed directory or an ordered set of named sources. */
export interface LoadSeedsOptions {
  readonly directory?: string;
  readonly packageName?: string;
  readonly extensions?: readonly string[];
  readonly sources?: readonly SeedSource[];
}
```

Related declarations: [SeedSource](./seed.md#seedsource).

## LoadedSeed

[Source](../../../src/seed/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface LoadedSeed {
  readonly packageName: string;
  readonly name: string;
  readonly filePath: string;
  readonly fileName: string;
  readonly checksum: string;
  /** Verified pre-manifest artifact hash used only to upgrade legacy history. */
  readonly legacyChecksum?: string;
  readonly seed: SeedDefinition;
}
```

Related declarations: [SeedDefinition](./seed.md#seeddefinition).

## SeedConnection

[Source](../../../src/seed/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

Restricted database connection exposed to seed definitions.

```ts
/** Restricted database connection exposed to seed definitions. */
export type SeedConnection = MigrationConnection;
```

Related declarations: [MigrationConnection](./migration.md#migrationconnection).

## SeedContext

[Source](../../../src/seed/types.ts)

Import: `import type { SeedContext } from '@nocobase/db'`.

Services available while executing a seed definition.

```ts
/** Services available while executing a seed definition. */
export interface SeedContext {
  readonly config: DatabaseTaskConfig;
  readonly container: ServiceResolver;
  /**
   * The default tool for installation data, bound to the connection this seed
   * runs on — the transaction's connection when it runs in one.
   *
   * Installation data is written in Collection terms: logical field names,
   * relations and nested writes, with field encoding and timestamps handled
   * for the dialect rather than by each seed.
   */
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
  ): Repository<TRecord, TCreate, TUpdate>;
  /**
   * Row-level access for what `repository` cannot express, such as a read
   * against a physical table that backs no Collection.
   */
  readonly query: QueryAdapter;
  readonly connection: SeedConnection;
}
```

Related declarations: [DatabaseTaskConfig](./migration.md#databasetaskconfig), [QueryAdapter](./query.md#queryadapter), [Repository](./repository.md#repository), [RepositoryRecord](./inputs.md#repositoryrecord), [SeedConnection](./seed.md#seedconnection).

## SeedDefinition

[Source](../../../src/seed/types.ts)

Import: `import type { SeedDefinition } from '@nocobase/db'`.

Named installation data operation loaded and executed by a Seeder.

```ts
/** Named installation data operation loaded and executed by a Seeder. */
export interface SeedDefinition {
  readonly name: string;
  readonly transaction?: SeedTransactionMode;
  /**
   * Sample data rather than data the application needs. It runs only when the
   * Seeder is told to load sample data, which an application does on a fresh
   * install with `app.sampleData` set; otherwise it is recorded as skipped and
   * never runs on its own, though `Seeder.runSamples()` may run it later.
   */
  readonly sample?: boolean;
  run(context: SeedContext): Promise<void>;
}
```

Related declarations: [SeedContext](./seed.md#seedcontext), [SeedTransactionMode](./seed.md#seedtransactionmode).

## SeedHistoryEntry

[Source](../../../src/seed/types.ts)

Import: `import type { SeedHistoryEntry } from '@nocobase/db'`.

An entry recorded in the seed history for work no seed file describes, such as sample data a service builds once the application is ready. Its name must not collide with a seed's.

```ts
/**
 * An entry recorded in the seed history for work no seed file describes, such
 * as sample data a service builds once the application is ready. Its name must
 * not collide with a seed's.
 */
export interface SeedHistoryEntry {
  readonly packageName: string;
  readonly name: string;
  readonly status: SeedHistoryStatus;
  readonly durationMs?: number | null;
}
```

Related declarations: [SeedHistoryStatus](./seed.md#seedhistorystatus).

## SeedHistoryRecord

[Source](../../../src/seed/types.ts)

Import: `import type { SeedHistoryRecord } from '@nocobase/db'`.

```ts
export interface SeedHistoryRecord {
  readonly id: number;
  readonly packageName: string;
  readonly name: string;
  readonly checksum: string;
  readonly executedAt: Date | string;
  readonly durationMs: number | null;
  readonly status: SeedHistoryStatus;
}
```

Related declarations: [SeedHistoryStatus](./seed.md#seedhistorystatus).

## SeedHistoryStatus

[Source](../../../src/seed/types.ts)

Import: `import type { SeedHistoryStatus } from '@nocobase/db'`.

How a recorded seed ended: it ran, or sample data was recorded without running.

```ts
/** How a recorded seed ended: it ran, or sample data was recorded without running. */
export type SeedHistoryStatus = 'executed' | 'skipped';
```

## SeedRepairOptions

[Source](../../../src/seed/types.ts)

Import: `import type { SeedRepairOptions } from '@nocobase/db'`.

Options accepted by Seeder.repair().

```ts
/** Options accepted by Seeder.repair(). */
export interface SeedRepairOptions {
  /** Report what would be rewritten without writing anything. */
  readonly dryRun?: boolean;
}
```

## SeedRepairResult

[Source](../../../src/seed/types.ts)

Import: `import type { SeedRepairResult } from '@nocobase/db'`.

Summary returned after realigning recorded seed checksums.

```ts
/** Summary returned after realigning recorded seed checksums. */
export interface SeedRepairResult {
  /** Records rewritten, or the records a dry run would rewrite. */
  readonly repaired: ChecksumMismatch[];
  readonly dryRun: boolean;
}
```

Related declarations: [ChecksumMismatch](./migration.md#checksummismatch).

## SeedRunResult

[Source](../../../src/seed/types.ts)

Import: `import type { SeedRunResult } from '@nocobase/db'`.

Summary returned after executing pending seeds.

```ts
/** Summary returned after executing pending seeds. */
export interface SeedRunResult {
  readonly executed: string[];
  readonly skipped: string[];
  /** Sample seeds recorded as skipped by this run, without running. */
  readonly skippedSamples: string[];
  /** Checksum drift the `warn` policy allowed the run to continue past. */
  readonly warnings: ChecksumMismatch[];
}
```

Related declarations: [ChecksumMismatch](./migration.md#checksummismatch).

## SeedSampleOptions

[Source](../../../src/seed/types.ts)

Import: `import type { SeedSampleOptions } from '@nocobase/db'`.

Whether pending sample seeds run, or are recorded as skipped.

```ts
/** Whether pending sample seeds run, or are recorded as skipped. */
export interface SeedSampleOptions {
  readonly enabled: boolean;
}
```

## SeedSampleRunResult

[Source](../../../src/seed/types.ts)

Import: `import type { SeedSampleRunResult } from '@nocobase/db'`.

Summary returned after running sample seeds that were skipped.

```ts
/** Summary returned after running sample seeds that were skipped. */
export interface SeedSampleRunResult {
  readonly executed: string[];
}
```

## SeedSource

[Source](../../../src/seed/types.ts)

Import: `import type { SeedSource } from '@nocobase/db'`.

Filesystem source containing seed definition modules.

```ts
/** Filesystem source containing seed definition modules. */
export interface SeedSource {
  readonly packageName: string;
  readonly directory: string;
  readonly extensions?: readonly string[];
}
```

## SeedTransactionMode

[Source](../../../src/seed/types.ts)

Import: `import type { SeedTransactionMode } from '@nocobase/db'`.

Controls whether an individual seed runs in a database transaction.

```ts
/** Controls whether an individual seed runs in a database transaction. */
export type SeedTransactionMode = true | false | 'auto';
```

## Seeder

[Source](../../../src/seed/seeder.ts)

Import: `import type { Seeder } from '@nocobase/db'`.

Executes pending seed definitions for one database connection.

```ts
/** Executes pending seed definitions for one database connection. */
export interface Seeder {
  /**
   * Executes every seed that has no matching history record. A sample seed
   * runs only when `sample.enabled` is set; otherwise it is recorded as
   * skipped, and a later run leaves it alone.
   */
  run(): Promise<SeedRunResult>;
  /**
   * Executes every sample seed recorded as skipped and records it as
   * executed. Seeds that never ran at all are left to `run()`.
   */
  runSamples(): Promise<SeedSampleRunResult>;
  /**
   * Records an entry no seed file describes, such as sample data a service
   * built, or rewrites the one with the same name. Executes nothing.
   */
  record(entry: SeedHistoryEntry): Promise<void>;
  /**
   * Rewrites recorded checksums to match the current sources, clearing drift
   * reported by a run. Executes no seed and changes no data.
   */
  repair(options?: SeedRepairOptions): Promise<SeedRepairResult>;
  /**
   * Seeds already executed on the connection, oldest first. Reads only: a
   * connection without a history table yields an empty list rather than
   * getting one created, and no lock is taken.
   */
  history(): Promise<SeedHistoryRecord[]>;
  /** The seed lock as it stands, or undefined when no run holds it. */
  lock(): Promise<TaskLockState | undefined>;
  /** Releases the seed lock; an active one needs `force`. */
  unlock(options?: TaskLockReleaseOptions): Promise<TaskLockReleaseResult>;
}
```

Related declarations: [SeedHistoryEntry](./seed.md#seedhistoryentry), [SeedHistoryRecord](./seed.md#seedhistoryrecord), [SeedRepairOptions](./seed.md#seedrepairoptions), [SeedRepairResult](./seed.md#seedrepairresult), [SeedRunResult](./seed.md#seedrunresult), [SeedSampleRunResult](./seed.md#seedsamplerunresult), [TaskLockReleaseOptions](./migration.md#tasklockreleaseoptions), [TaskLockReleaseResult](./migration.md#tasklockreleaseresult), [TaskLockState](./migration.md#tasklockstate).

## createSeeder

[Source](../../../src/seed/seeder.ts)

Import: `import { createSeeder } from '@nocobase/db'`.

Creates a seed runner backed by the supplied database manager.

```ts
/** Creates a seed runner backed by the supplied database manager. */
export declare function createSeeder(options: CreateSeederOptions): Seeder;
```

Related declarations: [CreateSeederOptions](./seed.md#createseederoptions), [Seeder](./seed.md#seeder).

## defineSeed

[Source](../../../src/seed/define.ts)

Import: `import { defineSeed } from '@nocobase/db'`.

Marks and returns a seed definition for discovery by the seed loader.

```ts
/** Marks and returns a seed definition for discovery by the seed loader. */
export declare function defineSeed<T extends SeedDefinition>(definition: T): T;
```

Related declarations: [SeedDefinition](./seed.md#seeddefinition).

## loadSeeds

[Source](../../../src/seed/loader.ts)

Import: `import { loadSeeds } from '@nocobase/db'`.

Loads, validates, and deterministically orders seed definitions from configured sources.

```ts
/** Loads, validates, and deterministically orders seed definitions from configured sources. */
export declare function loadSeeds(
  options: LoadSeedsOptions,
): Promise<LoadedSeed[]>;
```

Related declarations: [LoadSeedsOptions](./seed.md#loadseedsoptions), [LoadedSeed](./seed.md#loadedseed).

## validateSeeds

[Source](../../../src/seed/loader.ts)

Import: `import { validateSeeds } from '@nocobase/db'`.

Loads seed definitions without executing them.

```ts
/** Loads seed definitions without executing them. */
export declare function validateSeeds(
  options: string | LoadSeedsOptions,
): Promise<LoadedSeed[]>;
```

Related declarations: [LoadSeedsOptions](./seed.md#loadseedsoptions), [LoadedSeed](./seed.md#loadedseed).
