import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611280001_ag_usage_created_run_index', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRunUsage').toHaveIndex(['createdAt', 'runId']);
    await expectCollection('agRunUsage').toHaveIndex(['runId']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunUsage').not.toHaveIndex([
      'createdAt',
      'runId',
    ]);
    await expectCollection('agRunUsage').toHaveIndex(['runId']);
  },
});
