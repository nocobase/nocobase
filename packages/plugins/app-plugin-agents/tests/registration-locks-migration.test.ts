import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610100001_ag_create_registration_locks', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
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
