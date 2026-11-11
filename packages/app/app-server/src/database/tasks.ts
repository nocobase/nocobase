import { databaseTaskHooksToken } from './task-hooks.js';
import { createTaskServiceResolver } from './task-container.js';
import { loggingToken } from '../logging/token.js';
import {
  createServiceToken,
  type ServiceToken,
  type ServiceResolver,
} from '@nocobase/service-provider';
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
import type {
  AppDatabaseConfig,
  AppDatabaseTaskContributions,
} from './types.js';

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

export interface AppDatabaseTasksResult {
  ok: boolean;
  status: 'completed' | 'failed' | 'not-configured';
  results: AppDatabaseTaskResult[];
}

/** The necessary preparation that stopped a plan before any business task ran. */
export interface AppDatabaseTaskPreparationFailure {
  readonly phase: 'storage' | 'reset' | 'beforeTasks' | 'installation';
  readonly connection?: string;
  readonly hook?: string;
}

export class AppDatabaseTaskError extends Error {
  /** Secondary owned-manager cleanup failure; preparation remains the primary error. */
  public cleanupError?: unknown;
  constructor(
    public readonly result: AppDatabaseTasksResult,
    cause: unknown,
    public readonly preparation:
      AppDatabaseTaskPreparationFailure | undefined = undefined,
    public readonly resetConnections: readonly string[] = [],
  ) {
    const failed = result.results.find((entry) => entry.status === 'failed');
    const location = preparation
      ? `Database preparation (${preparation.phase}) failed${preparation.hook ? ` in hook "${preparation.hook}"` : ''}${preparation.connection ? ` for connection "${preparation.connection}"` : ''}`
      : `Database ${failed?.kind} failed for connection "${failed?.connection}"`;
    const resets = resetConnections.length
      ? ` Connections already reset: ${resetConnections.map((name) => `"${name}"`).join(', ')}. These resets are not rolled back.`
      : '';
    const uncertain =
      preparation?.phase === 'reset'
        ? ` Connection "${preparation.connection}" may also have been partially modified.`
        : '';
    super(
      `${location}: ${cause instanceof Error ? cause.message : String(cause)}${resets}${uncertain}`,
      { cause },
    );
    this.name = 'AppDatabaseTaskError';
  }
}

export interface AppDatabasePlanExecutionOptions {
  /** Complete source inventory, including connections omitted by a CLI selection. */
  readonly contributions?: AppDatabaseTaskContributions;
  readonly taskFilter?: (task: {
    readonly name: string;
    readonly packageName: string;
  }) => boolean;
  /** Coordinators may enable sample seeds on a module's first installation. */
  readonly sample?: { readonly enabled: boolean };
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

export interface AppDatabaseTaskCoordinatorContext {
  readonly database: DatabaseManager;
  readonly config: AppDatabaseConfig;
  readonly plan: readonly AppDatabaseTask[];
  readonly options: AppDatabasePlanExecutionOptions;
  /** Executes the plan directly, without entering the coordinator again. */
  readonly execute: (
    overrides?: AppDatabasePlanExecutionOptions,
  ) => Promise<AppDatabaseTasksResult>;
}
export type AppDatabaseTaskCoordinator = (
  context: AppDatabaseTaskCoordinatorContext,
) => Promise<AppDatabaseTasksResult>;
export const databaseTaskCoordinatorToken: ServiceToken<AppDatabaseTaskCoordinator> =
  createServiceToken<AppDatabaseTaskCoordinator>(
    '@nocobase/app-server/database/task-coordinator',
  );

/** Manual commands and startup share the same resolved, connection-bound plan. */
export async function executeAppDatabasePlan(
  database: DatabaseManager,
  config: AppDatabaseConfig,
  plan: readonly AppDatabaseTask[],
  options: AppDatabasePlanExecutionOptions = {},
): Promise<AppDatabaseTasksResult> {
  const execute = (
    overrides: AppDatabasePlanExecutionOptions = {},
  ): Promise<AppDatabaseTasksResult> =>
    executeDatabasePlan(database, config, plan, { ...options, ...overrides });
  const coordinator = options.container?.has(databaseTaskCoordinatorToken)
    ? options.container.resolve(databaseTaskCoordinatorToken)
    : undefined;
  return coordinator
    ? coordinator({ database, config, plan, options, execute })
    : execute();
}

async function executeDatabasePlan(
  database: DatabaseManager,
  config: AppDatabaseConfig,
  plan: readonly AppDatabaseTask[],
  {
    taskFilter,
    sample,
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
  const targets = collectTaskTargets(config, plan, fresh, drivers);
  const taskContainer = createTaskServiceResolver(container);
  const taskConfig = snapshotDatabaseTaskConfig(runtimeConfig);
  const resetConnections: string[] = [];
  const hooks =
    !dryRun &&
    targets.length > 0 &&
    operation !== 'repair' &&
    operation !== 'unlock' &&
    container?.has(databaseTaskHooksToken)
      ? container.resolve(databaseTaskHooksToken).snapshot()
      : [];
  const result: AppDatabaseTasksResult = {
    ok: true,
    status: 'completed',
    results: [],
  };
  function preparationFailed(
    preparation: AppDatabaseTaskPreparationFailure,
    cause: unknown,
  ): never {
    result.ok = false;
    result.status = 'failed';
    result.results = plan.map((task) => unrunTask(task, 'preparation-failed'));
    throw new AppDatabaseTaskError(result, cause, preparation, [
      ...resetConnections,
    ]);
  }

  // Previewing never prepares storage, even when it already exists.
  if (!dryRun) {
    for (const connection of targets) {
      try {
        await prepareAppDatabaseStorage(config, paths, [connection], drivers);
      } catch (cause) {
        preparationFailed({ phase: 'storage', connection }, cause);
      }
    }
    if (fresh) {
      for (const connection of targets) {
        try {
          await database.connection(connection).resetManagedSchema();
          resetConnections.push(connection);
        } catch (cause) {
          preparationFailed({ phase: 'reset', connection }, cause);
        }
      }
    }
  }

  const hookContext = Object.freeze({
    resetConnections: Object.freeze([...resetConnections]),
  });
  for (const hook of hooks) {
    try {
      await hook.beforeTasks(hookContext);
    } catch (cause) {
      preparationFailed({ phase: 'beforeTasks', hook: hook.name }, cause);
    }
  }

  // Read installation history before any business migration or seed changes it.
  let freshInstalls = new Map<string, boolean>();
  if (operation === 'run' && !dryRun) {
    try {
      freshInstalls = await detectFreshInstalls(database, config, plan, {
        paths,
        drivers,
        fresh,
        runtimeConfig: taskConfig,
        container: taskContainer,
      });
    } catch (cause) {
      preparationFailed({ phase: 'installation' }, cause);
    }
  }
  const sampleData = taskConfig.get<unknown>('app.sampleData') === true;
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
      const options = {
        runtimeConfig: taskConfig,
        container: taskContainer,
        database,
        connection: task.connection,
        config: task.config,
        sources: task.config.sources,
        taskFilter,
        onStaleLock: (takeover: StaleTaskLockTakeover): void =>
          reportStaleLock(container, task, takeover),
      };
      const freshInstall = freshInstalls.get(task.connection);
      const completed =
        operation === 'unlock'
          ? await unlockTask(task, options, force)
          : operation === 'sample'
            ? await createAppSeeder(options).runSamples()
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
                      ? await runMigrations(options, fresh)
                      : await createAppSeeder({
                          ...options,
                          sample: {
                            enabled:
                              sample?.enabled ??
                              (freshInstall === true && sampleData),
                          },
                        }).run();
      result.results.push({
        ...identity,
        ...completed,
        ...(task.kind === 'seeds' &&
        freshInstall !== undefined &&
        completed.status === 'completed'
          ? { freshInstall }
          : {}),
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
        ...plan
          .slice(index + 1)
          .map((pending) => unrunTask(pending, 'previous-task-failed')),
      );
      throw new AppDatabaseTaskError(result, error, undefined, [
        ...resetConnections,
      ]);
    }
  }
  return result;
}

/** Only target data is collected here; execution stays in the phase functions. */
function collectTaskTargets(
  config: AppDatabaseConfig,
  plan: readonly AppDatabaseTask[],
  fresh: boolean,
  drivers?: Record<string, DatabaseDriverRegistration>,
): string[] {
  const targets = new Set<string>();
  const tasks = new Set<string>();
  for (const task of plan) {
    if (task.skipReason) continue;
    const connection = config.connections[task.connection];
    if (!connection)
      throw new Error(`Unknown database connection "${task.connection}".`);
    if (connection.schemaManagement === 'external') {
      throw new Error(
        `Database connection "${task.connection}" is external; migrations and seeds are not supported.`,
      );
    }
    const identity = `${task.connection}:${task.kind}`;
    if (tasks.has(identity))
      throw new Error(`Duplicate database task "${identity}".`);
    tasks.add(identity);
    targets.add(task.connection);
    if (fresh && task.kind === 'migrations') {
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
  }
  return [...targets];
}

function unrunTask(
  task: AppDatabaseTask,
  reason: string,
): AppDatabaseTaskResult {
  return {
    connection: task.connection,
    kind: task.kind,
    status: task.skipReason ? 'skipped' : 'not-run',
    reason: task.skipReason ?? reason,
  };
}

async function runMigrations(
  options: Parameters<typeof createAppMigrator>[0],
  fresh: boolean,
): Promise<AppMigrationRunResult> {
  const applied = await createAppMigrator(options).latest();
  if (!fresh) return applied;
  // Rebuilding an empty schema is completed work even without migration sources.
  return {
    status: 'completed',
    batch: applied.batch ?? 0,
    executed: applied.executed ?? [],
    skipped: applied.skipped ?? [],
    ...(applied.warnings ? { warnings: applied.warnings } : {}),
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
 * A fresh plan must include migrations for every executable connection, with
 * migrations before seeds. Validate hand-built plans before any storage write.
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
    collectTaskTargets(config, plan, true, drivers);
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
  let executionFailure: unknown;
  try {
    return await executeAppDatabasePlan(database, config, plan, {
      contributions: options.contributions,
      paths,
      drivers,
      fresh: options.fresh,
      force: options.force,
      operation: options.operation,
      dryRun: options.dryRun,
      runtimeConfig: options.runtimeConfig,
      container: options.container,
    });
  } catch (error) {
    executionFailure = error;
    throw error;
  } finally {
    if (!options.database)
      await destroyTaskDatabase(database, executionFailure);
  }
}

async function destroyTaskDatabase(
  database: DatabaseManager,
  executionFailure: unknown,
): Promise<void> {
  try {
    await database.destroy();
  } catch (cleanupError) {
    if (
      executionFailure instanceof AppDatabaseTaskError &&
      executionFailure.preparation
    ) {
      executionFailure.cleanupError = cleanupError;
    } else {
      throw cleanupError;
    }
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
