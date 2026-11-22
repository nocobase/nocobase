import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import type { ScheduleEvent, ScheduleExecutor } from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scheduleId, type ScheduleStore } from '../server/store.js';
import {
  baseDefinition,
  createMemoryScheduleService,
  createSchedulerDatabase,
  createStore,
  definitionRow,
  entry,
  rows,
  type ScheduleServiceHarness,
} from './support/scheduler.js';

const NOW = new Date('2026-03-08T06:30:00.000Z');
const DAILY = scheduleId('main', 'daily');

describe('ScheduleStore', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let harness: ScheduleServiceHarness;
  let executor: ScheduleExecutor;
  let store: ScheduleStore;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    testDatabase = await createSchedulerDatabase();
    database = testDatabase.database;
    harness = await createMemoryScheduleService();
    executor = harness.executor();
    store = createStore(database, executor, 'main', () => new Date()).store;
  });

  afterEach(async () => {
    vi.useRealTimers();
    await harness.dispose();
    await testDatabase.destroy();
  });

  /** An application start: sync, then setup() writes the rules, then activate. */
  async function start(
    subject: ScheduleStore = store,
    manifest = [entry(baseDefinition())],
    finalize = false,
  ): Promise<void> {
    await subject.reconcile(manifest, finalize);
    await executor.setup({ consume: false });
    await subject.activate();
  }

  /** The next application start, on a fresh executor over the same state. */
  async function restart(
    manifest = [entry(baseDefinition())],
    finalize = false,
  ): Promise<void> {
    await executor.shutdown();
    await harness.service.shutdown();
    const next = await createMemoryScheduleService();
    // Carry the persisted rules over to the new process.
    const { cp } = await import('node:fs/promises');
    await cp(harness.directory, next.directory, { recursive: true });
    await harness.dispose();
    harness = next;
    executor = harness.executor();
    store = createStore(database, executor, 'main', () => new Date()).store;
    await start(store, manifest, finalize);
  }

  function started(jobId: string, nextRunAt?: Date): ScheduleEvent {
    return {
      name: 'ScheduleStart',
      jobId,
      jobName: DAILY,
      scheduledAt: new Date('2026-03-09T00:00:00.000Z'),
      runAt: new Date('2026-03-09T00:00:01.000Z'),
      ...(nextRunAt ? { nextRunAt } : {}),
    };
  }

  it('records the planned firing once setup() has written the rule', async () => {
    await store.reconcile([entry(baseDefinition())]);
    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      syncStatus: 'pending',
      nextRunAt: null,
    });

    await executor.setup({ consume: false });
    await store.activate();

    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      syncStatus: 'synced',
      runCount: 0,
      appliedLimit: null,
    });
    expect((await store.list())[0]).toMatchObject({
      id: DAILY,
      nextRunAt: '2026-03-09T00:00:00.000Z',
      scheduleStatus: 'active',
      runCount: 0,
    });
    await expect(executor.getJob(DAILY)).resolves.toMatchObject({
      options: { cron: '0 0 * * *', tz: 'UTC' },
      payload: {
        target: { type: 'report', config: { reportKey: 'test' } },
        definitionHash: expect.any(String),
      },
    });
  });

  it('writes a rule at once when the executor is already set up', async () => {
    await start(store, []);

    await store.reconcile([entry(baseDefinition())]);

    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      syncStatus: 'synced',
    });
    expect((await store.list())[0]?.nextRunAt).toBe('2026-03-09T00:00:00.000Z');
  });

  it('leaves an unchanged rule alone across restarts', async () => {
    await start();
    const before = await executor.getJob(DAILY);
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));

    await restart();

    await expect(executor.getJob(DAILY)).resolves.toEqual(before);
    await expect(rows(database, 'schedule_definitions')).resolves.toHaveLength(
      1,
    );
  });

  it('passes the remaining limit and keeps it while the definition is unchanged', async () => {
    const limited = baseDefinition({
      schedule: { cron: '0 0 * * *', timezone: 'UTC', limit: 5 },
    });
    await start(store, [entry(limited)]);
    await expect(executor.getJob(DAILY)).resolves.toMatchObject({
      options: { limit: 5 },
    });
    await store.recordEvent(started('occurrence-1'));
    await store.recordEvent(started('occurrence-2'));

    await restart([entry(limited)]);
    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      runCount: 2,
      appliedLimit: 5,
    });
    await expect(executor.getJob(DAILY)).resolves.toMatchObject({
      options: { limit: 5 },
    });

    await restart([entry({ ...limited, title: 'Renamed' })]);
    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      appliedLimit: 3,
    });
    await expect(executor.getJob(DAILY)).resolves.toMatchObject({
      options: { limit: 3 },
    });
  });

  it('registers only the handler of a schedule whose limit is spent', async () => {
    const limited = baseDefinition({
      schedule: { cron: '0 0 * * *', timezone: 'UTC', limit: 2 },
    });
    await start(store, [entry(limited)]);
    await store.recordEvent(started('occurrence-1'));
    await store.recordEvent(started('occurrence-2'));

    await restart([
      entry({
        ...limited,
        schedule: { ...limited.schedule, cron: '0 12 * * *' },
      }),
    ]);

    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      appliedLimit: 0,
      nextRunAt: null,
    });
    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();
  });

  it('counts a start once per occurrence and records the run state', async () => {
    await start();
    const next = new Date('2026-03-10T00:00:00.000Z');

    await store.recordEvent(started('occurrence-1', next));
    await store.recordEvent(started('occurrence-1', next));

    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      runCount: 1,
      lastOccurrenceId: 'occurrence-1',
    });
    expect((await store.list())[0]).toMatchObject({
      runCount: 1,
      lastRunAt: '2026-03-09T00:00:01.000Z',
      nextRunAt: '2026-03-10T00:00:00.000Z',
    });

    await store.recordEvent(started('occurrence-2'));
    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      runCount: 2,
      nextRunAt: null,
    });
  });

  it('counts concurrent starts of different occurrences', async () => {
    await start();

    await Promise.all(
      ['a', 'b', 'c'].map((id) => store.recordEvent(started(id))),
    );

    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      runCount: 3,
    });
  });

  it.each(['ScheduleEnd', 'ScheduleError'] as const)(
    'updates only the next firing on %s',
    async (name) => {
      await start();
      await store.recordEvent(started('occurrence-1'));

      await store.recordEvent({
        ...started('occurrence-1'),
        name,
        nextRunAt: new Date('2026-03-11T00:00:00.000Z'),
      });

      await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
        runCount: 1,
        nextRunAt: expect.anything(),
      });
      expect((await store.list())[0]?.nextRunAt).toBe(
        '2026-03-11T00:00:00.000Z',
      );
    },
  );

  it('removes the rule on disable and adds the remaining limit on enable', async () => {
    const limited = baseDefinition({
      schedule: { cron: '0 0 * * *', timezone: 'UTC', limit: 4 },
    });
    await start(store, [entry(limited)]);
    await store.recordEvent(started('occurrence-1'));

    await store.setEnabled(DAILY, false);
    expect((await store.list())[0]).toMatchObject({
      enabled: false,
      scheduleStatus: 'paused',
    });
    expect((await store.list())[0]).not.toHaveProperty('nextRunAt');
    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();

    await store.setEnabled(DAILY, true);
    expect((await store.list())[0]).toMatchObject({
      enabled: true,
      scheduleStatus: 'active',
      nextRunAt: '2026-03-09T00:00:00.000Z',
    });
    await expect(definitionRow(database, DAILY)).resolves.toMatchObject({
      appliedLimit: 3,
    });
    await expect(executor.getJob(DAILY)).resolves.toMatchObject({
      options: { limit: 3 },
    });
  });

  it('keeps an administrator pause across restarts', async () => {
    await start();
    await store.setEnabled(DAILY, false);

    await restart([entry(baseDefinition({ title: 'Renamed' }))]);

    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();
    expect((await store.list())[0]).toMatchObject({
      title: 'Renamed',
      enabled: false,
      scheduleStatus: 'paused',
    });
  });

  it('rejects enabling an unknown schedule', async () => {
    await start();

    await expect(store.setEnabled('missing', true)).rejects.toThrow(
      'Schedule not found.',
    );
  });

  it('deactivates missing definitions only on finalize and restores them later', async () => {
    await start();
    await store.recordEvent(started('occurrence-1'));

    await restart([], false);
    expect((await store.list())[0]?.lifecycleState).toBe('active');
    await expect(executor.getJob(DAILY)).resolves.toBeDefined();

    await restart([], true);
    expect((await store.list())[0]).toMatchObject({
      id: DAILY,
      lifecycleState: 'inactive',
      inactiveReason: 'definition_removed',
      scheduleStatus: 'paused',
      runCount: 1,
    });
    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();

    await restart();
    expect((await store.list())[0]).toMatchObject({
      id: DAILY,
      lifecycleState: 'active',
      scheduleStatus: 'active',
      runCount: 1,
      nextRunAt: '2026-03-09T00:00:00.000Z',
    });
  });

  it('removes at startup the rule a disabled definition still has', async () => {
    await start();
    // Disabled without its rule being removed, as when a removal was lost.
    await database
      .query()
      .updateTable('schedule_definitions')
      .set({ enabled: false })
      .where('id', '=', DAILY)
      .execute();
    await expect(executor.getJob(DAILY)).resolves.toBeDefined();

    await restart();

    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();
    expect((await store.list())[0]).toMatchObject({
      enabled: false,
      scheduleStatus: 'paused',
    });
  });

  it('removes at startup the rule an inactive definition left behind', async () => {
    await start();
    await restart([], true);
    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();
    // The memory adapter overwrote the removal, putting the rule back.
    const { createScheduleDispatchJob } = await import('../server/dispatch.js');
    await executor.addJob(
      createScheduleDispatchJob(
        {
          id: DAILY,
          cron: '0 0 * * *',
          timezone: 'UTC',
          target: { type: 'report', config: {} },
          definitionHash: 'stale',
        },
        undefined,
        {} as never,
      ),
    );

    await restart([]);

    await expect(executor.getJob(DAILY)).resolves.toBeUndefined();
    expect((await store.list())[0]?.lifecycleState).toBe('inactive');
  });

  it('keeps the rule of an active definition a partial manifest leaves out', async () => {
    await start();

    await restart([]);

    await expect(executor.getJob(DAILY)).resolves.toBeDefined();
  });

  it('keeps a rule whose definition was enabled again before the removal ran', async () => {
    await start();
    await store.setEnabled(DAILY, false);
    // This instance starts and reads the schedule as disabled; its removal
    // waits for activate().
    const starting = createStore(
      database,
      executor,
      'main',
      () => new Date(),
    ).store;
    await starting.reconcile([entry(baseDefinition())]);

    // Another instance enables it in the meantime.
    await store.setEnabled(DAILY, true);
    await starting.activate();

    await expect(executor.getJob(DAILY)).resolves.toBeDefined();
  });

  it('reuses the app lock and keeps different apps isolated', async () => {
    await start(store, []);
    await store.reconcile([], true);
    const other = createStore(database, executor, 'other').store;
    await other.reconcile([]);

    expect(await rows(database, 'schedule_sync_locks')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ appName: 'main' }),
        expect.objectContaining({ appName: 'other' }),
      ]),
    );
    await expect(rows(database, 'schedule_sync_locks')).resolves.toHaveLength(
      2,
    );
  });

  it('counts only succeeded occurrences as completed, per app', async () => {
    await start(store, [
      entry(baseDefinition()),
      entry(baseDefinition({ key: 'weekly', title: 'Weekly' })),
    ]);
    const other = createStore(database, executor, 'other').store;
    await other.reconcile([entry(baseDefinition())]);
    await insertOccurrences(DAILY, [
      'succeeded',
      'succeeded',
      'failed',
      'timed_out',
      'cancelled',
      'triggered',
      'skipped',
    ]);
    await insertOccurrences(scheduleId('main', 'weekly'), [
      'succeeded',
      'running',
    ]);
    await insertOccurrences(scheduleId('other', 'daily'), ['succeeded']);

    const byKey = new Map(
      (await store.list()).map((record) => [record.key, record]),
    );
    expect(byKey.get('daily')?.completedCount).toBe(2);
    expect(byKey.get('weekly')?.completedCount).toBe(1);
    expect((await other.list())[0]?.completedCount).toBe(1);
  });

  it('reads one page of Schedules by title, counts them, and finds those removed from code', async () => {
    await start(store, [
      entry(baseDefinition({ key: 'c', title: 'Charlie' })),
      entry(baseDefinition({ key: 'a', title: 'Alpha' })),
      entry(baseDefinition({ key: 'b', title: 'Bravo' })),
    ]);
    const other = createStore(database, executor, 'other').store;
    await other.reconcile([entry(baseDefinition())]);
    await insertOccurrences(scheduleId('main', 'b'), ['succeeded']);

    await expect(store.count()).resolves.toBe(3);
    const page = await store.list({ offset: 1, limit: 1 });
    expect(
      page.map(({ key, completedCount }) => [key, completedCount]),
    ).toEqual([['b', 1]]);
    await expect(
      store
        .list({ id: scheduleId('main', 'c') })
        .then((rows) => rows.map(({ key }) => key)),
    ).resolves.toEqual(['c']);
    await expect(
      store
        .list({
          removedFromCode: [scheduleId('main', 'a'), scheduleId('main', 'c')],
        })
        .then((rows) => rows.map(({ key }) => key)),
    ).resolves.toEqual(['b']);
  });

  it('lists the window, the limit and the outcome of the latest firing', async () => {
    await start(store, [
      entry(
        baseDefinition({
          schedule: {
            cron: '0 0 * * *',
            timezone: 'UTC',
            from: new Date('2026-03-01T00:00:00.000Z'),
            to: new Date('2026-04-01T00:00:00.000Z'),
            limit: 10,
          },
        }),
      ),
    ]);
    expect((await store.list())[0]).not.toHaveProperty('lastRun');
    await insertOccurrences(DAILY, ['failed']);
    await database
      .query()
      .updateTable('schedule_definitions')
      .set({ lastOccurrenceId: `${DAILY}-occurrence-0` })
      .where('id', '=', DAILY)
      .execute();
    expect((await store.list())[0]).toMatchObject({
      sourceType: 'code',
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-04-01T00:00:00.000Z',
      limit: 10,
      lastRun: { status: 'failed' },
    });
  });

  it('pages the history of every Schedule by keyset, filtered, without repeating or skipping a row', async () => {
    await start(store, [
      entry(baseDefinition()),
      entry(baseDefinition({ key: 'weekly', title: 'Weekly' })),
    ]);
    const other = createStore(database, executor, 'other').store;
    await other.reconcile([entry(baseDefinition())]);
    const WEEKLY = scheduleId('main', 'weekly');
    // Two occurrences share each planned time, so the id breaks every tie.
    const instants = [0, 0, 1, 1, 2, 2, 3, 3].map(
      (hour) => new Date(Date.UTC(2026, 2, 7, hour)),
    );
    await insertOccurrences(
      DAILY,
      ['succeeded', 'failed', 'skipped', 'failed'],
      instants.slice(0, 4),
    );
    await insertOccurrences(
      WEEKLY,
      ['timed_out', 'succeeded', 'failed', 'waiting'],
      instants.slice(4),
    );
    await insertOccurrences(scheduleId('other', 'daily'), ['failed']);

    async function all(
      query: Omit<Parameters<ScheduleStore['listAllOccurrences']>[0], 'limit'>,
    ): Promise<string[]> {
      return pageAll(query, 3);
    }

    const everything = await all({});
    expect(everything).toHaveLength(8);
    expect(new Set(everything).size).toBe(8);
    expect(everything.slice(0, 2)).toEqual([
      `${WEEKLY}-occurrence-3`,
      `${WEEKLY}-occurrence-2`,
    ]);
    await expect(all({ statuses: ['failed', 'timed_out'] })).resolves.toEqual([
      `${WEEKLY}-occurrence-2`,
      `${WEEKLY}-occurrence-0`,
      `${DAILY}-occurrence-3`,
      `${DAILY}-occurrence-1`,
    ]);
    await expect(
      all({ scheduleId: DAILY, statuses: ['failed'] }),
    ).resolves.toEqual([`${DAILY}-occurrence-3`, `${DAILY}-occurrence-1`]);
    await expect(
      all({
        from: new Date(Date.UTC(2026, 2, 7, 1)),
        to: new Date(Date.UTC(2026, 2, 7, 2)),
      }),
    ).resolves.toEqual([`${DAILY}-occurrence-3`, `${DAILY}-occurrence-2`]);
    await expect(
      all({ scheduleId: scheduleId('other', 'daily') }),
    ).resolves.toEqual([]);
    const [first] = await store.listAllOccurrences({ limit: 1 });
    expect(JSON.stringify(first)).not.toContain('reportKey');
  });

  it('sorts, filters and pages the history by planned time, not by when a late firing started', async () => {
    await start(store, [
      entry(baseDefinition()),
      entry(baseDefinition({ key: 'weekly', title: 'Weekly' })),
    ]);
    const WEEKLY = scheduleId('main', 'weekly');
    const at = (minute: number) => new Date(Date.UTC(2026, 2, 7, 9, minute));
    // Planned for 09:00, queued behind a slow firing until 09:12.
    await insertOccurrences(DAILY, ['succeeded'], [at(0)], [at(12)]);
    await insertOccurrences(WEEKLY, ['succeeded'], [at(10)]);

    await expect(pageAll({}, 10)).resolves.toEqual([
      `${WEEKLY}-occurrence-0`,
      `${DAILY}-occurrence-0`,
    ]);
    await expect(pageAll({ from: at(5) }, 10)).resolves.toEqual([
      `${WEEKLY}-occurrence-0`,
    ]);
    await expect(pageAll({ to: at(5) }, 10)).resolves.toEqual([
      `${DAILY}-occurrence-0`,
    ]);
    await expect(
      store.listOccurrences(DAILY).then((page) => page.map(({ id }) => id)),
    ).resolves.toEqual([`${DAILY}-occurrence-0`]);
  });

  it('pages every occurrence that shares one planned time without repeating or skipping any', async () => {
    await start(store, [entry(baseDefinition())]);
    const planned = new Date(Date.UTC(2026, 2, 7, 9));
    await insertOccurrences(
      DAILY,
      ['succeeded', 'failed', 'skipped', 'succeeded', 'waiting'],
      Array.from({ length: 5 }, () => planned),
      [1, 2, 3, 4, 5].map(
        (minute) => new Date(planned.getTime() + minute * 60_000),
      ),
    );

    const ids = await pageAll({}, 2);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  async function pageAll(
    query: Omit<Parameters<ScheduleStore['listAllOccurrences']>[0], 'limit'>,
    size: number,
  ): Promise<string[]> {
    const ids: string[] = [];
    let after: { scheduledAt: string; id: string } | undefined;
    for (;;) {
      const page = await store.listAllOccurrences({
        ...query,
        ...(after ? { after } : {}),
        limit: size,
      });
      ids.push(...page.map(({ id }) => id));
      const last = page.at(-1);
      if (page.length < size || !last) return ids;
      after = { scheduledAt: last.scheduledAt ?? last.startedAt, id: last.id };
    }
  }

  it('records a retryable synchronization failure', async () => {
    const failing = createStore(database, {
      ...executor,
      addJob: async () => {
        throw new Error('rule rejected');
      },
    } as ScheduleExecutor).store;

    await expect(
      failing.reconcile([entry(baseDefinition())], true),
    ).rejects.toThrow('rule rejected');
    await expect(rows(database, 'schedule_definitions')).resolves.toMatchObject(
      [{ syncStatus: 'failed', syncError: 'rule rejected' }],
    );

    await start();
    await expect(rows(database, 'schedule_definitions')).resolves.toMatchObject(
      [{ syncStatus: 'synced', syncError: null }],
    );
  });

  it('plans five/six fields, inclusive bounds, UTC and an IANA DST transition', async () => {
    await start(store, [
      entry(
        baseDefinition({
          key: 'five',
          schedule: { cron: '0 7 * * *', timezone: 'UTC' },
        }),
      ),
      entry(
        baseDefinition({
          key: 'six',
          schedule: { cron: '30 0 7 * * *', timezone: 'UTC' },
        }),
      ),
      entry(
        baseDefinition({
          key: 'from',
          schedule: {
            cron: '0 0 7 * * *',
            timezone: 'UTC',
            from: new Date('2026-03-08T07:00:00.000Z'),
            to: new Date('2026-03-08T07:00:00.000Z'),
          },
        }),
      ),
      entry(
        baseDefinition({
          key: 'dst',
          schedule: { cron: '0 0 3 * * *', timezone: 'America/New_York' },
        }),
      ),
    ]);
    const byKey = new Map(
      (await store.list()).map((record) => [record.key, record]),
    );
    expect(byKey.get('five')?.nextRunAt).toBe('2026-03-08T07:00:00.000Z');
    expect(byKey.get('six')?.nextRunAt).toBe('2026-03-08T07:00:30.000Z');
    expect(byKey.get('dst')?.nextRunAt).toBe('2026-03-08T07:00:00.000Z');
    expect(byKey.get('from')?.nextRunAt).toBe('2026-03-08T07:00:00.000Z');
  });

  async function insertOccurrences(
    schedule: string,
    statuses: readonly string[],
    scheduledAt: readonly Date[] = [],
    startedAt: readonly Date[] = [],
  ): Promise<void> {
    for (const [index, status] of statuses.entries()) {
      const planned =
        scheduledAt[index] ?? new Date('2026-03-08T00:00:00.000Z');
      const started = startedAt[index] ?? planned;
      // Through the Repository so the instants are encoded the way each dialect stores them.
      await testDatabase.connection
        .repository('scheduleOccurrences')
        .createOne({
          values: {
            id: `${schedule}-occurrence-${index}`,
            scheduleId: schedule,
            definitionHash: 'definition-hash',
            status,
            targetType: 'report',
            executionCount: 1,
            scheduledAt: planned,
            startedAt: started,
            lastStartedAt: started,
            createdAt: new Date('2026-03-08T00:00:00.000Z'),
            updatedAt: new Date('2026-03-08T00:00:00.000Z'),
          },
        });
    }
  }
});
