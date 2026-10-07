import { describe, expect, it } from 'vitest';

import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';

import { defineUsersConfig } from '../server/config.js';

describe('defineUsersConfig', () => {
  it('maps the initial administrator from the environment', async () => {
    const config = new AppConfig();
    await config.loadAll();
    const sections = defaultAppConfigs({
      users: defineUsersConfig({ defaults: { permissionSets: false } }),
    });
    config.mergeDefaults(sections({} as never));
    config.defineSections(sections.sections!);
    await config.loadSectionEnvironment({
      INITIAL_ADMIN_USERNAME: 'owner',
      INITIAL_ADMIN_PASSWORD: 'generated-password',
    });

    expect(config.get('users')).toEqual({
      permissionSets: false,
      initialAdmin: { username: 'owner', password: 'generated-password' },
    });
    expect(config.environmentVariableMappings()).toMatchObject({
      INITIAL_ADMIN_PASSWORD: {
        path: 'users.initialAdmin.password',
        secret: true,
        generate: 'password',
        firstStartOnly: true,
      },
      INITIAL_ADMIN_EMAIL: { firstStartOnly: true, required: false },
    });
  });
});
