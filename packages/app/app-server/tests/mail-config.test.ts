import { describe, expect, it, vi } from 'vitest';
import { objectProvider } from '@nocobase/config/providers/object';
import {
  AppConfig,
  defaultAppConfigs,
  envString,
  buildVariablesManifest,
} from '../src/config/index.js';
import {
  defineMailConfig,
  createMailer,
  legacyMailerName,
  MailerProvider,
} from '../src/mailer/index.js';
import { validateMailConfiguration } from '../src/config/mail.js';
import { ServiceContainer } from '@nocobase/service-provider';
import type { AppPluginApplication } from '../src/plugins/index.js';

const smtp = {
  provider: 'smtp',
  host: 'localhost',
  port: 2525,
  from: 'sender@example.test',
};
const resend = {
  provider: 'resend',
  apiKey: 'synthetic-key',
  from: 'sender@example.test',
};

describe('outbound mail configuration', () => {
  it.each([
    {
      mail: { default: smtp },
      auth: { passwordReset: true },
      notification: { channels: { email: { provider: 'email' } } },
    },
    {
      mail: { marketing: resend },
      auth: { passwordReset: { mailer: 'marketing' } },
      notification: {
        channels: { newsletter: { type: 'email', mailer: 'marketing' } },
      },
    },
    { auth: { passwordReset: false } },
    {
      auth: {
        passwordReset: true,
        emailAndPassword: { sendResetPassword: () => {} },
      },
    },
    {
      mail: {
        default: smtp,
        providers: {},
        syncBatchSize: 100,
        oauthReturnUrl: '/',
      },
    },
  ])(
    'accepts valid defaults, explicit references and custom senders',
    (config) => {
      expect(validateMailConfiguration(config)).toEqual([]);
    },
  );

  it.each([
    [{ auth: { passwordReset: true } }, 'auth.passwordReset.mailer'],
    [
      {
        mail: { default: { ...smtp, enabled: false } },
        auth: { passwordReset: {} },
      },
      'auth.passwordReset.mailer',
    ],
    [
      {
        mail: { default: smtp },
        notification: {
          channels: { email: { provider: 'email', mailer: 'missing' } },
        },
      },
      'notification.channels.email.mailer',
    ],
    [
      { mail: { default: { ...smtp, port: 'synthetic-secret' } } },
      'mail.default',
    ],
    [
      {
        auth: {
          passwordReset: { mailer: 'default', emailChannel: 'system-email' },
        },
      },
      'auth.passwordReset',
    ],
    [
      { auth: { passwordReset: { enabled: true, emailChannel: 'missing' } } },
      'auth.passwordReset.emailChannel',
    ],
    [
      {
        notification: {
          channels: { email: { type: 'email', host: 'smtp.example.test' } },
        },
      },
      'notification.channels.email',
    ],
    [{ mail: null }, 'mail'],
  ] as const)(
    'reports a safe path and fix for invalid configuration',
    (config, path) => {
      const errors = validateMailConfiguration(config).filter(
        (issue) => issue.level === 'error',
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ path, fix: expect.any(String) }),
      );
      expect(JSON.stringify(errors)).not.toContain('synthetic-secret');
    },
  );

  it('does not enable legacy recovery from emailChannel alone', () => {
    expect(
      validateMailConfiguration({
        auth: { passwordReset: { emailChannel: 'system-email' } },
      }),
    ).toEqual([expect.objectContaining({ level: 'warning' })]);
  });

  it('keeps legacy and new names separate and emits a single migration warning', async () => {
    const config = {
      mail: { 'system-email': resend },
      auth: { passwordReset: { enabled: true, emailChannel: 'system-email' } },
      notification: { channels: { 'system-email': smtp, second: resend } },
    };
    const issues = validateMailConfiguration(config);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      level: 'warning',
      message: expect.stringContaining('v4.0.0'),
    });
    const mailer = createMailer(config.notification, config.mail);
    expect(mailer.provider?.('system-email')).toBe('resend');
    expect(mailer.provider?.(legacyMailerName('system-email'))).toBe('smtp');
    const appConfig = new AppConfig().load(objectProvider(config));
    await appConfig.loadAll();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await new MailerProvider({
        config: appConfig,
        container: new ServiceContainer(),
      } as AppPluginApplication).boot();
      expect(warning).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('v4.0.0'),
      );
    } finally {
      warning.mockRestore();
    }
  });

  it('parses environment overrides, marks secrets, and publishes no mail settings', async () => {
    const factory = defaultAppConfigs({
      mail: defineMailConfig({
        defaults: {},
        env: {
          MARKETING_API_KEY: envString('marketing.apiKey', {
            secret: true,
            required: false,
          }),
        },
      }),
    });
    const config = new AppConfig().load(
      objectProvider({ mail: { default: smtp } }),
    );
    await config.loadAll();
    config.mergeDefaults(factory({} as never));
    config.defineSections(factory.sections!);
    await config.loadSectionEnvironment({
      MAIL_PORT: '465',
      MAIL_SECURE: 'true',
      MAIL_USER: 'synthetic',
      MAIL_PASSWORD: 'synthetic-secret',
      MARKETING_API_KEY: 'synthetic-key',
      MAIL_PROVIDER: 'smtp',
    });
    expect(config.get('mail.default')).toMatchObject({
      port: 465,
      secure: true,
      auth: { user: 'synthetic', pass: 'synthetic-secret' },
    });
    expect(config.publicValues()).toEqual({});
    const manifest = buildVariablesManifest({
      app: { name: 'synthetic' },
      variables: config.environmentVariableMappings(),
      defaults: {},
    });
    for (const name of ['MAIL_PASSWORD', 'MAIL_API_KEY', 'MARKETING_API_KEY'])
      expect(
        manifest.variables.find((variable) => variable.name === name),
      ).toMatchObject({ secret: true, required: false });
    expect(JSON.stringify(manifest)).not.toContain('synthetic-secret');
  });

  it.each(['MAIL_PORT', 'MAIL_SECURE'])(
    'does not echo invalid typed environment values for %s',
    async (variable) => {
      const config = new AppConfig();
      await config.loadAll();
      const factory = defaultAppConfigs({ mail: defineMailConfig() });
      config.defineSections(factory.sections!);
      let failure: unknown;
      try {
        await config.loadSectionEnvironment({ [variable]: 'synthetic-secret' });
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(Error);
      expect(String(failure)).toContain('mail.default.');
      expect(String(failure)).not.toContain('synthetic-secret');
    },
  );

  it('validates references without section declarations and rejects invalid reloads', async () => {
    const values: Record<string, unknown> = {
      mail: { default: smtp },
      auth: { passwordReset: true },
    };
    const config = new AppConfig().load({
      name: 'mutable',
      read: async () => ({ kind: 'map', value: values }),
    });
    await config.loadAll();
    expect(await config.validate()).toEqual([]);
    values.mail = {};
    await expect(config.reload()).rejects.toThrow('auth.passwordReset.mailer');
    expect(config.get('mail.default')).toEqual(smtp);
  });
});
