import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

  beforeEach(async () => {
    testDatabase = await createSchedulerDatabase();
    database = testDatabase.database;
    harness = await createMemoryScheduleService();
    const { store, occurrences, targets } = createStore(
      database,
      harness.executor(),
    );
    targets.register({
      type: 'report',
      title: 'Report',
      validate: () => ({ valid: true }),
      start: async () => ({ state: 'completed', outcome: 'succeeded' }),
    });
    scheduler = new DefaultSchedulerService(store, occurrences, targets);
  });

  afterEach(async () => {
    await harness.dispose();
    await testDatabase.destroy();
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
