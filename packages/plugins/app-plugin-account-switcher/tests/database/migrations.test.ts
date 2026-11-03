import { fileURLToPath } from 'node:url';

import { describeMigration } from '@nocobase/app-testing/server';

const migrations = [
  {
    packageName: '@nocobase/app-plugin-account-switcher',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

describeMigration('202611020001_account_switcher_create_switches', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    const switches = expectCollection('accountSwitches');
    await switches.toHaveField('actorSessionId', {
      type: 'string',
      nullable: false,
      length: 64,
    });
    await switches.toHaveField('expiresAt', {
      type: 'datetime',
      nullable: false,
    });
    await switches.toHaveField('endedAt', { type: 'datetime', nullable: true });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('accountSwitches').not.toExist();
  },
});
