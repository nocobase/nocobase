import type { Application } from '@nocobase/app-server';
import {
  databaseManagerToken,
  isTaskLockBusyError,
  type ChecksumMismatch,
  type DatabaseManager,
  type MigrationHistoryRecord,
  type TaskLockBusyError,
} from '@nocobase/db';
import type { AppCommandContext } from './context.ts';
import {
  AppDatabaseTaskError,
  type AppDatabaseConfig,
  refreshAppCollectionsArtifact,
  runAppDatabaseTasks,
  type AppCollectionsRefreshResult,
  type AppDatabaseTaskKind,
  type AppDatabaseTaskResult,
  type AppDatabaseTasksResult,
} from '@nocobase/app-server/database';

import type { AppDatabaseTask } from '@nocobase/app-server/database';
import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { createInterface } from 'node:readline/promises';

import {
  CommandError,
  isCommandError,
  type CommandSuggestion,
} from './command/errors.ts';
import { nocobaseCommand } from './command/invocation.ts';
import { withAppInstance } from './command/lifecycle.ts';
import { applicationState } from './runtime/command-store.ts';

/** What the database commands print through: the `AppCommand` running them. */
interface DatabaseCommandOutput {
  /** Text for people; silent under `--json`. */
  log(message: string): void;
  /** Collected into the document's `warnings` under `--json`. */
  warn(message: string): unknown;
  /** Notes for whoever is watching, on stderr, also under `--json`. */
  logToStderr(message: string): void;
  /** Whether stdout carries the `--json` document, which moves a confirmation prompt to stderr. */
  jsonEnabled(): boolean;
}

interface DatabaseSelectionFlags {
  all: boolean;
  connection?: string;
  /**
   * Regenerate `database/<connection>/collections/` for every connection whose
   * migrations this run changed. Off unless a caller asks, so a programmatic
   * caller never writes files it did not expect; the commands pass their
   * `--collections` flag, which defaults to on.
   */
  collections?: boolean;
}

/** How one connection's Collection cache refresh went, after the migrations that made it stale. */
export type DatabaseCollectionsRefresh = AppCollectionsRefreshResult;

/** The `nocobase db` commands that change something, and so have a plan to preview. */
export type DatabasePlanCommand =
  'apply' | 'reset' | 'rollback' | 'redo' | 'repair';

/**
 * What one of those commands would do to one connection's migrations or seeds. `--dry-run` returns these as
 * `result.plan`, and a `FORCE_REQUIRED` refusal carries the same list as `error.details.plan`.
 */
export interface DatabasePlanEntry {
  readonly connection: string;
  readonly kind: AppDatabaseTaskKind;
  /**
   * - `apply`: runs `tasks`, which have not run yet.
   * - `reset`: deletes every managed schema object of the connection, history included, then runs `tasks` from empty.
   *   Only the migrations entry resets; the seeds entry after it is an `apply` of every seed.
   * - `rollback`: runs `down()` for `tasks`, newest first, and deletes their history.
   * - `repair`: rewrites the recorded checksums of `tasks` to match their sources. Runs nothing.
   * - `skip`: does nothing, for `reason`.
   */
  readonly action: 'apply' | 'reset' | 'rollback' | 'repair' | 'skip';
  /** Why a `skip` does nothing: `external`, `auto-run-disabled` or `missing-directory`. */
  readonly reason?: string;
  /** Migration or seed names, in the order the command would act on them; empty when there is nothing to do. */
  readonly tasks: readonly string[];
  /** `rollback` only: the batch `tasks` belong to, `0` when nothing has run. */
  readonly batch?: number;
}

/**
 * What a database command returns, which is `result` under `--json`. A run that fails throws a `CommandError` instead,
 * and its `details` carry the same `results`.
 */
export interface DatabaseCommandResult {
  /** `not-configured` when no database is configured, so nothing ran; absent otherwise. */
  readonly state?: 'not-configured';
  /** `true` for `--dry-run`: nothing was changed, and `plan` says what the command would do. */
  readonly dryRun?: true;
  /** What the command would do, one entry per connection and task kind; present exactly when `dryRun` is. */
  readonly plan?: readonly DatabasePlanEntry[];
  /** One entry per connection and task kind, in the order the plan ran them. */
  readonly results: readonly AppDatabaseTaskResult[];
  /** The Collection cache refreshes the run made; absent when none ran. */
  readonly collections?: readonly DatabaseCollectionsRefresh[];
  /** `db sample` only: the sample data services registered, as the run left them. */
  readonly sampleData?: DatabaseSampleDataResult;
}

/** What `db sample` did with the sample data services registered on `sampleDataToken`. */
export interface DatabaseSampleDataResult {
  /** Registration names that ran. */
  readonly executed: readonly string[];
  /** Registrations that threw, with the error message; each stays recorded as skipped. */
  readonly failed: readonly { readonly name: string; readonly error: string }[];
}

/** A run as the operation left it: failed or not, every entry is printed before the command settles. */
type DatabaseRun = AppDatabaseTasksResult & {
  collections?: DatabaseCollectionsRefresh[];
  /** The lock a task could not take, which the command reports as `DATABASE_LOCKED` rather than a task failure. */
  lockBusy?: TaskLockBusyError;
};

/**
 * Whether this run may write the Collection cache. A built `dist/` is a
 * deployment: the cache is for whoever develops the application, and nothing
 * there reads it, so a deployment's `db apply` leaves no files behind.
 */
export function collectionsRefreshAllowed(): boolean {
  try {
    return applicationState().location.kind !== 'deployment';
  } catch {
    // Not run through the CLI runner, as in a test that binds a command
    // directly: nothing says this is a deployment.
    return true;
  }
}

/**
 * Runs migrations and seeds as one plan, which is the same shape startup
 * executes. One plan is what makes `fresh` correct: a connection's schema is
 * rebuilt by its migrations task, and its seeds run after, against the
 * rebuilt schema.
 */
export async function runDatabaseApplyCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags & {
    fresh?: boolean;
    force?: boolean;
    dryRun?: boolean;
  },
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  const refuse = flags.fresh === true && !flags.force && !canPrompt();
  if (flags.dryRun || refuse) {
    // Read without running anything or taking a lock, so previewing a reset
    // is safe while another run is going.
    const preview = await executeWithApplication(
      command,
      { ...flags, collections: false },
      context,
      (app) =>
        runAppDatabaseTasks(app.config.get<AppDatabaseConfig>('database')!, {
          ...planOptions(app, flags),
          kind: ['migrations', 'seeds'],
          ...(flags.fresh ? { fresh: true } : {}),
          dryRun: true,
        }),
    );
    if (flags.dryRun) {
      return settleDryRun(command, preview, () =>
        planEntries(preview.results, 'apply'),
      );
    }
    // A preview that failed reports that failure: it would stop the reset too.
    throw forceRequired(
      'Reset requires --force in CI or a non-interactive terminal.',
      {
        command: 'reset',
        flags,
        plan: planEntries(settle(preview).results, 'apply'),
      },
    );
  }
  const result = await executeWithApplication(command, flags, context, (app) =>
    runAppDatabaseTasks(app.config.get<AppDatabaseConfig>('database')!, {
      ...planOptions(app, flags),
      kind: ['migrations', 'seeds'],
      ...(flags.fresh
        ? {
            fresh: true,
            confirmFresh: flags.force
              ? undefined
              : async (plan: readonly AppDatabaseTask[]) => {
                  if (!(await confirmFresh(command, plan))) {
                    throw cancelled('Fresh migration cancelled.');
                  }
                  return true;
                },
          }
        : {}),
    }),
  );

  if (!result.results.length) command.log('No database is configured.');
  for (const entry of result.results) {
    command.log(describeEntry(entry));
    if (entry.batch !== undefined) command.log(`Batch: ${entry.batch}`);
    if (entry.executed)
      command.log(`Executed: ${entry.executed.join(', ') || 'none'}`);
    if (entry.skipped)
      command.log(`Skipped: ${entry.skipped.join(', ') || 'none'}`);
    if (entry.fresh) command.log('Fresh: true');
    for (const warning of entry.warnings ?? [])
      command.log(
        `WARNING: checksum changed since it was executed: ${describe(warning)}`,
      );
    if (entry.warnings?.length) {
      // Which command depends on what the edit did, and repair is only ever
      // right for the first case: it records that the source and the schema
      // agree. Used on a change the database never received, it makes an
      // un-applied migration look applied.
      command.log(
        'If the edit left the schema identical — a reformat, a comment, a rebuild — run "nocobase db repair" to realign the history.',
      );
      command.log(
        'If it changed what the migration does, run "nocobase db redo" while its branch is unmerged, or add a new migration once it is merged.',
      );
    }
  }
  reportCollectionsRefresh(command, result);
  return settle(result);
}

/**
 * Rolls back the latest migration batch. The batch is the unit the history
 * records, so a batch that mixed application and plugin migrations rolls back
 * as one: the confirmation names every migration and the package it belongs
 * to rather than silently rolling back someone else's.
 */
export async function runDatabaseRollbackCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags & { force?: boolean; dryRun?: boolean },
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  const result = await executeWithApplication(
    command,
    flags.dryRun ? { ...flags, collections: false } : flags,
    context,
    async (app) => {
      const rollback = (dryRun: boolean): Promise<AppDatabaseTasksResult> =>
        runRollbackTasks(app, flags, dryRun);

      // Preview first, so every `down` about to run is on screen before one
      // does. Nothing is undone by the preview itself.
      const preview = await rollback(true);
      if (flags.dryRun || !rolledBackRecords(preview).length) return preview;
      if (!flags.force) {
        if (!canPrompt()) {
          throw forceRequired(
            'A rollback requires --force in CI or a non-interactive terminal.',
            {
              command: 'rollback',
              flags,
              plan: planEntries(preview.results, 'rollback'),
            },
          );
        }
        if (!(await confirmRollback(command, preview, 'rollback'))) {
          throw cancelled('Rollback cancelled.');
        }
      }
      return rollback(false);
    },
  );

  if (flags.dryRun) {
    return settleDryRun(command, result, () =>
      planEntries(result.results, 'rollback'),
    );
  }
  reportDatabaseEntries(command, result);
  reportCollectionsRefresh(command, result);
  return settle(result);
}

/**
 * Rolls the latest migration batch back and applies it again, which is what
 * correcting a migration before its branch is merged needs. Editing an
 * executed migration otherwise changes nothing: it is already recorded, so a
 * plain apply skips it.
 */
export async function runDatabaseRedoCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags & { force?: boolean; dryRun?: boolean },
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  let plan: DatabasePlanEntry[] = [];
  const result = await executeWithApplication(
    command,
    flags.dryRun ? { ...flags, collections: false } : flags,
    context,
    async (app): Promise<AppDatabaseTasksResult> => {
      const preview = await runRollbackTasks(app, flags, true);
      const rollsBack = rolledBackRecords(preview).length > 0;
      if (flags.dryRun || (rollsBack && !flags.force && !canPrompt())) {
        // A redo applies again only after rolling a batch back, so an empty
        // history plans nothing past the rollback.
        const applied = rollsBack
          ? await runAppDatabaseTasks(
              app.config.get<AppDatabaseConfig>('database')!,
              {
                ...planOptions(app, flags),
                kind: ['migrations', 'seeds'],
                dryRun: true,
              },
            )
          : undefined;
        plan = redoPlan(preview, applied);
        if (!flags.dryRun) {
          throw forceRequired(
            'A redo requires --force in CI or a non-interactive terminal.',
            { command: 'redo', flags, plan },
          );
        }
        return {
          ...preview,
          results: [...preview.results, ...(applied?.results ?? [])],
        };
      }
      if (!rollsBack) return preview;
      if (!flags.force && !(await confirmRollback(command, preview, 'redo'))) {
        throw cancelled('Redo cancelled.');
      }

      const rolledBack = await runRollbackTasks(app, flags, false);
      if (!rolledBack.ok) return rolledBack;
      const applied = await runAppDatabaseTasks(
        app.config.get<AppDatabaseConfig>('database')!,
        {
          ...planOptions(app, flags),
          kind: ['migrations', 'seeds'],
        },
      );
      return {
        ok: applied.ok,
        status: applied.ok ? ('completed' as const) : ('failed' as const),
        results: [...rolledBack.results, ...applied.results],
      };
    },
  );

  if (flags.dryRun) return settleDryRun(command, result, () => plan);
  reportDatabaseEntries(command, result);
  reportCollectionsRefresh(command, result);
  return settle(result);
}

/**
 * Loads the sample data an installation skipped: every sample seed recorded as skipped on the selected connections,
 * then — with the application started, so they can reach every plugin's services — the sample data services registered
 * on `sampleDataToken` that are recorded as skipped or not at all. For development only: a deployment refuses it.
 */
export async function runDatabaseSampleCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags,
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  if (!sampleDataAllowed()) {
    throw new CommandError(
      'Sample data is loaded only in a source checkout, never into a deployment.',
      { code: 'DEVELOPMENT_ONLY' },
    );
  }
  let sampleData: DatabaseSampleDataResult | undefined;
  const result = await executeWithApplication(
    command,
    { ...flags, collections: false },
    context,
    async (app) => {
      const seeded = await runAppDatabaseTasks(
        app.config.get<AppDatabaseConfig>('database')!,
        { ...planOptions(app, flags), kind: 'seeds', operation: 'sample' },
      );
      if (!seeded.ok) return seeded;
      // Started like a server, so the samples reach every plugin's services; it only listens when a server runs it.
      await app.start();
      if (app.container.has(sampleDataToken)) {
        const service = app.container.resolve(sampleDataToken);
        service.rerunSkipped();
        const built = await service.run();
        sampleData = {
          executed: built.executed,
          failed: built.failed.map((entry) => ({
            name: entry.name,
            error:
              entry.error instanceof Error
                ? entry.error.message
                : String(entry.error),
          })),
        };
      }
      return seeded;
    },
  );

  if (!result.results.length) command.log('No database is configured.');
  for (const entry of result.results) {
    command.log(describeEntry(entry));
    if (entry.status === 'completed')
      command.log(`Executed: ${entry.executed?.join(', ') || 'none'}`);
  }
  if (sampleData) {
    command.log(
      `Sample data services: ${sampleData.executed.join(', ') || 'none'}`,
    );
    for (const failure of sampleData.failed)
      command.warn(
        `Sample data "${failure.name}" could not be built: ${failure.error}`,
      );
  }
  const settled = settle(result);
  return sampleData ? { ...settled, sampleData } : settled;
}

function sampleDataAllowed(): boolean {
  try {
    return applicationState().location.kind !== 'deployment';
  } catch {
    // Not run through the CLI runner, as in a test that binds a command directly.
    return true;
  }
}

/**
 * Releases the migration and seed locks for the selected connections.
 *
 * A run that is killed leaves its lock row behind; it expires on its own once
 * its holder stops sending heartbeats, and a later run takes it over. This is
 * for the case where waiting is not wanted, and for reporting who holds one.
 */
export async function runDatabaseUnlockCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags & { force?: boolean },
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  const result = await executeWithApplication(command, flags, context, (app) =>
    runAppDatabaseTasks(app.config.get<AppDatabaseConfig>('database')!, {
      ...planOptions(app, flags),
      kind: ['migrations', 'seeds'],
      operation: 'unlock',
      force: flags.force,
    }),
  );

  if (!result.results.length) command.log('No database is configured.');
  for (const entry of result.results) {
    command.log(describeEntry(entry));
    if (entry.status !== 'completed') continue;
    if (entry.released) {
      command.log(`Released: ${describeLock(entry.lock)}`);
      continue;
    }
    if (entry.lockReason === 'active') {
      command.log(
        `Held: ${describeLock(entry.lock)}. A run is still sending heartbeats; pass --force to release it anyway, which lets a second run start beside it.`,
      );
      continue;
    }
    command.log('Not held.');
  }
  return settle(result);
}

function describeLock(lock: AppDatabaseTaskResult['lock']): string {
  if (!lock) return 'unknown';
  const since = lock.lockedAt ? ` since ${lock.lockedAt.toISOString()}` : '';
  const beat = lock.heartbeatAt
    ? `, last heartbeat ${lock.heartbeatAt.toISOString()}`
    : '';
  return `"${lock.lockedBy}"${since}${beat}`;
}

function runRollbackTasks(
  app: Application,
  flags: DatabaseSelectionFlags,
  dryRun: boolean,
): Promise<AppDatabaseTasksResult> {
  return runAppDatabaseTasks(app.config.get<AppDatabaseConfig>('database')!, {
    ...planOptions(app, flags),
    kind: 'migrations',
    operation: 'rollback',
    dryRun,
  });
}

/**
 * Realigns recorded checksums for both task kinds. Migrations and seeds drift
 * for the same reasons and are answered the same way, so one command covers
 * both rather than making an operator remember which halves drifted.
 */
export async function runDatabaseRepairCommand(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags & { dryRun?: boolean; force?: boolean },
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
): Promise<DatabaseCommandResult> {
  const kinds: readonly AppDatabaseTaskKind[] = ['migrations', 'seeds'];
  const result = await executeWithApplication(
    command,
    flags,
    context,
    async (app) => {
      const execute = async (
        dryRun: boolean,
      ): Promise<AppDatabaseTasksResult> => {
        const results: AppDatabaseTaskResult[] = [];
        let ok = true;
        for (const kind of kinds) {
          const outcome = await runAppDatabaseTasks(
            app.config.get<AppDatabaseConfig>('database')!,
            {
              ...planOptions(app, flags),
              kind,
              operation: 'repair',
              dryRun,
            },
          );
          results.push(...outcome.results);
          ok &&= outcome.ok;
        }
        return {
          ok,
          status: !results.length
            ? 'not-configured'
            : ok
              ? 'completed'
              : 'failed',
          results,
        };
      };

      // Preview first, so the operator sees every rewrite before one is
      // written. Each write is still conditioned on the checksum read here, so
      // a history that changes in between fails rather than repairing
      // something the preview never showed.
      const preview = await execute(true);
      if (flags.dryRun || !repairedRecords(preview).length) return preview;
      if (!flags.force) {
        if (!canPrompt()) {
          throw forceRequired(
            'Checksum repair requires --force in CI or a non-interactive terminal.',
            {
              command: 'repair',
              flags,
              plan: planEntries(preview.results, 'repair'),
            },
          );
        }
        if (!(await confirmRepair(command, preview))) {
          throw cancelled('Checksum repair cancelled.');
        }
      }
      return execute(false);
    },
  );

  if (!result.results.length) command.log('No database is configured.');
  for (const entry of result.results) {
    command.log(describeEntry(entry));
    if (entry.status !== 'completed') continue;
    const repaired = entry.repaired ?? [];
    command.log(
      `${entry.dryRun ? 'Would repair' : 'Repaired'}: ${repaired.length || 'none'}`,
    );
    for (const record of repaired) command.log(`  ${describe(record)}`);
  }
  const settled = settle(result);
  return flags.dryRun
    ? withPlan(settled, planEntries(settled.results, 'repair'))
    : settled;
}

function planOptions(
  app: Application,
  flags: DatabaseSelectionFlags,
): {
  paths: Application['paths'];
  runtimeConfig: Application['config'];
  container: Application['container'];
  contributions: Application['databaseTaskContributions'];
  database: () => DatabaseManager;
  all: boolean;
  connection?: string;
} {
  return {
    paths: app.paths,
    runtimeConfig: app.config,
    container: app.container,
    // Plugin migrations and seeds are resolved from the registered plugins,
    // never from config.yml, so they cannot be configured away.
    contributions: app.databaseTaskContributions,
    database: () => app.container.resolve(databaseManagerToken),
    all: flags.all,
    connection: flags.connection,
  };
}

/**
 * Creates the application, runs one database operation against it, refreshes
 * the Collection cache when asked, and disposes it. A task failure returns
 * its result, so every entry of the plan is printed before the command fails;
 * anything else is thrown as the command's failure.
 */
async function executeWithApplication(
  command: DatabaseCommandOutput,
  flags: DatabaseSelectionFlags,
  context: Pick<AppCommandContext, 'loadRuntime' | 'createApp'>,
  run: (app: Application) => Promise<AppDatabaseTasksResult>,
): Promise<DatabaseRun> {
  try {
    return await withAppInstance(
      context,
      async (app): Promise<DatabaseRun> => {
        app.registerProviders();
        const result = await run(app);
        if (!flags.collections) return result;
        // Before shutdown, on the manager the migrations just used: the cache
        // is read from the database state this run left behind.
        const collections = await refreshAppCollectionsArtifact(
          app.config.get<AppDatabaseConfig>('database')!,
          result,
          {
            paths: app.paths,
            database: app.container.resolve(databaseManagerToken),
          },
        );
        return collections ? { ...result, collections } : result;
      },
      // The tasks have run, or failed, by now: a failure to shut down reports
      // neither, and failing the command for it would invite a rerun that
      // rolls back a second batch.
      { onCleanupFailure: (error) => command.warn(error.message) },
    );
  } catch (error) {
    if (error instanceof AppDatabaseTaskError) {
      return isTaskLockBusyError(error.cause)
        ? { ...error.result, lockBusy: error.cause }
        : error.result;
    }
    throw toDatabaseCommandError(error, flags.connection);
  }
}

/**
 * The failure of a database or Collections command stopped by something other than one of its tasks: the runtime did
 * not load, the selection named an unknown connection, the application could not be created. A `CommandError` the
 * command threw on purpose — a refusal, a cancellation — keeps its own code.
 */
export function toDatabaseCommandError(
  error: unknown,
  connection: string | undefined,
): Error {
  if (isCommandError(error)) return error;
  // A failure whose cleanup also failed: `describeCommandError` reports the cause's code.
  if (error instanceof AggregateError && isCommandError(error.cause))
    return error;
  if (isTaskLockBusyError(error)) return databaseLocked(error);
  return new CommandError(
    error instanceof Error ? error.message : String(error),
    {
      code: 'DATABASE_COMMAND_FAILED',
      ...(connection === undefined ? {} : { details: { connection } }),
      cause: error,
    },
  );
}

/** Connection names the way a message lists them: `"main", "analytics"`. */
export function quoteConnections(names: readonly string[]): string {
  return names.map((name) => `"${name}"`).join(', ');
}

/** A sentence naming the connections that failed, ending with the error when only one did. */
export function connectionFailureMessage(
  prefix: string,
  entries: readonly { readonly connection: string; readonly error?: string }[],
): string {
  const [only] = entries;
  if (entries.length === 1 && only?.error) {
    return `${prefix} "${only.connection}": ${only.error}`;
  }
  return `${prefix} ${quoteConnections(entries.map((entry) => entry.connection))}.`;
}

/** The selection flags to repeat in a suggested command, so it acts on the same connections. */
export function selectionArgs(flags: {
  readonly all: boolean;
  readonly connection?: string;
}): string[] {
  if (flags.all) return ['--all'];
  return flags.connection === undefined
    ? []
    : ['--connection', flags.connection];
}

/** What `run()` returns for a run that succeeded, or the failure it ends in once its entries are printed. */
function settle(result: DatabaseRun): DatabaseCommandResult {
  const collections = result.collections
    ? { collections: result.collections }
    : {};
  if (!result.ok) {
    const failed = result.results.find((entry) => entry.status === 'failed');
    if (result.lockBusy) {
      throw databaseLocked(result.lockBusy, {
        ...(failed ? { failed } : {}),
        results: result.results,
        ...collections,
      });
    }
    throw new CommandError(
      failed
        ? `Database ${failed.kind} failed for connection "${failed.connection}": ${failed.error ?? 'unknown error'}`
        : 'A database task failed.',
      {
        code: 'DATABASE_TASK_FAILED',
        details: {
          ...(failed
            ? { connection: failed.connection, kind: failed.kind }
            : {}),
          results: result.results,
          ...collections,
        },
      },
    );
  }
  return {
    ...(result.status === 'not-configured'
      ? { state: 'not-configured' as const }
      : {}),
    results: result.results,
    ...collections,
  };
}

/**
 * Whether a run that succeeded changed nothing: no task executed, rolled back, reset, repaired or released anything.
 * The commands answer `success-noop` for it, as they do for a dry run, so a caller rerunning one to confirm the database
 * is current can tell that it was.
 */
export function databaseRunChangedNothing(
  result: DatabaseCommandResult,
): boolean {
  if (result.dryRun === true || result.state === 'not-configured') return true;
  return result.results.every(
    (entry) =>
      entry.fresh !== true &&
      entry.released !== true &&
      !entry.executed?.length &&
      !entry.rolledBack?.length &&
      (entry.dryRun === true || !entry.repaired?.length),
  );
}

function reportCollectionsRefresh(
  command: DatabaseCommandOutput,
  result: DatabaseRun,
): void {
  for (const entry of result.collections ?? []) {
    if (entry.status === 'failed') {
      command.warn(
        `Could not refresh the Collection cache of "${entry.connection}": ${entry.error}. The migrations are applied; run "nocobase collections generate --connection ${entry.connection}" to rebuild it.`,
      );
      continue;
    }
    const written = entry.written?.length ?? 0;
    const deleted = entry.deleted?.length ?? 0;
    command.log(
      `[${entry.connection}] collections: ${written || deleted ? `refreshed (${written} written, ${deleted} deleted)` : 'up to date'}`,
    );
  }
}

/** Every drifted record across the plan, flattened for counting and display. */
function repairedRecords(result: AppDatabaseTasksResult): {
  connection: string;
  kind: AppDatabaseTaskKind;
  record: ChecksumMismatch;
}[] {
  return result.results.flatMap((entry: AppDatabaseTaskResult) =>
    (entry.repaired ?? []).map((record) => ({
      connection: entry.connection,
      kind: entry.kind,
      record,
    })),
  );
}

function describe(record: ChecksumMismatch): string {
  return `${record.name} (${record.packageName}): ${record.recordedChecksum.slice(0, 12)} -> ${record.sourceChecksum.slice(0, 12)}`;
}

/** Every history record the rollback covers, flattened for display. */
function rolledBackRecords(result: AppDatabaseTasksResult): {
  connection: string;
  record: MigrationHistoryRecord;
}[] {
  return result.results.flatMap((entry: AppDatabaseTaskResult) =>
    (entry.records ?? []).map((record) => ({
      connection: entry.connection,
      record,
    })),
  );
}

/** Prints whichever of a task result's fields the operation produced. */
function reportDatabaseEntries(
  command: DatabaseCommandOutput,
  result: AppDatabaseTasksResult,
): void {
  if (!result.results.length) {
    command.log('No database is configured.');
    return;
  }

  for (const entry of result.results) {
    command.log(describeEntry(entry));
    if (entry.status !== 'completed') continue;
    if (entry.dryRun) {
      command.log('Nothing to roll back.');
      continue;
    }
    if (entry.batch !== undefined) command.log(`Batch: ${entry.batch}`);
    if (entry.rolledBack)
      command.log(`Rolled back: ${entry.rolledBack.join(', ') || 'none'}`);
    if (entry.executed)
      command.log(`Executed: ${entry.executed.join(', ') || 'none'}`);
    if (entry.skipped)
      command.log(`Skipped: ${entry.skipped.join(', ') || 'none'}`);
    for (const warning of entry.warnings ?? [])
      command.log(
        `WARNING: checksum changed since it was executed: ${describe(warning)}`,
      );
  }
}

/** Whether a person is there to answer a confirmation. */
function canPrompt(): boolean {
  return (
    !process.env.CI &&
    process.stdin.isTTY === true &&
    process.stdout.isTTY === true
  );
}

/**
 * A destructive operation where nobody can confirm it: invalid usage unless --force says so up front. The refusal
 * carries the plan a confirmation would have shown, so whoever reads it can put that plan to a person first.
 */
function forceRequired(
  message: string,
  refusal: {
    readonly command: DatabasePlanCommand;
    readonly flags: DatabaseSelectionFlags;
    readonly plan: readonly DatabasePlanEntry[];
  },
): CommandError {
  const args = ['db', refusal.command, ...selectionArgs(refusal.flags)];
  return new CommandError(message, {
    code: 'FORCE_REQUIRED',
    exit: 2,
    suggestions: [
      {
        message:
          'Show the user this plan and rerun with --force only if they confirm.',
        run: nocobaseCommand([...args, '--force']),
      },
      {
        message: 'Preview the plan without changing anything:',
        run: nocobaseCommand([...args, '--dry-run', '--json']),
      },
    ],
    details: { plan: refusal.plan },
  });
}

/**
 * A task could not take its lock because another run holds it. That is contention rather than a broken task, so it
 * gets its own code and names the holder; the lock is released only once someone confirms the holder is gone, and a
 * holder still sending heartbeats needs `--force` to release, which `db unlock` would otherwise refuse.
 */
function databaseLocked(
  lock: TaskLockBusyError,
  run: {
    readonly failed?: AppDatabaseTaskResult;
    readonly results?: readonly AppDatabaseTaskResult[];
    readonly collections?: readonly DatabaseCollectionsRefresh[];
  } = {},
): CommandError {
  const { failed } = run;
  const connection = failed?.connection ?? lock.connection;
  const suggestions: (string | CommandSuggestion)[] = [
    'Another run holds the lock. Wait for it to finish, then run this command again.',
  ];
  // A lock this process holds is released by the task holding it, not by `db unlock` from another process.
  if (!lock.inProcess) {
    suggestions.push({
      message: lock.expired
        ? 'If the user confirms the other run is gone, release its lock:'
        : 'If the user confirms the other run is gone, release its lock. It was still sending heartbeats, so this needs --force:',
      run: nocobaseCommand([
        'db',
        'unlock',
        '--connection',
        connection,
        ...(lock.expired ? [] : ['--force']),
      ]),
    });
  }
  return new CommandError(
    failed
      ? `Database ${failed.kind} failed for connection "${connection}": ${lock.message}`
      : lock.message,
    {
      code: 'DATABASE_LOCKED',
      suggestions,
      details: {
        connection,
        ...(failed ? { kind: failed.kind } : {}),
        table: lock.tableName,
        lockedBy: lock.lockedBy,
        ...(lock.lockedAt ? { lockedAt: lock.lockedAt.toISOString() } : {}),
        ...(lock.heartbeatAt
          ? { heartbeatAt: lock.heartbeatAt.toISOString() }
          : {}),
        expired: lock.expired,
        waitedMs: lock.waitedMs,
        inProcess: lock.inProcess,
        ...(run.results ? { results: run.results } : {}),
        ...(run.collections ? { collections: run.collections } : {}),
      },
      cause: lock,
    },
  );
}

/** The plan entries a dry run's task results describe, for an operation that previews as `action`. */
function planEntries(
  results: readonly AppDatabaseTaskResult[],
  action: 'apply' | 'rollback' | 'repair',
): DatabasePlanEntry[] {
  return results.map((entry): DatabasePlanEntry => {
    const identity = { connection: entry.connection, kind: entry.kind };
    if (entry.status === 'skipped') {
      return {
        ...identity,
        action: 'skip',
        ...(entry.reason ? { reason: entry.reason } : {}),
        tasks: [],
      };
    }
    if (action === 'rollback') {
      return {
        ...identity,
        action,
        tasks: entry.rolledBack ?? [],
        batch: entry.batch ?? 0,
      };
    }
    if (action === 'repair') {
      return {
        ...identity,
        action,
        tasks: (entry.repaired ?? []).map((record) => record.name),
      };
    }
    return {
      ...identity,
      action: entry.fresh && entry.kind === 'migrations' ? 'reset' : 'apply',
      tasks: entry.pending ?? [],
    };
  });
}

/**
 * A redo's plan: the rollback, then the apply that follows it. The apply runs the rolled back migrations again with
 * whatever else is pending, which a preview taken before the rollback cannot list, so they are merged in here — in the
 * order the loader runs migrations, which is by name.
 */
function redoPlan(
  rollback: AppDatabaseTasksResult,
  apply: AppDatabaseTasksResult | undefined,
): DatabasePlanEntry[] {
  const plan = planEntries(rollback.results, 'rollback');
  if (!apply) return plan;
  const again = new Map(
    rollback.results.map((entry) => [entry.connection, entry.rolledBack ?? []]),
  );
  return [
    ...plan,
    ...planEntries(apply.results, 'apply').map((entry) =>
      entry.action === 'apply' && entry.kind === 'migrations'
        ? {
            ...entry,
            tasks: [
              ...new Set([
                ...entry.tasks,
                ...(again.get(entry.connection) ?? []),
              ]),
            ].sort((a, b) => a.localeCompare(b)),
          }
        : entry,
    ),
  ];
}

/** A settled result marked as a dry run, carrying `plan`. */
function withPlan(
  result: DatabaseCommandResult,
  plan: readonly DatabasePlanEntry[],
): DatabaseCommandResult {
  return {
    ...(result.state ? { state: result.state } : {}),
    dryRun: true,
    plan,
    results: result.results,
  };
}

/**
 * What a `--dry-run` returns once its preview is printed. A preview that failed prints its entries and fails the way
 * the run would, because a plan built from it would describe something that cannot happen.
 */
function settleDryRun(
  command: DatabaseCommandOutput,
  preview: DatabaseRun,
  plan: () => readonly DatabasePlanEntry[],
): DatabaseCommandResult {
  if (!preview.ok) {
    for (const entry of preview.results) command.log(describeEntry(entry));
  }
  const settled = settle(preview);
  const entries = plan();
  if (!entries.length) {
    command.log('No database is configured.');
    return withPlan(settled, entries);
  }
  for (const entry of entries)
    command.log(
      `[${entry.connection}] ${entry.kind}: ${describePlanEntry(entry)}`,
    );
  command.log('Dry run: nothing was changed.');
  return withPlan(settled, entries);
}

function describePlanEntry(entry: DatabasePlanEntry): string {
  const tasks = entry.tasks.join(', ');
  switch (entry.action) {
    case 'skip':
      return `skipped${entry.reason ? ` (${entry.reason})` : ''}`;
    case 'reset':
      return `would delete all managed schema objects, then apply ${tasks || 'no migrations'}`;
    case 'rollback':
      return tasks
        ? `would roll back batch ${String(entry.batch ?? 0)}: ${tasks}`
        : 'nothing to roll back';
    case 'repair':
      return tasks ? `would repair ${tasks}` : 'nothing to repair';
    case 'apply':
      return tasks ? `would apply ${tasks}` : 'nothing to apply';
  }
}

/** The status line every database command prints for a task result. */
function describeEntry(entry: AppDatabaseTaskResult): string {
  return `[${entry.connection}] ${entry.kind}: ${entry.status}${entry.reason ? ` (${entry.reason})` : ''}${entry.error ? `: ${entry.error}` : ''}`;
}

/** The person at the terminal declined the confirmation. */
function cancelled(message: string): CommandError {
  return new CommandError(message, { code: 'CANCELLED' });
}

async function confirmRollback(
  command: DatabaseCommandOutput,
  preview: AppDatabaseTasksResult,
  operation: 'rollback' | 'redo',
): Promise<boolean> {
  const batches = [
    ...new Set(
      preview.results
        .filter((entry) => entry.batch !== undefined)
        .map((entry) => `${entry.connection}: batch ${String(entry.batch)}`),
    ),
  ];
  const lines = [
    `WARNING: this runs down() for every migration in ${batches.join(', ')}:`,
  ];
  // The package is on every line: a batch can hold plugin migrations executed
  // in the same run, and they roll back with it.
  for (const { connection, record } of rolledBackRecords(preview))
    lines.push(`  [${connection}] ${record.packageName}: ${record.name}`);
  lines.push(
    'Data in anything these migrations drop is lost. Seeds are not re-run, so rows a seed inserted into a table this batch recreates are not restored.',
  );
  if (operation === 'redo')
    lines.push('Every migration then applies again from its current source.');
  return confirm(command, lines);
}

async function confirmRepair(
  command: DatabaseCommandOutput,
  result: AppDatabaseTasksResult,
): Promise<boolean> {
  const lines = [
    'The following history records will be rewritten to match the current sources:',
  ];
  for (const { connection, kind, record } of repairedRecords(result))
    lines.push(`  [${connection}] ${kind}: ${describe(record)}`);
  lines.push(
    'This rewrites recorded history only. It runs nothing, re-runs nothing, and undoes nothing.',
  );
  return confirm(command, lines);
}

async function confirmFresh(
  command: DatabaseCommandOutput,
  plan: readonly AppDatabaseTask[],
): Promise<boolean> {
  // One line per connection: a plan covering both kinds lists each twice.
  const targets = [
    ...new Set(
      plan.filter((task) => !task.skipReason).map((task) => task.connection),
    ),
  ];
  const skipped = [
    ...new Set(
      plan
        .filter((task) => task.skipReason)
        .map((task) => `${task.connection} (${task.skipReason})`),
    ),
  ];
  const lines = [
    `WARNING: this will delete all managed schema objects for: ${targets.join(', ') || 'none'}.`,
    'Every migration and seed then runs again from an empty schema.',
  ];
  if (skipped.length) lines.push(`Skipped: ${skipped.join(', ')}.`);
  return confirm(command, lines);
}

/**
 * Shows what is about to happen and asks for "yes". Under `--json` stdout carries the one document and `log` is silent,
 * so the listing and the prompt go to stderr rather than asking about something the person cannot see.
 */
async function confirm(
  command: DatabaseCommandOutput,
  lines: readonly string[],
): Promise<boolean> {
  const json = command.jsonEnabled();
  for (const line of lines) {
    if (json) command.logToStderr(line);
    else command.log(line);
  }
  const prompt = createInterface({
    input: process.stdin,
    output: json ? process.stderr : process.stdout,
  });
  try {
    const answer = (await prompt.question('Type "yes" to continue: '))
      .trim()
      .toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    prompt.close();
  }
}
