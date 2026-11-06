import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleOccurrenceStore } from '../server/occurrences.js';
import type { ScheduleTargetRegistry } from '../server/schedules/registry.js';
import { scheduleId } from '../server/store.js';

import type { ScheduleDefinition } from '../server/schedules/define.js';
import { DefaultSchedulerService } from '../server/services/scheduler.js';
import {
  createMemoryScheduleService,
  createSchedulerDatabase,
  createStore,
  type ScheduleServiceHarness,
} from './support/scheduler.js';

describe('DefaultSchedulerService.defineSchedule', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let harness: ScheduleServiceHarness;
  let scheduler: DefaultSchedulerService;
  let occurrenceStore: ScheduleOccurrenceStore;
  let targetRegistry: ScheduleTargetRegistry;

  beforeEach(async () => {
    testDatabase = await createSchedulerDatabase();
    database = testDatabase.database;
    harness = await createMemoryScheduleService();
    const { store, occurrences, targets } = createStore(
      database,
      harness.executor(),
    );
    occurrenceStore = occurrences;
    targetRegistry = targets;
    targets.register({
      type: 'report',
      title: 'Report',
      validate: () => ({ valid: true }),
      start: async () => ({ state: 'completed', outcome: 'succeeded' }),
    });
    scheduler = new DefaultSchedulerService(store, occurrences, targets);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await harness.dispose();
    await testDatabase.destroy();
  });

  it('reports a reconciliation completion write failure after other rows finish', async () => {
    scheduler.defineSchedule(baseDefinition());
    await scheduler.sync();
    for (const id of ['one', 'two']) {
      await occurrenceStore.start(
        { scheduleId: scheduleId('main', 'daily'), occurrenceId: id },
        'hash',
        'report',
      );
      await occurrenceStore.wait(id, { type: 'report', id });
    }
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    vi.spyOn(targetRegistry, 'inspect').mockImplementation(async () => {
      entered.resolve();
      await release.promise;
      return { state: 'completed', completion: { status: 'succeeded' } };
    });
    const error = new Error('terminal persistence failed');
    const complete = vi
      .spyOn(occurrenceStore, 'complete')
      .mockRejectedValueOnce(error);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const inspection = scheduler.reconcileOccurrences();
    await entered.promise;
    const drain = scheduler.drain();
    const outcome = drain.catch((cause) => cause);
    release.resolve();
    await expect(inspection).resolves.toBe(1);
    expect(await outcome).toBe(error);
    expect(complete).toHaveBeenCalledTimes(2);
    const rows = await database
      .query()
      .selectFrom('schedule_occurrences')
      .select('status')
      .execute();
    expect(rows.map((row) => row.status).sort()).toEqual([
      'succeeded',
      'waiting',
    ]);
  });

  it('registers a definition directly and reconciles it on sync', async () => {
    scheduler.defineSchedule(baseDefinition());
    await scheduler.sync();

    const rows = await database
      .query()
      .selectFrom('schedule_definitions')
      .selectAll()
      .execute();
    expect(rows).toMatchObject([{ key: 'daily' }]);
  });

  it('allows different keys in one application', async () => {
    scheduler.defineSchedule(baseDefinition());
    scheduler.defineSchedule(baseDefinition({ key: 'weekly' }));
    await scheduler.sync();

    const rows = await database
      .query()
      .selectFrom('schedule_definitions')
      .selectAll()
      .execute();
    expect(rows).toHaveLength(2);
  });

  it('rejects a duplicate key at sync time', async () => {
    scheduler.defineSchedule(baseDefinition());
    scheduler.defineSchedule(baseDefinition());

    await expect(scheduler.sync()).rejects.toThrow(
      'Duplicate Schedule definition: daily',
    );
  });
});

function baseDefinition(
  overrides: Partial<ScheduleDefinition> = {},
): ScheduleDefinition {
  return {
    key: 'daily',
    title: 'Daily',
    schedule: { cron: '0 0 * * *', timezone: 'UTC' },
    target: { type: 'report', config: { reportKey: 'test' } },
    ...overrides,
  };
}
