import { describe, expect, it, vi } from 'vitest';
import {
  AppConfig,
  AppConfigInvalidError,
  buildVariablesManifest,
  envString,
  type AppConfigFactory,
  type ConfigValidator,
} from '@nocobase/app-server/config';
import {
  defineMailChannelsConfig,
  type MailChannelsConfig,
} from '@nocobase/app-plugin-notification-providers/config';

async function snapshot(
  factory: AppConfigFactory<MailChannelsConfig>,
  environment: Record<string, string> = {},
) {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ notification: await factory({} as never) });
  config.defineSections(new Map([['notification', factory.rules!]]));
  await config.loadSectionEnvironment(environment);
  return {
    value: config.get('notification'),
    issues: await config.validate(),
    public: config.publicValues(),
    variables: buildVariablesManifest({
      app: { name: 'synthetic' },
      variables: factory.rules?.env ?? {},
      defaults: {},
    }).variables,
  };
}

describe('notification email configuration migration', () => {
  it.each([
    { type: 'smtp', host: 'localhost', port: 25, auth: { user: 'synthetic' } },
    { provider: 'resend', from: 'synthetic@example.test' },
  ])(
    'applies the default private credentials to system-email: %j',
    async (channel) => {
      const definition = {
        defaults: { channels: { 'system-email': channel } },
      };
      const environment = {
        SMTP_PASSWORD: 'synthetic-password',
        RESEND_API_KEY: 'synthetic-key',
      };
      const current = await snapshot(
        defineMailChannelsConfig(definition),
        environment,
      );
      expect(current.issues).toEqual([]);
      expect(current.public).toEqual({});
      expect(current.value).toMatchObject({
        channels: {
          'system-email': {
            auth: { pass: 'synthetic-password' },
            apiKey: 'synthetic-key',
          },
        },
      });
    },
  );

  it.each([
    {},
    { email: { enabled: false } },
    { email: { type: 'smtp', enabled: false } },
    { email: { type: 'smtp', host: 'localhost', port: 25 } },
    { email: { provider: 'smtp', host: 'localhost', port: 25 } },
    { email: { type: 'smtp', provider: 'smtp', host: 'localhost', port: 25 } },
    { email: { type: 'smtp', host: 'synthetic-secret', port: 'invalid' } },
    {
      email: {
        provider: 'resend',
        from: 'synthetic@example.test',
        apiKey: 'synthetic-key',
      },
    },
    { email: { type: 'resend', from: 'synthetic@example.test' } },
    { email: { type: 'smtp', provider: 'resend', enabled: false } },
    { email: { type: ' smtp ' } },
    { email: { provider: 123 } },
    { email: { provider: 'custom' }, inbox: { type: 'in-app' } },
  ])(
    'preserves aliases, enabled rules, validation and private mappings: %j',
    async (channels) => {
      const definition = { defaults: { channels } };
      const current = await snapshot(defineMailChannelsConfig(definition));
      expect(current.public).toEqual({});
      expect(JSON.stringify(current.issues)).not.toContain('synthetic-secret');
      expect(current.variables).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'SMTP_PASSWORD',
            secret: true,
            required: false,
          }),
          expect.objectContaining({
            name: 'RESEND_API_KEY',
            secret: true,
            required: false,
          }),
        ]),
      );
    },
  );

  it.each([false, true])(
    'preserves custom env overrides and validator order (array=%s)',
    async (array) => {
      const validate = vi.fn<ConfigValidator<MailChannelsConfig>>(
        (_config, context) => context.warning('channels', 'Custom warning.'),
      );
      const definition = {
        defaults: { channels: { email: { type: 'smtp', port: 0 } } },
        env: {
          SMTP_PASSWORD: envString('channels.email.auth.pass', {
            required: true,
            secret: true,
          }),
          CUSTOM_HOST: envString('channels.email.host', { required: false }),
        },
        validate: array ? [validate] : validate,
      };
      const factory = defineMailChannelsConfig(definition);
      const environment = {
        SMTP_PASSWORD: 'synthetic-password',
        CUSTOM_HOST: 'localhost',
      };
      const current = await snapshot(factory, environment);
      expect(validate).toHaveBeenCalledOnce();
      expect(current.issues.map(({ message }) => message)).toEqual([
        'Invalid built-in email channel configuration.',
        'Custom warning.',
      ]);
      expect(current.value).toMatchObject({
        channels: { email: { auth: { pass: 'synthetic-password' } } },
      });
    },
  );

  it('rejects conflicting aliases on reload and keeps the running snapshot', async () => {
    const source = {
      notification: {
        channels: { inbox: { type: 'in-app', provider: 'in-app' } },
      },
    };
    const config = new AppConfig().load({
      name: 'notification-test',
      read: async () => ({ kind: 'map', value: source }),
    });
    await config.loadAll();
    const declaration = defineMailChannelsConfig({
      defaults: { channels: {} },
    });
    config.defineSections(new Map([['notification', declaration.rules!]]));
    source.notification.channels.inbox.provider = 'smtp';
    await expect(config.reload()).rejects.toBeInstanceOf(AppConfigInvalidError);
    expect(config.get('notification.channels.inbox')).toEqual({
      type: 'in-app',
      provider: 'in-app',
    });

    const invalid = new AppConfig().load({
      name: 'notification-invalid',
      read: async () => ({ kind: 'map', value: source }),
    });
    await invalid.loadAll();
    invalid.defineSections(new Map([['notification', declaration.rules!]]));
    expect(invalid.raw()).toEqual(source);
    expect(await invalid.validate()).toEqual([
      {
        level: 'error',
        path: 'notification.channels.inbox',
        message:
          'Channel type and provider must match when both are configured.',
      },
    ]);
  });
});
