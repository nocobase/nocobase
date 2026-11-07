import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611070001_ag_run_runner_pin', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveField('runnerPinId', {
      type: 'string',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('runnerPinId');
  },
});
