import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610170001_ag_runner_quota', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRunners').toHaveField('quotaUsage', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunners').toHaveField('quotaRevision', {
      type: 'integer',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunners').not.toHaveField('quotaUsage');
    await expectCollection('agRunners').not.toHaveField('quotaRevision');
  },
});
