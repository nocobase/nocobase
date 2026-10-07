import { createTaskServiceResolver } from './task-container.js';
import type { ServiceResolver } from '@nocobase/service-provider';
import { snapshotDatabaseTaskConfig } from './task-config.js';
import type { DatabaseTaskConfig } from '@nocobase/db';
import { existsSync } from 'node:fs';

import {
  createSeeder,
  loadSeeds,
  type ChecksumMismatch,
  type CreateSeederOptions,
  type DatabaseManager,
  type Seeder,
  type SeedHistoryEntry,
  type SeedHistoryRecord,
  type SeedRepairOptions,
  type SeedRepairResult,
  type SeedRunResult,
  type SeedSource,
  type StaleTaskLockTakeover,
  type TaskLockReleaseOptions,
} from '@nocobase/db';

import type { AppDatabaseSeedConfig } from './types.js';
import {
  pendingTasksResult,
  type AppPendingTasksOptions,
  type AppPendingTasksResult,
  type AppTaskLockReleaseResult,
} from './migrator.js';

export interface AppSeeder {
  run(): Promise<AppSeedRunResult>;
  /** Runs the sample seeds recorded as skipped; see `Seeder.runSamples()`. */
  runSamples(): Promise<AppSeedRunResult>;
  /** The seed history, without creating its table. */
  history(): Promise<SeedHistoryRecord[]>;
  /** Records an entry no seed file describes; see `Seeder.record()`. */
  record(entry: SeedHistoryEntry): Promise<void>;
  /** What `run()` would execute, after a fresh rebuild with `fresh` set. Reads only. */
  pending(options?: AppPendingTasksOptions): Promise<AppPendingTasksResult>;
  repair(options?: SeedRepairOptions): Promise<AppSeedRepairResult>;
  unlock(options?: TaskLockReleaseOptions): Promise<AppTaskLockReleaseResult>;
}

export type AppSeedSkippedReason = 'missing-directory';

export interface AppSeedRunResult {
  status: 'completed' | 'skipped';
  reason?: AppSeedSkippedReason;
  executed?: string[];
  skipped?: string[];
  /** Sample seeds recorded as skipped without running. */
  skippedSamples?: string[];
  warnings?: ChecksumMismatch[];
}

export interface AppSeedRepairResult {
  status: 'completed' | 'skipped';
  reason?: AppSeedSkippedReason;
  repaired?: ChecksumMismatch[];
  dryRun?: boolean;
}

export interface CreateAppSeederOptions {
  runtimeConfig?: DatabaseTaskConfig;
  container?: ServiceResolver;
  database: DatabaseManager;
  config: AppDatabaseSeedConfig;
  connection?: string;
  sources?: readonly SeedSource[];
  /** Reported when a lock whose holder stopped beating is taken over. */
  onStaleLock?: (takeover: StaleTaskLockTakeover) => void;
  /** Whether pending sample seeds run; recorded as skipped otherwise. */
  sample?: { readonly enabled: boolean };
}

export function createAppSeeder(options: CreateAppSeederOptions): AppSeeder {
  return {
    async run(): Promise<AppSeedRunResult> {
      if (!hasSeedDirectory(options)) {
        return {
          status: 'skipped',
          reason: 'missing-directory',
        };
      }

      return completedRunResult(await createDatabaseSeeder(options).run());
    },

    async runSamples(): Promise<AppSeedRunResult> {
      if (!hasSeedDirectory(options)) {
        return {
          status: 'skipped',
          reason: 'missing-directory',
        };
      }
      const { executed } = await createDatabaseSeeder(options).runSamples();
      return { status: 'completed', executed };
    },

    async history(): Promise<SeedHistoryRecord[]> {
      return createDatabaseSeeder(options).history();
    },

    async record(entry: SeedHistoryEntry): Promise<void> {
      await createDatabaseSeeder(options).record(entry);
    },

    async pending(
      pendingOptions: AppPendingTasksOptions = {},
    ): Promise<AppPendingTasksResult> {
      if (!hasSeedDirectory(options)) {
        return {
          status: 'skipped',
          reason: 'missing-directory',
        };
      }
      const seeds = await loadSeeds(createDatabaseSeederOptions(options));
      // A fresh run drops the seed history with the rest of the schema.
      return pendingTasksResult(
        seeds,
        pendingOptions.fresh || pendingOptions.withoutHistory
          ? []
          : await createDatabaseSeeder(options).history(),
      );
    },

    // Unlocking needs no seed directory: the lock is taken by whichever run
    // reached the connection, including one with only plugin seeds.
    async unlock(
      releaseOptions?: TaskLockReleaseOptions,
    ): Promise<AppTaskLockReleaseResult> {
      return {
        status: 'completed',
        ...(await createDatabaseSeeder(options).unlock(releaseOptions)),
      };
    },

    async repair(
      repairOptions?: SeedRepairOptions,
    ): Promise<AppSeedRepairResult> {
      if (!hasSeedDirectory(options)) {
        return {
          status: 'skipped',
          reason: 'missing-directory',
        };
      }

      return completedRepairResult(
        await createDatabaseSeeder(options).repair(repairOptions),
      );
    },
  };
}

function createDatabaseSeeder(options: CreateAppSeederOptions): Seeder {
  return createSeeder(createDatabaseSeederOptions(options));
}

function createDatabaseSeederOptions(
  options: CreateAppSeederOptions,
): CreateSeederOptions {
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
    ...(options.sample ? { sample: options.sample } : {}),
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

function hasSeedDirectory(options: CreateAppSeederOptions): boolean {
  if (options.sources) {
    return options.sources.some((source) => existsSync(source.directory));
  }

  return existsSync(options.config.directory);
}

function completedRunResult(result: SeedRunResult): AppSeedRunResult {
  return {
    status: 'completed',
    executed: result.executed,
    skipped: result.skipped,
    ...(result.skippedSamples.length > 0
      ? { skippedSamples: result.skippedSamples }
      : {}),
    warnings: result.warnings,
  };
}

function completedRepairResult(result: SeedRepairResult): AppSeedRepairResult {
  return {
    status: 'completed',
    repaired: result.repaired,
    dryRun: result.dryRun,
  };
}
