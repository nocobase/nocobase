import { describeMigration } from '@nocobase/app-testing/server';

import { schedulerMigrations } from './support/migrations.js';

describeMigration('202611210001_scheduler_index_occurrences', {
  sources: schedulerMigrations,
  up: async ({ expectCollection }) => {
    await expectCollection('scheduleOccurrences').toHaveIndex([
      'startedAt',
      'id',
    ]);
    await expectCollection('scheduleOccurrences').toHaveIndex([
      'scheduleId',
      'startedAt',
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('scheduleOccurrences').not.toHaveIndex([
      'startedAt',
      'id',
    ]);
    await expectCollection('scheduleOccurrences').not.toHaveIndex([
      'scheduleId',
      'startedAt',
    ]);
  },
});
