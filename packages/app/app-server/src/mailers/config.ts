import {
  MailConfigError,
  validateSmtpProviderConfig,
  validateResendProviderConfig,
  type EmailChannelConfig,
} from '@nocobase/mailer/config';
import {
  defineAppConfig,
  envBoolean,
  envInteger,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
  type EnvironmentMapping,
} from '../config/index.js';

/** `default` is a name, never an implicit first entry. */
export interface MailersConfig {
  readonly default?: string;
  readonly [name: string]: EmailChannelConfig | string | undefined;
}

/** Validate one private transport without opening a connection. */
export function assertMailerConfig(
  value: unknown,
  path: string,
): asserts value is EmailChannelConfig {
  const fail = (field: string, message: string): never => {
    throw new Error(`${path}${field ? `.${field}` : ''}: ${message}`);
  };
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('', 'Must be an SMTP or Resend configuration object.');
  const config = value as Record<string, unknown>;
  if (config.provider !== 'smtp' && config.provider !== 'resend')
    fail('provider', 'Must be smtp or resend.');
  const allowed =
    config.provider === 'smtp'
      ? [
          'provider',
          'enabled',
          'host',
          'port',
          'secure',
          'auth',
          'from',
          'replyTo',
        ]
      : ['provider', 'enabled', 'apiKey', 'from', 'replyTo'];
  if (Object.keys(config).some((key) => !allowed.includes(key)))
    fail('', 'Contains unsupported fields for the selected provider.');
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean')
    fail('enabled', 'Must be a boolean.');
  try {
    if (config.provider === 'smtp')
      validateSmtpProviderConfig(
        config as unknown as EmailChannelConfig & { provider: 'smtp' },
      );
    else
      validateResendProviderConfig(
        config as unknown as EmailChannelConfig & { provider: 'resend' },
      );
  } catch (error) {
    if (error instanceof MailConfigError) fail(error.field, error.message);
    fail('', 'Invalid email configuration.');
  }
}

export function assertMailersConfig(config: MailersConfig): void {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new Error('mailers: Must be a configuration object.');
  for (const [name, value] of Object.entries(config)) {
    if (name === 'default') continue;
    // Do not echo arbitrary keys: a mistaken key may itself contain a secret.
    const path = /^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(name)
      ? `mailers.${name}`
      : 'mailers';
    if (path === 'mailers') throw new Error('mailers: Invalid service name.');
    assertMailerConfig(value, path);
  }
  if (config.default !== undefined)
    assertMailerReference(config, config.default, 'mailers.default');
}

export function assertMailerReference(
  config: MailersConfig,
  name: unknown,
  path: string,
): void {
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name !== name.trim() ||
    name === 'default'
  )
    throw new Error(`${path}: Must reference a named mailer.`);
  const selected = Object.hasOwn(config, name) ? config[name] : undefined;
  if (!selected || typeof selected !== 'object' || selected.enabled === false)
    throw new Error(`${path}: Referenced mailer is missing or disabled.`);
  assertMailerConfig(selected, path);
}

export const validateMailersConfig: ConfigValidator<MailersConfig> = (
  config,
  context,
) => {
  try {
    assertMailersConfig(config);
  } catch (error) {
    // All messages here are generated above, never from transport/provider responses.
    context.error(
      '',
      error instanceof Error ? error.message : 'Invalid mailers configuration.',
    );
  }
};

/** Explicit, discoverable mappings; this never scans process.env. */
export function mailerEnvironment(
  name: string,
  prefix: string,
): Readonly<Record<string, EnvironmentMapping>> {
  if (
    !/^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(name) ||
    name === 'default' ||
    !/^[A-Z][A-Z0-9_]*$/u.test(prefix)
  )
    throw new Error('Invalid mailer environment mapping name or prefix.');
  const optional = { required: false };
  return {
    [`${prefix}_PROVIDER`]: envString(`${name}.provider`, optional),
    [`${prefix}_HOST`]: envString(`${name}.host`, optional),
    [`${prefix}_PORT`]: envInteger(`${name}.port`, optional),
    [`${prefix}_SECURE`]: envBoolean(`${name}.secure`, optional),
    [`${prefix}_USER`]: envString(`${name}.auth.user`, optional),
    [`${prefix}_PASSWORD`]: envString(`${name}.auth.pass`, {
      ...optional,
      secret: true,
    }),
    [`${prefix}_API_KEY`]: envString(`${name}.apiKey`, {
      ...optional,
      secret: true,
    }),
    [`${prefix}_FROM`]: envString(`${name}.from`, optional),
    [`${prefix}_REPLY_TO`]: envString(`${name}.replyTo`, optional),
    [`${prefix}_ENABLED`]: envBoolean(`${name}.enabled`, optional),
  };
}

export function defineMailersConfig(
  definition: AppConfigDefinition<MailersConfig> = { defaults: {} },
): AppConfigFactory<MailersConfig> {
  if (definition.public?.length)
    throw new Error('Mailers configuration must remain private.');
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<MailersConfig>[])
        : [definition.validate as ConfigValidator<MailersConfig>];
  return defineAppConfig({
    ...definition,
    env: {
      MAILERS_DEFAULT: envString('default', { required: false }),
      ...definition.env,
    },
    public: [],
    validate: [validateMailersConfig, ...extra],
  });
}
