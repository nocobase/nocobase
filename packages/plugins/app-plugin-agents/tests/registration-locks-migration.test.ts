import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610260003_ag_create_registration_locks', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveField('revision', {
      nullable: false,
    });
    await expectCollection('agRegistrationLocks').not.toExist();
  },
  up: async ({ expectCollection }) => {
    await expectCollection('agRegistrationLocks').toExist();
    await expectCollection('agRegistrationLocks').toHaveField('id', {
      nullable: false,
    });
    await expectCollection('agRegistrationLocks').toHaveField('updatedAt', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRegistrationLocks').not.toExist();
  },
});
