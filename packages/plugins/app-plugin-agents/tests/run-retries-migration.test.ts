import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610120001_ag_index_run_retries', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveIndex(['retryOfRunId'], {
      unique: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveIndex(['retryOfRunId']);
  },
});
