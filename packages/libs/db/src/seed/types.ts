import type { ServiceResolver } from '@nocobase/service-provider';
import type { DatabaseTaskConfig } from '../task-config.js';
import type { DatabaseConnection } from '../database/connection.js';
import type {
  ChecksumMismatch,
  ChecksumMismatchPolicy,
} from '../migration/checksum-history.js';
import type {
  MigrationConnection,
  StaleTaskLockTakeover,
} from '../migration/types.js';
import type { QueryAdapter } from '../query/types.js';
import type { Repository, RepositoryRecord } from '../repository/types.js';

/** Controls whether an individual seed runs in a database transaction. */
export type SeedTransactionMode = true | false | 'auto';

/** Restricted database connection exposed to seed definitions. */
export type SeedConnection = MigrationConnection;

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

/** Filesystem source containing seed definition modules. */
export interface SeedSource {
  readonly packageName: string;
  readonly directory: string;
  readonly extensions?: readonly string[];
}

/** Selects either one seed directory or an ordered set of named sources. */
export interface LoadSeedsOptions {
  readonly directory?: string;
  readonly packageName?: string;
  readonly extensions?: readonly string[];
  readonly sources?: readonly SeedSource[];
}

/** Whether pending sample seeds run, or are recorded as skipped. */
export interface SeedSampleOptions {
  readonly enabled: boolean;
}

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

/** Configuration accepted by DatabaseManager.createSeeder(). */
export type DatabaseSeederOptions = Omit<CreateSeederOptions, 'database'>;

/** Summary returned after executing pending seeds. */
export interface SeedRunResult {
  readonly executed: string[];
  readonly skipped: string[];
  /** Sample seeds recorded as skipped by this run, without running. */
  readonly skippedSamples: string[];
  /** Checksum drift the `warn` policy allowed the run to continue past. */
  readonly warnings: ChecksumMismatch[];
}

/** Options accepted by Seeder.repair(). */
export interface SeedRepairOptions {
  /** Report what would be rewritten without writing anything. */
  readonly dryRun?: boolean;
}

/** Summary returned after realigning recorded seed checksums. */
export interface SeedRepairResult {
  /** Records rewritten, or the records a dry run would rewrite. */
  readonly repaired: ChecksumMismatch[];
  readonly dryRun: boolean;
}

/** How a recorded seed ended: it ran, or sample data was recorded without running. */
export type SeedHistoryStatus = 'executed' | 'skipped';

export interface SeedHistoryRecord {
  readonly id: number;
  readonly packageName: string;
  readonly name: string;
  readonly checksum: string;
  readonly executedAt: Date | string;
  readonly durationMs: number | null;
  readonly status: SeedHistoryStatus;
}

/** Summary returned after running sample seeds that were skipped. */
export interface SeedSampleRunResult {
  readonly executed: string[];
}

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
