import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202611110001_ag_runner_quota_limits', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRunners').toHaveField('quotaLimits', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunners').not.toHaveField('quotaLimits');
  },
});
