import {
  defineAppConfig,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type EnvironmentMapping,
} from '@nocobase/app-server/config';

import type { UsersConfig } from './tokens.js';

export type { InitialAdminConfig, UsersConfig } from './tokens.js';

/**
 * The environment variables that set `users` fields. All three are read once, while the user table is still empty,
 * so a deployment may generate the password and changing any of them later changes nothing.
 */
export const USERS_ENVIRONMENT: Readonly<Record<string, EnvironmentMapping>> = {
  INITIAL_ADMIN_USERNAME: envString('initialAdmin.username', {
    description:
      'The first administrator’s user name, 3–30 letters, digits, underscores or dots; nocobase when unset.',
    required: false,
    firstStartOnly: true,
  }),
  INITIAL_ADMIN_EMAIL: envString('initialAdmin.email', {
    description:
      'The first administrator’s email address; admin@nocobase.com when unset.',
    required: false,
    firstStartOnly: true,
  }),
  INITIAL_ADMIN_PASSWORD: envString('initialAdmin.password', {
    description: 'The first administrator’s password.',
    secret: true,
    generate: 'password',
    firstStartOnly: true,
  }),
};

/**
 * Declares the `users` section with this plugin's environment variables, in place of `defineAppConfig`. Variables
 * given in `env` are added to the plugin's own.
 */
export function defineUsersConfig(
  definition: Partial<AppConfigDefinition<UsersConfig>> = {},
): AppConfigFactory<UsersConfig> {
  return defineAppConfig<UsersConfig>({
    defaults: definition.defaults ?? {},
    ...(definition.validate === undefined
      ? {}
      : { validate: definition.validate }),
    public: definition.public ?? [],
    env: { ...USERS_ENVIRONMENT, ...definition.env },
  });
}
