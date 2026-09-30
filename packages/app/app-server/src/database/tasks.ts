import { createTaskServiceResolver } from './task-container.js';
import { loggingToken } from '../logging/token.js';
import type { ServiceResolver } from '@nocobase/service-provider';
import { snapshotDatabaseTaskConfig } from './task-config.js';
import type { DatabaseTaskConfig } from '@nocobase/db';
import { resolveDatabaseConfig } from './resolve-config.js';
import {
  planAppDatabaseTasks,
  type AppDatabaseTaskPlanOptions,
  type AppDatabaseTask,
  type AppDatabaseTaskKind,
} from './plan.js';
import {
  resolveDatabaseDriver,
  type ChecksumMismatch,
  type DatabaseDriverRegistration,
  type DatabaseManager,
  type MigrationHistoryRecord,
  type StaleTaskLockTakeover,
  type TaskLockState,
} from '@nocobase/db';

import type { AppPaths } from '../config/index.js';
import { createAppDatabaseManager } from './manager.js';
import { createAppMigrator, type AppMigrationRunResult } from './migrator.js';
import { createAppSeeder, type AppSeedRunResult } from './seeder.js';
import {
  appDatabaseStorageExists,
  prepareAppDatabaseStorage,
} from './storage.js';
import type { AppDatabaseConfig } from './types.js';

/**
 * `repair` realigns recorded checksums; it executes no migration or seed.
 * `rollback` runs the latest migration batch's `down`, and applies to
 * migrations alone: seeds have no inverse.
 */
export type AppDatabaseTaskOperation = 'run' | 'repair' | 'rollback' | 'unlock';

export interface AppDatabaseTaskResult {
  connection: string;
  kind: AppDatabaseTaskKind;
  status: 'completed' | 'skipped' | 'failed' | 'not-run';
  reason?: string;
  error?: string;
  batch?: number;
  executed?: string[];
  skipped?: string[];
  fresh?: boolean;
  /** Migrations a rollback undid, or that a dry run would undo. */
  rolledBack?: string[];
  /** The rolled back batch's history records, in the order they roll back. */
  records?: MigrationHistoryRecord[];
  /** The task lock as it stood when an unlock ran. */
  lock?: TaskLockState;
  /** Whether an unlock deleted the lock row, and why it did not. */
  released?: boolean;
  lockReason?: 'not-held' | 'active';
  /** Checksum drift tolerated by the `warn` policy during a run. */
  warnings?: ChecksumMismatch[];
  /** Records a repair rewrote, or that a dry run would rewrite. */
  repaired?: ChecksumMismatch[];
  /** Migrations or seeds a run would execute, as a dry run reports them. */
  pending?: string[];
  dryRun?: boolean;
}

export interface AppDatabaseTasksResult {
  ok: boolean;
  status: 'completed' | 'failed' | 'not-configured';
  results: AppDatabaseTaskResult[];
}

export class AppDatabaseTaskError extends Error {
  constructor(
    public readonly result: AppDatabaseTasksResult,
    cause: unknown,
  ) {
    const failed = result.results.find((entry) => entry.status === 'failed');
    super(
      `Database ${failed?.kind} failed for connection "${failed?.connection}": ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = 'AppDatabaseTaskError';
  }
}

export interface AppDatabasePlanExecutionOptions {
  readonly runtimeConfig?: DatabaseTaskConfig;
  readonly container?: ServiceResolver;
  readonly paths?: AppPaths;
  readonly drivers?: Record<string, DatabaseDriverRegistration>;
  readonly fresh?: boolean;
  /** Unlock only: release a lock that is still sending heartbeats. */
  readonly force?: boolean;
  readonly operation?: AppDatabaseTaskOperation;
  /**
   * Report what the operation would do without doing it. A run lists its
   * pending tasks, reading history without taking the lock; a rollback reports
   * the batch it would undo and a repair the records it would rewrite. Not
   * supported by unlock.
   */
  readonly dryRun?: boolean;
}

/** Manual commands and startup share the same resolved, connection-bound plan. */
export async function executeAppDatabasePlan(
  database: DatabaseManager,
  config: AppDatabaseConfig,
  plan: readonly AppDatabaseTask[],
  {
    paths,
    drivers,
    fresh = false,
    force = false,
    operation = 'run',
    dryRun = false,
    runtimeConfig,
    container,
  }: AppDatabasePlanExecutionOptions = {},
): Promise<AppDatabaseTasksResult> {
  if (fresh) {
    if (operation !== 'run')
      throw new Error(`A fresh run cannot be combined with ${operation}.`);
    assertFreshPlanOrder(plan);
  }
  if (operation === 'rollback' && plan.some((task) => task.kind === 'seeds')) {
    throw new Error('A rollback covers migrations only; seeds have no down.');
  }
  if (operation === 'unlock' && fresh) {
    throw new Error('A fresh run cannot be combined with unlock.');
  }
  if (operation === 'unlock' && dryRun) {
    throw new Error('An unlock has no dry run; it reports the lock it finds.');
  }
  const taskContainer = createTaskServiceResolver(container);
  const taskConfig = snapshotDatabaseTaskConfig(runtimeConfig);
  const result: AppDatabaseTasksResult = {
    ok: true,
    status: 'completed',
    results: [],
  };
  for (const [index, task] of plan.entries()) {
    const identity = { connection: task.connection, kind: task.kind };
    if (task.skipReason) {
      result.results.push({
        ...identity,
        status: 'skipped',
        reason: task.skipReason,
      });
      continue;
    }
    try {
      // A dry run changes nothing, and opening a connection to storage that
      // does not exist yet would create it: it answers for an empty database
      // instead, without preparing storage or connecting.
      const storageMissing =
        dryRun &&
        !(await appDatabaseStorageExists(
          config,
          paths,
          task.connection,
          drivers,
        ));
      if (!storageMissing) {
        await prepareAppDatabaseStorage(
          config,
          paths,
          [task.connection],
          drivers,
        );
      }
      const options = {
        runtimeConfig: taskConfig,
        container: taskContainer,
        database,
        connection: task.connection,
        config: task.config,
        sources: task.config.sources,
        onStaleLock: (takeover: StaleTaskLockTakeover): void =>
          reportStaleLock(container, task, takeover),
      };
      const completed =
        operation === 'unlock'
          ? await unlockTask(task, options, force)
          : storageMissing
            ? await emptyDatabasePreview(operation, task, options, fresh)
            : operation === 'repair'
              ? task.kind === 'migrations'
                ? await createAppMigrator(options).repair({ dryRun })
                : await createAppSeeder(options).repair({ dryRun })
              : operation === 'rollback'
                ? await createAppMigrator(options).rollback({ dryRun })
                : dryRun
                  ? task.kind === 'migrations'
                    ? await createAppMigrator(options).pending({ fresh })
                    : await createAppSeeder(options).pending({ fresh })
                  : task.kind === 'migrations'
                    ? await (fresh
                        ? createAppMigrator(options).fresh()
                        : createAppMigrator(options).latest())
                    : await createAppSeeder(options).run();
      result.results.push({
        ...identity,
        ...completed,
        ...(fresh ? { fresh: true } : {}),
      });
    } catch (error) {
      result.ok = false;
      result.status = 'failed';
      result.results.push({
        ...identity,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      result.results.push(
        ...plan.slice(index + 1).map((pending): AppDatabaseTaskResult => ({
          connection: pending.connection,
          kind: pending.kind,
          status: 'not-run',
          reason: 'previous-task-failed',
        })),
      );
      throw new AppDatabaseTaskError(result, error);
    }
  }
  return result;
}

/**
 * What a dry run reports for a database that does not exist yet: every task
 * pending, nothing to roll back, nothing to repair.
 */
async function emptyDatabasePreview(
  operation: Exclude<AppDatabaseTaskOperation, 'unlock'>,
  task: AppDatabaseTask,
  options: Parameters<typeof createAppMigrator>[0],
  fresh: boolean,
): Promise<Omit<AppDatabaseTaskResult, 'connection' | 'kind'>> {
  if (operation === 'rollback') {
    return {
      status: 'completed',
      batch: 0,
      rolledBack: [],
      records: [],
      dryRun: true,
    };
  }
  if (operation === 'repair') {
    return { status: 'completed', repaired: [], dryRun: true };
  }
  return task.kind === 'migrations'
    ? createAppMigrator(options).pending({ fresh, withoutHistory: true })
    : createAppSeeder(options).pending({ fresh, withoutHistory: true });
}

/** Releases whichever lock belongs to the task's kind. */
async function unlockTask(
  task: AppDatabaseTask,
  options: Parameters<typeof createAppMigrator>[0],
  force: boolean,
): Promise<
  Pick<AppDatabaseTaskResult, 'status' | 'lock' | 'released' | 'lockReason'>
> {
  const released =
    task.kind === 'migrations'
      ? await createAppMigrator(options).unlock({ force })
      : await createAppSeeder(options).unlock({ force });
  // `reason` on a task result says why it was skipped, so the lock's own
  // reason gets its own field rather than being read as a skip.
  return {
    status: 'completed',
    released: released.released,
    ...(released.lock ? { lock: released.lock } : {}),
    ...(released.reason ? { lockReason: released.reason } : {}),
  };
}

/**
 * A lock taken over because its holder stopped beating means a previous run
 * was killed. Nothing else records that, so it belongs in the application log.
 */
function reportStaleLock(
  container: ServiceResolver | undefined,
  task: AppDatabaseTask,
  takeover: StaleTaskLockTakeover,
): void {
  if (!container?.has(loggingToken)) return;
  container.resolve(loggingToken).getLogger('database').warn(
    {
      connection: task.connection,
      kind: task.kind,
      table: takeover.tableName,
      lockedBy: takeover.lockedBy,
      staleForMs: takeover.staleForMs,
    },
    `Took over the ${task.kind} lock "${takeover.tableName}" after its holder stopped responding; the run holding it did not shut down cleanly.`,
  );
}

/**
 * A fresh run drops a connection's managed schema inside its migrations task,
 * so every other task on that connection has to come after it. The planner
 * already orders tasks this way; the check guards hand-built plans, which
 * would otherwise seed a database that is about to be emptied.
 */
function assertFreshPlanOrder(plan: readonly AppDatabaseTask[]): void {
  const rebuilt = new Set<string>();
  for (const task of plan) {
    if (task.skipReason) continue;
    if (task.kind === 'migrations') {
      rebuilt.add(task.connection);
      continue;
    }
    if (!rebuilt.has(task.connection)) {
      throw new Error(
        `A fresh run must rebuild connection "${task.connection}" before its ${task.kind} run.`,
      );
    }
  }
  if (!rebuilt.size) {
    throw new Error('A fresh run must include migrations.');
  }
}

export interface AppDatabaseTaskRunOptions extends AppDatabaseTaskPlanOptions {
  /** The configuration reader migrations and seeds receive as `config`. */
  readonly runtimeConfig?: DatabaseTaskConfig;
  /** Borrow a database manager; its owner remains responsible for disposal. */
  readonly database?: () => DatabaseManager;
  readonly container?: ServiceResolver;
  /**
   * One task kind, or several planned together. Several kinds share one plan
   * so their order is the plan's, which is what lets `fresh` rebuild a
   * connection's schema before that connection's seeds run.
   */
  readonly kind: AppDatabaseTaskKind | readonly AppDatabaseTaskKind[];
  readonly operation?: AppDatabaseTaskOperation;
  /**
   * Report what the operation would do without doing it; see
   * {@link AppDatabasePlanExecutionOptions.dryRun}. A fresh dry run confirms
   * nothing, because it drops nothing.
   */
  readonly dryRun?: boolean;
  /** Unlock only: release a lock that is still sending heartbeats. */
  readonly force?: boolean;
}

export async function runAppDatabaseTasks(
  config: AppDatabaseConfig,
  options: AppDatabaseTaskRunOptions,
): Promise<AppDatabaseTasksResult> {
  const { paths, drivers } = options;
  const kinds = Array.isArray(options.kind)
    ? (options.kind as readonly AppDatabaseTaskKind[])
    : [options.kind as AppDatabaseTaskKind];
  if (options.fresh && !kinds.includes('migrations')) {
    throw new Error('A fresh run must include migrations.');
  }
  config = await resolveDatabaseConfig({
    ...config,
    drivers: { ...config.drivers, ...drivers },
  });
  const plan = planAppDatabaseTasks(config, kinds, options);
  if (!plan.length) return { ok: true, status: 'not-configured', results: [] };
  if (options.fresh) {
    for (const task of plan) {
      if (task.skipReason) continue;
      const connection = config.connections[task.connection];
      const driver = resolveDatabaseDriver(
        {
          dialect: connection.dialect,
          databaseDriver: connection.databaseDriver,
        },
        { ...config.drivers, ...drivers },
        task.connection,
      );
      if (!driver?.resetManagedSchema) {
        throw new Error(
          `Database driver for connection "${task.connection}" does not support managed schema reset.`,
        );
      }
    }
    if (
      !options.dryRun &&
      options.confirmFresh &&
      !(await options.confirmFresh(plan))
    ) {
      throw new Error('Fresh migration cancelled.');
    }
  }
  const database = options.database
    ? options.database()
    : createAppDatabaseManager(config, paths, {
        ...config.drivers,
        ...drivers,
      });
  if (!database) return { ok: true, status: 'not-configured', results: [] };
  try {
    return await executeAppDatabasePlan(database, config, plan, {
      paths,
      drivers,
      fresh: options.fresh,
      force: options.force,
      operation: options.operation,
      dryRun: options.dryRun,
      runtimeConfig: options.runtimeConfig,
      container: options.container,
    });
  } finally {
    if (!options.database) await database.destroy();
  }
}

export async function runAppMigrations(
  config: AppDatabaseConfig,
  options: Omit<AppDatabaseTaskRunOptions, 'kind'>,
): Promise<AppMigrationRunResult | undefined> {
  const result = await runAppDatabaseTasks(config, {
    ...options,
    kind: 'migrations',
  });
  const first = result.results[0];
  return (
    first && {
      status: first.status as AppMigrationRunResult['status'],
      reason: first.reason as AppMigrationRunResult['reason'],
      batch: first.batch,
      executed: first.executed,
      skipped: first.skipped,
    }
  );
}

export async function runAppSeeds(
  config: AppDatabaseConfig,
  options: Omit<AppDatabaseTaskRunOptions, 'kind'>,
): Promise<AppSeedRunResult | undefined> {
  const result = await runAppDatabaseTasks(config, {
    ...options,
    kind: 'seeds',
  });
  const first = result.results[0];
  return (
    first && {
      status: first.status as AppSeedRunResult['status'],
      reason: first.reason as AppSeedRunResult['reason'],
      executed: first.executed,
      skipped: first.skipped,
    }
  );
}
