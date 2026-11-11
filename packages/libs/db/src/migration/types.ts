import type { ServiceResolver } from '@nocobase/service-provider';
import type { DatabaseTaskConfig } from '../task-config.js';
import type {
  ChecksumMismatch,
  ChecksumMismatchPolicy,
} from './checksum-history.js';
import type { CollectionBuilder } from '../collection/builder/builder.js';
import type { DatabaseConnection } from '../database/connection.js';
import type { DatabaseDialect, DatabaseDriver } from '../database/config.js';
import type { DatabaseCapabilities } from '../schema/adapter.js';
import type { QueryAdapter } from '../query/types.js';
import type { Repository, RepositoryRecord } from '../repository/types.js';

/** Controls whether an individual migration runs in a database transaction. */
export type MigrationTransactionMode = true | false | 'auto';

/** Restricted connection capabilities exposed to migration definitions. */
export interface MigrationConnection {
  readonly name: string;
  readonly driver: DatabaseDriver;
  readonly dialect: DatabaseDialect;
  readonly capabilities: DatabaseCapabilities;

  client<T = unknown>(): Promise<T>;
}

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

/** Selects either one migration directory or an ordered set of named sources. */
export interface LoadMigrationsOptions {
  readonly directory?: string;
  readonly packageName?: string;
  readonly extensions?: readonly string[];
  readonly sources?: readonly MigrationSource[];
}

/** Configuration for a standalone Migrator, including its database dependency. */
export interface CreateMigratorOptions extends LoadMigrationsOptions {
  /** Select pending tasks while retaining every source for history validation. */
  readonly taskFilter?: (task: {
    readonly name: string;
    readonly packageName: string;
  }) => boolean;
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

/** Configuration accepted by DatabaseManager.createMigrator(). */
export type DatabaseMigratorOptions = Omit<CreateMigratorOptions, 'database'>;

/** Summary returned after applying migrations. */
export interface MigrationRunResult {
  readonly batch: number;
  readonly executed: string[];
  readonly skipped: string[];
  /** Checksum drift the `warn` policy allowed the run to continue past. */
  readonly warnings: ChecksumMismatch[];
}

export type {
  StaleTaskLockTakeover,
  TaskLockBusyDetails,
  TaskLockReleaseResult,
  TaskLockState,
} from './internal/lock.js';
import type { StaleTaskLockTakeover } from './internal/lock.js';

/** Options accepted by Migrator.unlock(). */
export interface TaskLockReleaseOptions {
  /** Release a lock that is still sending heartbeats. */
  readonly force?: boolean;
}

/** Options accepted by Migrator.rollback(). */
export interface MigrationRollbackOptions {
  /** Report the batch that would roll back without running any `down`. */
  readonly dryRun?: boolean;
}

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

/** Options accepted by Migrator.repair(). */
export interface MigrationRepairOptions {
  /** Report what would be rewritten without writing anything. */
  readonly dryRun?: boolean;
}

/** Summary returned after realigning recorded migration checksums. */
export interface MigrationRepairResult {
  /** Records rewritten, or the records a dry run would rewrite. */
  readonly repaired: ChecksumMismatch[];
  readonly dryRun: boolean;
}

export interface MigrationHistoryRecord {
  readonly id: number;
  readonly packageName: string;
  readonly name: string;
  readonly batch: number;
  readonly checksum: string;
  readonly executedAt: Date | string;
  readonly durationMs: number | null;
}
