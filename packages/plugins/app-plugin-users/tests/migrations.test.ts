import { fileURLToPath } from 'node:url';

import { describeMigration } from '@nocobase/app-testing/server';

const source = (packageName: string, directory: string) => ({
  packageName,
  directory: fileURLToPath(new URL(directory, import.meta.url)),
});

describeMigration('202611110001_user_invitation_locale', {
  sources: [
    source(
      '@nocobase/app-plugin-authentication',
      '../../app-plugin-authentication/database/migrations',
    ),
    source('@nocobase/app-plugin-users', '../database/migrations'),
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('userInvitations').toHaveField('locale', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('userInvitations').not.toHaveField('locale');
    await expectCollection('userInvitations').toHaveField('tokenHash');
  },
});
