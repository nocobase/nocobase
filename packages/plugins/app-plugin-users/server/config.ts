import {
  assertMailerReference,
  type MailersConfig,
} from '@nocobase/app-server/mailers/config';
import {
  defineAppConfig,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type EnvironmentMapping,
  type ConfigValidator,
} from '@nocobase/app-server/config';

import type { UsersConfig } from './tokens.js';

export type { InitialAdminConfig, UsersConfig } from './tokens.js';
export {
  describeInvitationEmailChannel,
  type InvitationEmailChannelState,
} from './invitations/channel.js';

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
  const validate: ConfigValidator<UsersConfig> = (config, context) => {
    if (config.invitations?.mailer !== undefined && context.get) {
      try {
        assertMailerReference(
          (context.get('mailers') ?? {}) as MailersConfig,
          config.invitations.mailer,
          'users.invitations.mailer',
        );
      } catch (error) {
        context.error(
          'invitations.mailer',
          error instanceof Error ? error.message : 'Invalid mailer reference.',
        );
      }
    }
    for (const key of ['mailer', 'emailChannel'] as const) {
      const value = config.invitations?.[key];
      if (
        value !== undefined &&
        (typeof value !== 'string' || !value.trim() || value !== value.trim())
      )
        context.error(
          `invitations.${key}`,
          'Must be a non-empty trimmed string.',
        );
    }
  };
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<UsersConfig>[])
        : [definition.validate as ConfigValidator<UsersConfig>];
  return defineAppConfig<UsersConfig>({
    defaults: definition.defaults ?? {},
    validate: [validate, ...extra],
    public: definition.public ?? [],
    env: { ...USERS_ENVIRONMENT, ...definition.env },
  });
}
