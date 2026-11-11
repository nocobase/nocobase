import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202611080002_ag_run_failure_params', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveField('failureParams', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('failureParams');
  },
});
