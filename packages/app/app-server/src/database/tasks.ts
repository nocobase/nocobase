import { databaseTaskHooksToken } from './task-hooks.js';
import { planDatabaseExecution } from './execution-plan.js';
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
 * migrations alone: seeds have no inverse. `sample` runs the sample seeds a
 * run recorded as skipped, and applies to seeds alone.
 */
export type AppDatabaseTaskOperation =
  'run' | 'repair' | 'rollback' | 'unlock' | 'sample';

export interface AppDatabaseTaskResult {
  connection: string;
  kind: AppDatabaseTaskKind;
  status: 'completed' | 'skipped' | 'failed' | 'not-run';
  reason?: string;
  error?: string;
  batch?: number;
  executed?: string[];
  skipped?: string[];
  /** Sample seeds a run recorded as skipped without running them. */
  skippedSamples?: string[];
  /**
   * Seeds only: whether this run installed the connection — it held no
   * migration or seed history before the run, or a fresh run rebuilt it. Sample
   * data loads only then, and only with `app.sampleData` set.
   */
  freshInstall?: boolean;
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

/** A failed execution step, independently of whether any business task ran. */
export interface AppDatabaseExecutionFailure {
  phase:
    | 'prepare-storage'
    | 'reset-schema'
    | 'before-tasks'
    | 'inspect-installs'
    | 'run-task';
  connection?: string;
  kind?: AppDatabaseTaskKind;
  hook?: string;
  error: string;
}

export interface AppDatabaseTasksResult {
  ok: boolean;
  status: 'completed' | 'failed' | 'not-configured';
  results: AppDatabaseTaskResult[];
  /** Present on execution failure; the original exception is the Error's cause. */
  failure?: AppDatabaseExecutionFailure;
  /** Successfully reset schemas, in execution order, including on failure. */
  resetConnections?: string[];
}

export class AppDatabaseTaskError extends Error {
  constructor(
    public readonly result: AppDatabaseTasksResult,
    cause: unknown,
  ) {
    const failed = result.results.find((entry) => entry.status === 'failed');
    const failure = result.failure;
    super(
      failure && failure.phase !== 'run-task'
        ? `Database ${failure.phase}${failure.hook ? ` hook "${failure.hook}"` : ''}${failure.connection ? ` for connection "${failure.connection}"` : ''} failed: ${failure.error}${result.resetConnections?.length ? `. Managed schemas already reset: ${result.resetConnections.join(', ')}; business rebuild is incomplete.` : ''}`
        : `Database ${failed?.kind} failed for connection "${failed?.connection}": ${cause instanceof Error ? cause.message : String(cause)}`,
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
  if (
    operation === 'sample' &&
    plan.some((task) => task.kind === 'migrations')
  ) {
    throw new Error('Sample data covers seeds only.');
  }
  if (operation === 'sample' && (dryRun || fresh)) {
    throw new Error('Sample data has no dry run or fresh run.');
  }
  if (operation === 'unlock' && fresh) {
    throw new Error('A fresh run cannot be combined with unlock.');
  }
  if (operation === 'unlock' && dryRun) {
    throw new Error('An unlock has no dry run; it reports the lock it finds.');
  }
  // Snapshot once: registrations added during execution apply to the next plan.
  const hooks =
    !dryRun &&
    (operation === 'run' || operation === 'rollback' || operation === 'sample')
      ? (container?.resolveIfCreated(databaseTaskHooksToken)?.registrations() ??
        [])
      : [];
  const steps = planDatabaseExecution(plan, {
    hooks,
    fresh,
    operation,
    dryRun,
  });
  const taskContainer = createTaskServiceResolver(container);
  const taskConfig = snapshotDatabaseTaskConfig(runtimeConfig);
  const sampleData = taskConfig.get<unknown>('app.sampleData') === true;
  let freshInstalls = new Map<string, boolean>();
  const outcomes = new Map<number, AppDatabaseTaskResult>();
  const resetConnections: string[] = [];
  let failure: AppDatabaseExecutionFailure | undefined;
  let cause: unknown;

  for (const step of steps) {
    try {
      switch (step.type) {
        case 'prepare-storage':
          await prepareAppDatabaseStorage(
            config,
            paths,
            [step.connection],
            drivers,
          );
          break;
        case 'reset-schema':
          await database.connection(step.connection).resetManagedSchema();
          resetConnections.push(step.connection);
          break;
        case 'before-tasks':
          await step.hook.beforeTasks(
            Object.freeze({
              resetConnections: Object.freeze([...resetConnections]),
            }),
          );
          break;
        case 'inspect-installs':
          // Read history before any business task can make a database look installed.
          freshInstalls = await detectFreshInstalls(database, config, plan, {
            paths,
            drivers,
            fresh,
            runtimeConfig: taskConfig,
            container: taskContainer,
          });
          break;
        case 'run-task': {
          const task = plan[step.index];
          const completed = await runDatabaseTask(task, {
            database,
            config,
            paths,
            drivers,
            operation,
            dryRun,
            fresh,
            force,
            runtimeConfig: taskConfig,
            container: taskContainer,
            onStaleLock: (takeover) =>
              reportStaleLock(container, task, takeover),
            freshInstall: freshInstalls.get(task.connection),
            sampleData,
          });
          outcomes.set(step.index, {
            connection: task.connection,
            kind: task.kind,
            ...completed,
            ...(fresh ? { fresh: true } : {}),
          });
          break;
        }
      }
    } catch (error) {
      cause = error;
      const task = 'index' in step ? plan[step.index] : undefined;
      failure = {
        phase: step.type,
        ...('connection' in step ? { connection: step.connection } : {}),
        ...(task ? { connection: task.connection, kind: task.kind } : {}),
        ...(step.type === 'before-tasks' ? { hook: step.hook.name } : {}),
        error: error instanceof Error ? error.message : String(error),
      };
      if (step.type === 'run-task') {
        outcomes.set(step.index, {
          connection: plan[step.index].connection,
          kind: plan[step.index].kind,
          status: 'failed',
          error: failure.error,
        });
      }
      break;
    }
  }
  const result = summarizeDatabaseExecution(
    plan,
    outcomes,
    resetConnections,
    failure,
  );
  if (failure) throw new AppDatabaseTaskError(result, cause);
  return result;
}

/** Project step outcomes once; a reset can succeed even when business rebuilding never starts. */
function summarizeDatabaseExecution(
  plan: readonly AppDatabaseTask[],
  outcomes: ReadonlyMap<number, AppDatabaseTaskResult>,
  resetConnections: string[],
  failure: AppDatabaseExecutionFailure | undefined,
): AppDatabaseTasksResult {
  return {
    ok: !failure,
    status: failure ? 'failed' : 'completed',
    ...(failure ? { failure } : {}),
    ...(resetConnections.length ? { resetConnections } : {}),
    results: plan.map((task, index): AppDatabaseTaskResult => {
      const identity = { connection: task.connection, kind: task.kind };
      if (task.skipReason)
        return { ...identity, status: 'skipped', reason: task.skipReason };
      const outcome = outcomes.get(index);
      if (!outcome)
        return {
          ...identity,
          status: 'not-run',
          reason:
            failure?.phase === 'run-task'
              ? 'previous-task-failed'
              : 'before-task-execution-failed',
        };
      // A successful reset with no migration source is still a completed empty rebuild.
      // Keep the source reason, so consumers can distinguish it from migrations running.
      if (
        task.kind === 'migrations' &&
        resetConnections.includes(task.connection) &&
        outcome.status === 'skipped' &&
        outcome.reason === 'missing-directory'
      ) {
        return {
          ...outcome,
          status: 'completed',
          batch: 0,
          executed: [],
          skipped: [],
        };
      }
      return outcome;
    }),
  };
}

/** Run business work only: storage preparation and schema reset belong to execution steps. */
async function runDatabaseTask(
  task: AppDatabaseTask,
  options: {
    database: DatabaseManager;
    config: AppDatabaseConfig;
    paths?: AppPaths;
    drivers?: Record<string, DatabaseDriverRegistration>;
    runtimeConfig: DatabaseTaskConfig;
    container: ServiceResolver;
    operation: AppDatabaseTaskOperation;
    dryRun: boolean;
    fresh: boolean;
    force: boolean;
    freshInstall?: boolean;
    sampleData: boolean;
    onStaleLock: (takeover: StaleTaskLockTakeover) => void;
  },
): Promise<Omit<AppDatabaseTaskResult, 'connection' | 'kind'>> {
  const { operation, dryRun, fresh, force, freshInstall, sampleData } = options;
  const common = {
    database: options.database,
    runtimeConfig: options.runtimeConfig,
    container: options.container,
    connection: task.connection,
    config: task.config,
    sources: task.config.sources,
    onStaleLock: options.onStaleLock,
  };
  // Opening missing storage could create it. Preview against empty history instead.
  const storageMissing =
    dryRun &&
    !(await appDatabaseStorageExists(
      options.config,
      options.paths,
      task.connection,
      options.drivers,
    ));
  const completed =
    operation === 'unlock'
      ? await unlockTask(task, common, force)
      : operation === 'sample'
        ? await createAppSeeder(common).runSamples()
        : storageMissing
          ? await emptyDatabasePreview(operation, task, common, fresh)
          : operation === 'repair'
            ? task.kind === 'migrations'
              ? await createAppMigrator(common).repair({ dryRun })
              : await createAppSeeder(common).repair({ dryRun })
            : operation === 'rollback'
              ? await createAppMigrator(common).rollback({ dryRun })
              : dryRun
                ? task.kind === 'migrations'
                  ? await createAppMigrator(common).pending({ fresh })
                  : await createAppSeeder(common).pending({ fresh })
                : task.kind === 'migrations'
                  ? await createAppMigrator(common).latest()
                  : await createAppSeeder({
                      ...common,
                      sample: { enabled: freshInstall === true && sampleData },
                    }).run();
  return {
    ...completed,
    ...(task.kind === 'seeds' &&
    freshInstall !== undefined &&
    completed.status === 'completed'
      ? { freshInstall }
      : {}),
  };
}

/**
 * Which connections this run installs: those with a seeds task whose storage
 * does not exist yet, or that hold neither seed history nor, when the plan
 * migrates them too, migration history. A fresh run installs every one. Reads
 * only, without creating a history table or the storage itself.
 */
async function detectFreshInstalls(
  database: DatabaseManager,
  config: AppDatabaseConfig,
  plan: readonly AppDatabaseTask[],
  options: {
    paths?: AppPaths;
    drivers?: Record<string, DatabaseDriverRegistration>;
    fresh: boolean;
    runtimeConfig: DatabaseTaskConfig;
    container: ServiceResolver;
  },
): Promise<Map<string, boolean>> {
  const installs = new Map<string, boolean>();
  for (const task of plan) {
    if (task.kind !== 'seeds' || task.skipReason) continue;
    if (options.fresh) {
      installs.set(task.connection, true);
      continue;
    }
    if (
      !(await appDatabaseStorageExists(
        config,
        options.paths,
        task.connection,
        options.drivers,
      ))
    ) {
      installs.set(task.connection, true);
      continue;
    }
    const common = {
      runtimeConfig: options.runtimeConfig,
      container: options.container,
      database,
      connection: task.connection,
    };
    const seeded = await createAppSeeder({
      ...common,
      config: task.config,
      sources: task.config.sources,
    }).history();
    const migrations = plan.find(
      (entry) =>
        entry.kind === 'migrations' &&
        entry.connection === task.connection &&
        !entry.skipReason,
    );
    const migrated = migrations
      ? await createAppMigrator({
          ...common,
          config: migrations.config,
          sources: migrations.config.sources,
        }).history()
      : [];
    installs.set(task.connection, seeded.length === 0 && migrated.length === 0);
  }
  return installs;
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
 * A fresh run resets a connection immediately before its migrations (or before hooks),
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
