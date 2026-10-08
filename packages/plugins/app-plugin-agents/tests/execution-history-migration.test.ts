// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610080001_ag_add_execution_history', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveField('executionHistory', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('executionHistory');
  },
});
