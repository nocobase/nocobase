import type { Knex } from 'knex';
import type { MigrationConnection } from '../types.js';

export const DEFAULT_MIGRATION_LOCK_TABLE = '__nocobase_migration_lock';

/**
 * How long acquiring waits for a concurrent run to release the lock before it
 * fails. A restarted process releases its lock in well under a second, while a
 * real run can legitimately hold it for much longer, which is what the wait is
 * for: contention between two starts is normally transient, and failing on the
 * first conflict turns it into an error an operator has to interpret.
 */
export const DEFAULT_TASK_LOCK_ACQUIRE_TIMEOUT_MS = 30_000;

/** How often a holder proves it is still alive. */
export const TASK_LOCK_HEARTBEAT_INTERVAL_MS = 5_000;

/**
 * How long a lock survives without a heartbeat before another run may take it
 * over. A hard kill — SIGKILL, a container stopped, a machine lost — runs no
 * cleanup, so the row would otherwise block every later run until someone
 * deleted it by hand. Several missed beats are tolerated so a slow database
 * does not hand the lock to a second run while the first is still working.
 */
export const TASK_LOCK_EXPIRY_MS = 30_000;

const LOCK_ROW_ID = 1;
const INITIAL_RETRY_DELAY_MS = 50;
const MAX_RETRY_DELAY_MS = 500;

/**
 * Insert attempts tolerated while the lock table holds no row. An insert that
 * keeps failing with nothing to conflict with is not contention, so the driver
 * error is reported instead of being retried until the timeout.
 */
const MAX_ATTEMPTS_WITHOUT_HOLDER = 3;

/** Expired rows taken over before the contention is reported instead. */
const MAX_TAKEOVERS = 3;

/**
 * What a migration connection's in-process lock claims are kept by: the Database Connection it was made from, set by
 * `createMigrationConnection`. A connection without one — a test's stand-in — is kept by itself.
 */
export const TASK_LOCK_SCOPE: unique symbol = Symbol(
  '@nocobase/db.taskLockScope',
);

/**
 * Locks this process holds, by connection and then by table, with the owner holding each. Keyed by the Database
 * Connection rather than its name: two Database Managers in one process — two applications a host embeds, or two
 * tests — each have a connection called `main` on databases of their own, and one migrating must not report the other
 * busy. Two managers on the same database still take turns, through the lock row.
 */
const inProcessLocks = new WeakMap<object, Map<string, string>>();

function claimsOf(connection: MigrationConnection): Map<string, string> {
  const scope =
    (connection as { readonly [TASK_LOCK_SCOPE]?: object })[TASK_LOCK_SCOPE] ??
    connection;
  let claims = inProcessLocks.get(scope);
  if (!claims) {
    claims = new Map();
    inProcessLocks.set(scope, claims);
  }
  return claims;
}

const TASK_LOCK_BUSY: unique symbol = Symbol.for(
  '@nocobase/db.TaskLockBusyError',
);

/** A lock as it stands in the database, as reported to an operator. */
export interface TaskLockState {
  readonly tableName: string;
  readonly lockedBy: string;
  readonly lockedAt: Date | undefined;
  readonly heartbeatAt: Date | undefined;
  /** No heartbeat within {@link TASK_LOCK_EXPIRY_MS}: the holder is gone. */
  readonly expired: boolean;
}

/** Why a lock was taken over, for a caller that reports it. */
export interface StaleTaskLockTakeover {
  readonly tableName: string;
  readonly lockedBy: string;
  readonly heartbeatAt: Date | undefined;
  readonly staleForMs: number;
}

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

/**
 * A task lock is held by another run, so the task did not start.
 *
 * Contention is ordinary: two starts race, or a deploy overlaps a manual run.
 * The holder is named so a caller can decide whether to wait or, once someone
 * has confirmed the holder is gone, release the lock: an expired one (see
 * {@link TaskLockState.expired}) needs no force to release, a live one does.
 */
export class TaskLockBusyError extends Error implements TaskLockBusyDetails {
  readonly code = 'TASK_LOCK_BUSY' as const;
  readonly label: string;
  readonly connection: string;
  readonly tableName: string;
  readonly lockedBy: string;
  readonly lockedAt: Date | undefined;
  readonly heartbeatAt: Date | undefined;
  readonly expired: boolean;
  readonly waitedMs: number;
  readonly inProcess: boolean;

  constructor(details: TaskLockBusyDetails, options?: ErrorOptions) {
    super(describeBusyLock(details), options);
    this.name = 'TaskLockBusyError';
    this.label = details.label;
    this.connection = details.connection;
    this.tableName = details.tableName;
    this.lockedBy = details.lockedBy;
    this.lockedAt = details.lockedAt;
    this.heartbeatAt = details.heartbeatAt;
    this.expired = details.expired;
    this.waitedMs = details.waitedMs;
    this.inProcess = details.inProcess;
    Object.defineProperty(this, TASK_LOCK_BUSY, { value: true });
  }
}

/**
 * Whether `error` is a {@link TaskLockBusyError}, including one created by
 * another copy of this package. The brand is a registered symbol rather than
 * `instanceof`, which a duplicated installation would defeat.
 */
export function isTaskLockBusyError(
  error: unknown,
): error is TaskLockBusyError {
  return (
    error instanceof TaskLockBusyError ||
    (typeof error === 'object' &&
      error !== null &&
      (error as Record<symbol, unknown>)[TASK_LOCK_BUSY] === true)
  );
}

export interface TaskLockReleaseResult {
  readonly released: boolean;
  readonly lock: TaskLockState | undefined;
  /** `not-held` when there was nothing to release, `active` when it is alive. */
  readonly reason: 'not-held' | 'active' | undefined;
}

export interface TaskLockOptions {
  readonly tableName?: string;
  /** Defaults to {@link DEFAULT_TASK_LOCK_ACQUIRE_TIMEOUT_MS}. */
  readonly acquireTimeoutMs?: number;
  /** Called when an expired lock is taken over, before the task runs. */
  readonly onStaleLock?: (takeover: StaleTaskLockTakeover) => void;
}

/** A task lock with its messages resolved: `Migration`, `Seed`, and so on. */
export interface TaskLockDescriptor extends TaskLockOptions {
  readonly label: string;
  readonly tableName: string;
}

interface TaskLockRow {
  readonly locked_by?: unknown;
  readonly locked_at?: unknown;
  readonly heartbeat_at?: unknown;
}

export function withMigrationLock<T>(
  connection: MigrationConnection,
  options: TaskLockOptions,
  fn: () => Promise<T>,
): Promise<T> {
  return withTaskLock(
    connection,
    {
      label: 'Migration',
      tableName: options.tableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
      acquireTimeoutMs: options.acquireTimeoutMs,
      onStaleLock: options.onStaleLock,
    },
    fn,
  );
}

export async function withTaskLock<T>(
  connection: MigrationConnection,
  options: TaskLockDescriptor,
  fn: () => Promise<T>,
): Promise<T> {
  const { label, tableName } = options;
  const claims = claimsOf(connection);
  const holder = claims.get(tableName);
  if (holder !== undefined) {
    throw new TaskLockBusyError({
      label,
      connection: connection.name,
      tableName,
      lockedBy: holder,
      lockedAt: undefined,
      heartbeatAt: undefined,
      expired: false,
      waitedMs: 0,
      inProcess: true,
    });
  }

  const owner = createLockOwner();
  claims.set(tableName, owner);
  let acquired = false;
  let heartbeat: NodeJS.Timeout | undefined;

  try {
    await ensureTaskLockTable(connection, tableName);
    await acquireDatabaseLock(connection, options, owner);
    acquired = true;
    heartbeat = startHeartbeat(connection, tableName, owner);
    return await fn();
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    try {
      if (acquired) {
        await releaseDatabaseLock(connection, tableName, owner);
      }
    } finally {
      claims.delete(tableName);
    }
  }
}

export async function ensureTaskLockTable(
  connection: MigrationConnection,
  tableName: string,
): Promise<void> {
  const knex = await connection.client<Knex>();
  const exists = await knex.schema.hasTable(tableName);
  if (!exists) {
    try {
      await knex.schema.createTable(
        tableName,
        (table: Knex.CreateTableBuilder) => {
          table.integer('id').primary();
          table.string('locked_by', 191).notNullable();
          table.dateTime('locked_at').notNullable();
          table.dateTime('heartbeat_at').nullable();
        },
      );
    } catch (error) {
      if (!(await knex.schema.hasTable(tableName))) {
        throw error;
      }
    }
  }

  // A table created before heartbeats existed is upgraded in place. The lock is
  // what every migration runs inside, so it cannot be a migration itself.
  if (!(await knex.schema.hasColumn(tableName, 'heartbeat_at'))) {
    await knex.schema.alterTable(tableName, (table: Knex.AlterTableBuilder) => {
      table.dateTime('heartbeat_at').nullable();
    });
  }
}

/** Reads the lock without creating its table, for inspection and release. */
export async function readTaskLockState(
  connection: MigrationConnection,
  tableName: string,
  now: number = Date.now(),
): Promise<TaskLockState | undefined> {
  const knex = await connection.client<Knex>();
  if (!(await knex.schema.hasTable(tableName))) return undefined;
  const row = await readLockRow(knex, tableName);
  return row ? describeLock(tableName, row, now) : undefined;
}

/**
 * Deletes the lock row. An active lock is left alone unless `force` is set:
 * releasing one a live run is holding lets a second run start beside it.
 */
export async function releaseTaskLock(
  connection: MigrationConnection,
  tableName: string,
  options: { readonly force?: boolean } = {},
): Promise<TaskLockReleaseResult> {
  const lock = await readTaskLockState(connection, tableName);
  if (!lock) return { released: false, lock: undefined, reason: 'not-held' };
  if (!lock.expired && !options.force) {
    return { released: false, lock, reason: 'active' };
  }

  const knex = await connection.client<Knex>();
  await knex(tableName)
    .where({ id: LOCK_ROW_ID, locked_by: lock.lockedBy })
    .delete();
  return { released: true, lock, reason: undefined };
}

async function acquireDatabaseLock(
  connection: MigrationConnection,
  options: TaskLockDescriptor,
  owner: string,
): Promise<void> {
  const { label, tableName } = options;
  const timeoutMs =
    options.acquireTimeoutMs ?? DEFAULT_TASK_LOCK_ACQUIRE_TIMEOUT_MS;
  const knex = await connection.client<Knex>();
  const startedAt = Date.now();
  let delayMs = INITIAL_RETRY_DELAY_MS;
  let attemptsWithoutHolder = 0;
  let takeovers = 0;
  let lastError: unknown;

  for (;;) {
    try {
      const at = new Date();
      await knex(tableName).insert({
        id: LOCK_ROW_ID,
        locked_by: owner,
        locked_at: at,
        heartbeat_at: at,
      });
      return;
    } catch (error) {
      lastError = error;
    }

    // A conflicting row is the expected reason to be here, but the holder can
    // release it between the failed insert and this read. A missing row is
    // therefore a reason to try again rather than a reason to report the
    // driver's constraint error for what is ordinary contention.
    const current = await readLockRow(knex, tableName);
    const elapsedMs = Date.now() - startedAt;
    if (current) {
      const state = describeLock(tableName, current, Date.now());
      attemptsWithoutHolder = 0;
      if (state.expired && takeovers < MAX_TAKEOVERS && elapsedMs < timeoutMs) {
        // The holder stopped proving it was alive, which a hard kill is the
        // usual reason for. Taking the row over is the only way forward that
        // does not need a person to delete it. Retried immediately, and only
        // so many times: a row that keeps coming back has a live writer.
        takeovers += 1;
        await takeOverExpiredLock(knex, tableName, state, options);
        continue;
      }

      if (elapsedMs >= timeoutMs || takeovers >= MAX_TAKEOVERS) {
        throw new TaskLockBusyError(
          {
            ...state,
            label,
            connection: connection.name,
            waitedMs: elapsedMs,
            inProcess: false,
          },
          { cause: lastError },
        );
      }
    } else {
      attemptsWithoutHolder += 1;
      if (
        attemptsWithoutHolder >= MAX_ATTEMPTS_WITHOUT_HOLDER ||
        elapsedMs >= timeoutMs
      ) {
        throw new Error(
          `${label} lock "${tableName}" could not be acquired, and the lock table holds no row to wait for.`,
          { cause: lastError },
        );
      }
    }

    await sleep(Math.min(delayMs, MAX_RETRY_DELAY_MS, timeoutMs - elapsedMs));
    delayMs *= 2;
  }
}

async function takeOverExpiredLock(
  knex: Knex,
  tableName: string,
  state: TaskLockState,
  options: TaskLockDescriptor,
): Promise<void> {
  const staleSince = state.heartbeatAt ?? state.lockedAt;
  // Scoped to the owner that was read, so a run that acquires it in between is
  // not deleted by this one.
  const deleted = await knex(tableName)
    .where({ id: LOCK_ROW_ID, locked_by: state.lockedBy })
    .delete();
  if (!deleted) return;

  options.onStaleLock?.({
    tableName,
    lockedBy: state.lockedBy,
    heartbeatAt: state.heartbeatAt,
    staleForMs: staleSince ? Date.now() - staleSince.getTime() : 0,
  });
}

function startHeartbeat(
  connection: MigrationConnection,
  tableName: string,
  owner: string,
): NodeJS.Timeout {
  const timer = setInterval(() => {
    void (async () => {
      try {
        const knex = await connection.client<Knex>();
        await knex(tableName)
          .where({ id: LOCK_ROW_ID, locked_by: owner })
          .update({ heartbeat_at: new Date() });
      } catch {
        // A failed beat is not a reason to abort the task: the next one may
        // succeed, and a task that loses its lock fails on its own writes.
      }
    })();
  }, TASK_LOCK_HEARTBEAT_INTERVAL_MS);
  // The task itself keeps the process alive; the timer must not.
  timer.unref();
  return timer;
}

async function releaseDatabaseLock(
  connection: MigrationConnection,
  tableName: string,
  owner: string,
): Promise<void> {
  const knex = await connection.client<Knex>();
  await knex(tableName)
    .where({
      id: LOCK_ROW_ID,
      locked_by: owner,
    })
    .delete();
}

/**
 * Reads the current holder for the failure message. A read that fails leaves
 * the caller to retry and then report the insert error, so it reports no
 * holder rather than replacing the original failure with its own.
 */
async function readLockRow(
  knex: Knex,
  tableName: string,
): Promise<TaskLockRow | undefined> {
  try {
    return await knex(tableName)
      .where({ id: LOCK_ROW_ID })
      .first<TaskLockRow | undefined>();
  } catch {
    return undefined;
  }
}

function describeLock(
  tableName: string,
  row: TaskLockRow,
  now: number,
): TaskLockState {
  const heartbeatAt = toDate(row.heartbeat_at);
  const lockedAt = toDate(row.locked_at);
  const provenAt = heartbeatAt ?? lockedAt;
  return {
    tableName,
    lockedBy: typeof row.locked_by === 'string' ? row.locked_by : 'unknown',
    lockedAt,
    heartbeatAt,
    // An unreadable timestamp is treated as expired: a row nothing can date is
    // one nothing can wait for either.
    expired: provenAt ? now - provenAt.getTime() > TASK_LOCK_EXPIRY_MS : true,
  };
}

function describeBusyLock(lock: TaskLockBusyDetails): string {
  const { label, tableName } = lock;
  if (lock.inProcess) {
    return `${label} lock "${tableName}" is already held for connection "${lock.connection}".`;
  }
  const since = lock.lockedAt ? ` since ${lock.lockedAt.toISOString()}` : '';
  const beat = lock.heartbeatAt
    ? ` Last heartbeat ${lock.heartbeatAt.toISOString()}.`
    : '';
  return `${label} lock "${tableName}" is already held by "${lock.lockedBy}"${since}. Waited ${(lock.waitedMs / 1000).toFixed(1)}s for it to be released.${beat} Another ${label.toLowerCase()} run holds it; a run that stops beating is taken over automatically after ${TASK_LOCK_EXPIRY_MS / 1000}s, or release it now with "nocobase db unlock".`;
}

/** Dialects return the timestamp as a Date, an epoch number, or a string. */
function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : undefined;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : new Date(parsed);
  }
  return undefined;
}

function sleep(durationMs: number): Promise<void> {
  if (durationMs <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function createLockOwner(): string {
  return `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
