import { createTaskServiceResolver } from './task-container.js';
import type { ServiceResolver } from '@nocobase/service-provider';
import { snapshotDatabaseTaskConfig } from './task-config.js';
import type { DatabaseTaskConfig } from '@nocobase/db';
import { existsSync } from 'node:fs';

import {
  createMigrator,
  loadMigrations,
  type ChecksumMismatch,
  type CreateMigratorOptions,
  type DatabaseManager,
  type MigrationRepairOptions,
  type MigrationRepairResult,
  type MigrationHistoryRecord,
  type MigrationSource,
  type MigrationRollbackOptions,
  type MigrationRollbackResult,
  type StaleTaskLockTakeover,
  type TaskLockReleaseOptions,
  type TaskLockReleaseResult,
  type MigrationRunResult,
} from '@nocobase/db';

import type { AppDatabaseMigrationConfig } from './types.js';

export interface AppMigrator {
  latest(): Promise<AppMigrationRunResult>;
  fresh(): Promise<AppMigrationRunResult>;
  /** What `latest()`, or `fresh()` with `fresh` set, would execute. Reads only. */
  pending(options?: AppPendingTasksOptions): Promise<AppPendingTasksResult>;
  rollback(
    options?: MigrationRollbackOptions,
  ): Promise<AppMigrationRollbackResult>;
  repair(options?: MigrationRepairOptions): Promise<AppMigrationRepairResult>;
  unlock(options?: TaskLockReleaseOptions): Promise<AppTaskLockReleaseResult>;
  /** The migration history, without creating its table. */
  history(): Promise<MigrationHistoryRecord[]>;
}

export interface AppPendingTasksOptions {
  /** Plan a fresh run: the schema is emptied first, so every task is pending. */
  readonly fresh?: boolean;
  /**
   * The database does not exist yet, so nothing has run and every task is
   * pending. No connection is opened to find out, because opening one to
   * missing storage creates it.
   */
  readonly withoutHistory?: boolean;
}

/**
 * What a run would execute, read without running anything, taking the lock or
 * writing history. It is a plan rather than a promise: a migration whose
 * `shouldRun()` would decline is still listed, because that is evaluated under
 * the lock against the database as the run finds it, and history the sources
 * cannot explain is reported by the run rather than here.
 */
export interface AppPendingTasksResult {
  status: 'completed' | 'skipped';
  reason?: 'missing-directory';
  /** Tasks with no history record, in the order a run would execute them. */
  pending?: string[];
  /** Tasks already recorded, which a run would skip. */
  skipped?: string[];
  dryRun?: true;
}

/** A lock release, or the reason it was left alone. */
export interface AppTaskLockReleaseResult extends TaskLockReleaseResult {
  status: 'completed';
}

export type AppMigrationSkippedReason = 'missing-directory';

export interface AppMigrationRunResult {
  status: 'completed' | 'skipped';
  reason?: AppMigrationSkippedReason;
  batch?: number;
  executed?: string[];
  skipped?: string[];
  warnings?: ChecksumMismatch[];
}

export interface AppMigrationRollbackResult {
  status: 'completed' | 'skipped';
  reason?: AppMigrationSkippedReason;
  batch?: number;
  rolledBack?: string[];
  /** The batch's history records, in the order they roll back. */
  records?: MigrationHistoryRecord[];
  warnings?: ChecksumMismatch[];
  dryRun?: boolean;
}

export interface AppMigrationRepairResult {
  status: 'completed' | 'skipped';
  reason?: AppMigrationSkippedReason;
  repaired?: ChecksumMismatch[];
  dryRun?: boolean;
}

export interface CreateAppMigratorOptions {
  runtimeConfig?: DatabaseTaskConfig;
  container?: ServiceResolver;
  database: DatabaseManager;
  config: AppDatabaseMigrationConfig;
  connection?: string;
  sources?: readonly MigrationSource[];
  /** Reported when a lock whose holder stopped beating is taken over. */
  onStaleLock?: (takeover: StaleTaskLockTakeover) => void;
}

export function createAppMigrator(
  options: CreateAppMigratorOptions,
): AppMigrator {
  return {
    async latest(): Promise<AppMigrationRunResult> {
      if (!hasMigrationDirectory(options)) {
        return skippedMigrationResult();
      }

      return completedRunResult(await createDatabaseMigrator(options).latest());
    },

    async fresh(): Promise<AppMigrationRunResult> {
      const connection = options.database.connection(options.connection);
      await connection.resetManagedSchema();
      if (!hasMigrationDirectory(options)) {
        return {
          status: 'completed',
          batch: 0,
          executed: [],
          skipped: [],
        };
      }
      return completedRunResult(await createDatabaseMigrator(options).latest());
    },

    async pending(
      pendingOptions: AppPendingTasksOptions = {},
    ): Promise<AppPendingTasksResult> {
      if (!hasMigrationDirectory(options)) {
        // `fresh()` empties the schema whether or not there is anything to
        // apply afterwards, so a fresh plan still has something to do.
        return pendingOptions.fresh
          ? { status: 'completed', pending: [], skipped: [], dryRun: true }
          : { status: 'skipped', reason: 'missing-directory' };
      }
      const migrations = await loadMigrations(
        createDatabaseMigratorOptions(options),
      );
      return pendingTasksResult(
        migrations,
        pendingOptions.fresh || pendingOptions.withoutHistory
          ? []
          : await createDatabaseMigrator(options).history(),
      );
    },

    async history(): Promise<MigrationHistoryRecord[]> {
      return createDatabaseMigrator(options).history();
    },

    async rollback(
      rollbackOptions?: MigrationRollbackOptions,
    ): Promise<AppMigrationRollbackResult> {
      if (!hasMigrationDirectory(options)) {
        return skippedMigrationResult();
      }

      return completedRollbackResult(
        await createDatabaseMigrator(options).rollback(rollbackOptions),
      );
    },

    // Unlocking needs no migration directory: the lock exists whether or not
    // this application owns migrations, because plugins and startup share it.
    async unlock(
      releaseOptions?: TaskLockReleaseOptions,
    ): Promise<AppTaskLockReleaseResult> {
      return {
        status: 'completed',
        ...(await createDatabaseMigrator(options).unlock(releaseOptions)),
      };
    },

    async repair(
      repairOptions?: MigrationRepairOptions,
    ): Promise<AppMigrationRepairResult> {
      if (!hasMigrationDirectory(options)) {
        return skippedMigrationResult();
      }

      return completedRepairResult(
        await createDatabaseMigrator(options).repair(repairOptions),
      );
    },
  };
}

function createDatabaseMigrator(options: CreateAppMigratorOptions) {
  return createMigrator(createDatabaseMigratorOptions(options));
}

function createDatabaseMigratorOptions(
  options: CreateAppMigratorOptions,
): CreateMigratorOptions {
  const common = {
    config: snapshotDatabaseTaskConfig(options.runtimeConfig),
    container: createTaskServiceResolver(options.container),
    database: options.database,
    connection: options.connection,
    tableName: options.config.tableName,
    lockTableName: options.config.lockTableName,
    extensions: options.config.extensions,
    onChecksumMismatch: options.config.onChecksumMismatch,
    onStaleLock: options.onStaleLock,
  };

  if (options.sources) {
    return {
      ...common,
      sources: options.sources,
    };
  }

  return {
    ...common,
    directory: options.config.directory,
    packageName: options.config.packageName,
  };
}

function hasMigrationDirectory(options: CreateAppMigratorOptions): boolean {
  if (options.sources) {
    return options.sources.some((source) => existsSync(source.directory));
  }

  return existsSync(options.config.directory);
}

function skippedMigrationResult(): AppMigrationRunResult &
  AppMigrationRollbackResult &
  AppMigrationRepairResult {
  return {
    status: 'skipped',
    reason: 'missing-directory',
  };
}

/** Splits loaded tasks into those a run would execute and those it would skip. */
export function pendingTasksResult(
  tasks: readonly { readonly name: string }[],
  history: readonly { readonly name: string }[],
): AppPendingTasksResult {
  const executed = new Set(history.map((record) => record.name));
  return {
    status: 'completed',
    pending: tasks
      .filter((task) => !executed.has(task.name))
      .map((task) => task.name),
    skipped: tasks
      .filter((task) => executed.has(task.name))
      .map((task) => task.name),
    dryRun: true,
  };
}

function completedRunResult(result: MigrationRunResult): AppMigrationRunResult {
  return {
    status: 'completed',
    batch: result.batch,
    executed: result.executed,
    skipped: result.skipped,
    warnings: result.warnings,
  };
}

function completedRollbackResult(
  result: MigrationRollbackResult,
): AppMigrationRollbackResult {
  return {
    status: 'completed',
    batch: result.batch,
    rolledBack: result.rolledBack,
    records: result.records,
    warnings: result.warnings,
    dryRun: result.dryRun,
  };
}

function completedRepairResult(
  result: MigrationRepairResult,
): AppMigrationRepairResult {
  return {
    status: 'completed',
    repaired: result.repaired,
    dryRun: result.dryRun,
  };
}
