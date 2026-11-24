import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { schedulerMigrations } from './support/migrations.js';

const STARTED = new Date('2026-09-01T09:12:00.000Z');
const PLANNED = new Date('2026-09-01T09:00:00.000Z');

describeMigration('202611210001_scheduler_index_occurrences', {
  sources: schedulerMigrations,
  before: async ({ connection }) => {
    await connection.repository('scheduleDefinitions').createOne({
      values: {
        id: 'schedule-1',
        appName: 'main',
        key: 'daily',
        sourceType: 'code',
        title: 'Daily',
        definitionHash: 'hash',
        cron: '0 9 * * *',
        timezone: 'UTC',
        enabled: true,
        targetType: 'log',
        targetConfig: {},
        lifecycleState: 'active',
        syncStatus: 'synced',
        createdAt: STARTED,
        updatedAt: STARTED,
      },
    });
    const occurrence = (id: string, scheduledAt: Date | null) => ({
      id,
      scheduleId: 'schedule-1',
      definitionHash: 'hash',
      status: 'succeeded',
      targetType: 'log',
      executionCount: 1,
      scheduledAt,
      startedAt: STARTED,
      lastStartedAt: STARTED,
      createdAt: STARTED,
      updatedAt: STARTED,
    });
    const occurrences = connection.repository('scheduleOccurrences');
    await occurrences.createOne({ values: occurrence('legacy', null) });
    await occurrences.createOne({ values: occurrence('planned', PLANNED) });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('scheduleOccurrences').toHaveIndex([
      'scheduledAt',
      'id',
    ]);
    await expectCollection('scheduleOccurrences').toHaveIndex([
      'scheduleId',
      'scheduledAt',
    ]);
    const occurrences = connection.repository('scheduleOccurrences');
    const planned = async (id: string) =>
      new Date(
        String(
          (
            (await occurrences.findOne({ filter: { id } })) as {
              scheduledAt: Date | string;
            }
          ).scheduledAt,
        ),
      ).toISOString();
    // A record from before planned times were kept takes its start time; one that has a planned time keeps it.
    await expect(planned('legacy')).resolves.toBe(STARTED.toISOString());
    await expect(planned('planned')).resolves.toBe(PLANNED.toISOString());
  },
  down: async ({ expectCollection }) => {
    await expectCollection('scheduleOccurrences').not.toHaveIndex([
      'scheduledAt',
      'id',
    ]);
    await expectCollection('scheduleOccurrences').not.toHaveIndex([
      'scheduleId',
      'scheduledAt',
    ]);
  },
});
