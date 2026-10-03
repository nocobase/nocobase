import { describe, expect, it } from 'vitest';
import {
  isTaskLockBusyError,
  TASK_LOCK_EXPIRY_MS,
  TaskLockBusyError,
  type TaskLockBusyDetails,
} from '../../../src/index.js';
import { withTaskLock } from '../../../src/migration/internal/lock.js';
import type { MigrationConnection } from '../../../src/migration/types.js';

const TABLE = '__nocobase_migration_lock';

const held: TaskLockBusyDetails = {
  label: 'Migration',
  connection: 'main',
  tableName: TABLE,
  lockedBy: '4242:1789967254830:abcdef',
  lockedAt: new Date('2026-09-21T05:07:34.847Z'),
  heartbeatAt: new Date('2026-09-21T05:08:04.847Z'),
  expired: false,
  waitedMs: 30_000,
  inProcess: false,
};

/**
 * A connection whose knex holds the lock row `row` for someone else: every
 * insert conflicts, and reading the row returns it.
 */
function contended(row: Record<string, unknown>): {
  connection: MigrationConnection;
  conflict: Error;
} {
  const conflict = new Error('UNIQUE constraint failed');
  const knex = Object.assign(
    () => ({
      insert: () => Promise.reject(conflict),
      where: () => ({
        first: () => Promise.resolve(row),
        delete: () => Promise.resolve(0),
        update: () => Promise.resolve(0),
      }),
    }),
    {
      schema: {
        hasTable: () => Promise.resolve(true),
        hasColumn: () => Promise.resolve(true),
      },
    },
  );
  return { connection: fakeConnection(() => Promise.resolve(knex)), conflict };
}

function fakeConnection(client: () => Promise<unknown>): MigrationConnection {
  return {
    name: 'main',
    client: client as MigrationConnection['client'],
  } as MigrationConnection;
}

/** The rejection of `promise`, which the test expects to fail. */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('Expected the promise to reject.');
    },
    (error: unknown) => error,
  );
}

describe('TaskLockBusyError', () => {
  it('names the holder and keeps the message a lock timeout always had', () => {
    const cause = new Error('UNIQUE constraint failed');
    const error = new TaskLockBusyError(held, { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'TaskLockBusyError',
      code: 'TASK_LOCK_BUSY',
      ...held,
      cause,
    });
    expect(error.message).toBe(
      `Migration lock "${TABLE}" is already held by "4242:1789967254830:abcdef" since 2026-09-21T05:07:34.847Z. Waited 30.0s for it to be released. Last heartbeat 2026-09-21T05:08:04.847Z. Another migration run holds it; a run that stops beating is taken over automatically after ${TASK_LOCK_EXPIRY_MS / 1000}s, or release it now with "nocobase db unlock".`,
    );
  });

  it('describes a lock this process already holds without a wait', () => {
    const error = new TaskLockBusyError({
      ...held,
      label: 'Seed',
      tableName: '__nocobase_seed_lock',
      inProcess: true,
      waitedMs: 0,
    });
    expect(error.message).toBe(
      'Seed lock "__nocobase_seed_lock" is already held for connection "main".',
    );
  });

  it('is recognised across copies of the package by its brand, not by instanceof', () => {
    expect(isTaskLockBusyError(new TaskLockBusyError(held))).toBe(true);
    const foreign = Object.defineProperty(
      new Error('held'),
      Symbol.for('@nocobase/db.TaskLockBusyError'),
      { value: true },
    );
    expect(isTaskLockBusyError(foreign)).toBe(true);
    expect(isTaskLockBusyError(new Error('held'))).toBe(false);
    expect(isTaskLockBusyError(undefined)).toBe(false);
    expect(isTaskLockBusyError({ code: 'TASK_LOCK_BUSY' })).toBe(false);
  });
});

describe('task lock contention', () => {
  it('fails with TaskLockBusyError once the wait for a live holder runs out', async () => {
    const lockedAt = new Date(Date.now() - 1_000);
    const { connection, conflict } = contended({
      locked_by: 'live-run',
      locked_at: lockedAt,
      heartbeat_at: lockedAt,
    });
    const error = await rejection(
      withTaskLock(
        connection,
        { label: 'Migration', tableName: TABLE, acquireTimeoutMs: 0 },
        () => Promise.resolve('ran'),
      ),
    );
    expect(isTaskLockBusyError(error)).toBe(true);
    expect(error).toMatchObject({
      connection: 'main',
      tableName: TABLE,
      lockedBy: 'live-run',
      lockedAt,
      heartbeatAt: lockedAt,
      expired: false,
      inProcess: false,
      cause: conflict,
    });
    expect((error as TaskLockBusyError).waitedMs).toBeGreaterThanOrEqual(0);
  });

  it('reports a holder that stopped beating as expired, so it can be released without force', async () => {
    const stale = new Date(Date.now() - TASK_LOCK_EXPIRY_MS * 4);
    const { connection } = contended({
      locked_by: 'killed-run',
      locked_at: stale,
      heartbeat_at: stale,
    });
    const error = await rejection(
      withTaskLock(
        connection,
        {
          label: 'Seed',
          tableName: '__nocobase_seed_lock',
          acquireTimeoutMs: 0,
        },
        () => Promise.resolve('ran'),
      ),
    );
    expect(error).toMatchObject({
      name: 'TaskLockBusyError',
      label: 'Seed',
      lockedBy: 'killed-run',
      expired: true,
    });
  });

  it('keeps the claims of different connections apart, even under one name', async () => {
    let release: (value: unknown) => void = () => undefined;
    // Two Database Managers in one process, each with its own `main`: the first holds its claim, and the second must
    // still reach its own database rather than be reported busy.
    const first = fakeConnection(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const firstRun = withTaskLock(
      first,
      { label: 'Migration', tableName: TABLE },
      () => Promise.resolve('ran'),
    ).catch((error: unknown) => error);
    const second = fakeConnection(() =>
      Promise.reject(new Error('the second connection reached its database')),
    );
    await expect(
      withTaskLock(second, { label: 'Migration', tableName: TABLE }, () =>
        Promise.resolve('ran'),
      ),
    ).rejects.toThrow('the second connection reached its database');
    release(undefined);
    await firstRun;
  });

  it('fails with TaskLockBusyError when this process already holds the lock', async () => {
    let release: (value: unknown) => void = () => undefined;
    // The first holder stops before its first query, so it still holds the
    // in-process claim when the second task asks for the same lock.
    const connection = fakeConnection(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = withTaskLock(
      connection,
      { label: 'Migration', tableName: TABLE },
      () => Promise.resolve('ran'),
    ).catch((error: unknown) => error);

    const error = await rejection(
      withTaskLock(connection, { label: 'Migration', tableName: TABLE }, () =>
        Promise.resolve('ran'),
      ),
    );
    expect(isTaskLockBusyError(error)).toBe(true);
    expect(error).toMatchObject({
      message: `Migration lock "${TABLE}" is already held for connection "main".`,
      connection: 'main',
      lockedBy: expect.stringMatching(/^\d+:\d+:/),
      expired: false,
      waitedMs: 0,
      inProcess: true,
    });

    // The first run fails on the unusable client and gives the claim back.
    release(undefined);
    await first;
  });
});
