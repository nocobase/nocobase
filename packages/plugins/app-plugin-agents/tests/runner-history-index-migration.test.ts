import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611010003_ag_runner_run_history_index', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveIndex([
      'runnerId',
      'startedAt',
      'id',
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveIndex([
      'runnerId',
      'startedAt',
      'id',
    ]);
  },
});
