// @vitest-environment node

import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { describe, expect, it } from 'vitest';
import { defineAuthConfig } from '../../config.js';

async function validate(
  overrides: Record<string, unknown>,
  extra?: Parameters<typeof defineAuthConfig>[0]['validate'],
): Promise<{ config: AppConfig; issues: readonly unknown[] }> {
  const config = new AppConfig().load({
    name: 'test',
    read: async () => ({ kind: 'map', value: { auth: overrides } }),
  });
  await config.loadAll();
  const defaults = defaultAppConfigs({
    auth: defineAuthConfig({
      defaults: { emailAndPassword: { enabled: true, autoSignIn: false } },
      ...(extra ? { validate: extra } : {}),
    }),
  });
  config.mergeDefaults(defaults({} as never));
  config.defineSections(defaults.sections!);
  return { config, issues: await config.validate() };
}

describe('defineAuthConfig', () => {
  it('publishes whether password sign-up is open, and nothing else', async () => {
    const { config, issues } = await validate({
      secret: 'a-real-secret',
      emailAndPassword: { disableSignUp: true },
    });

    expect(issues).toEqual([]);
    expect(config.publicValues()).toEqual({
      auth: { emailAndPassword: { enabled: true, disableSignUp: true } },
    });
  });

  it('rejects a sign-up switch that is not a boolean', async () => {
    const { issues } = await validate({
      emailAndPassword: { disableSignUp: 'yes' },
    });

    expect(issues).toEqual([
      {
        level: 'error',
        path: 'auth.emailAndPassword.disableSignUp',
        message: 'must be true or false.',
      },
    ]);
  });

  it('warns about a sign-up switch that password authentication being off overrides', async () => {
    const { issues } = await validate({
      emailAndPassword: { enabled: false, disableSignUp: false },
    });

    expect(issues).toEqual([
      {
        level: 'warning',
        path: 'auth.emailAndPassword.disableSignUp',
        message: 'has no effect while emailAndPassword.enabled is false.',
      },
    ]);
  });

  it('runs an application validator after its own', async () => {
    const { issues } = await validate({}, (_auth, context) => {
      context.error('trustedOrigins', 'must list the portal origin.');
    });

    expect(issues).toEqual([
      {
        level: 'error',
        path: 'auth.trustedOrigins',
        message: 'must list the portal origin.',
      },
    ]);
  });
});

describe('authentication email configuration', () => {
  it('refuses to publish authentication email credentials', () => {
    expect(() =>
      defineAuthConfig({ defaults: {}, public: ['email.apiKey'] }),
    ).toThrow('must remain private');
  });
  it.each([
    [{ provider: 'smtp', port: 587 }, 'auth.email.host'],
    [{ provider: 'smtp', host: 'smtp.test', port: '587' }, 'auth.email.port'],
    [
      { provider: 'smtp', host: 'smtp.test', port: 587, secure: 'false' },
      'auth.email.secure',
    ],
    [
      {
        provider: 'smtp',
        host: 'smtp.test',
        port: 587,
        auth: { user: 'synthetic' },
      },
      'auth.email.auth',
    ],
    [{ provider: 'resend', from: 'sender@example.test' }, 'auth.email.apiKey'],
    [{ provider: 'resend', apiKey: 'synthetic' }, 'auth.email.from'],
    [
      {
        provider: 'smtp',
        host: 'smtp.test',
        port: 587,
        apiKey: 'synthetic-secret',
      },
      'auth.email',
    ],
    [
      {
        provider: 'resend',
        apiKey: 'synthetic',
        from: 'sender@example.test',
        host: 'smtp.test',
      },
      'auth.email',
    ],
    [null, 'auth.email'],
    [{}, 'auth.email.provider'],
  ])(
    'rejects invalid explicit email without falling back: %j',
    async (email, path) => {
      const { issues } = await validate({
        email,
        emailAndPassword: { sendResetPassword: () => undefined },
        passwordReset: { enabled: true, emailChannel: 'legacy' },
      });
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ level: 'error', path }),
        ]),
      );
      expect(JSON.stringify(issues)).not.toContain('synthetic-secret');
    },
  );

  it('loads SMTP entirely from declared environment mappings and keeps secrets private', async () => {
    const { config } = await validate({});
    await config.loadSectionEnvironment({
      AUTH_EMAIL_PROVIDER: 'smtp',
      AUTH_EMAIL_HOST: 'smtp.test',
      AUTH_EMAIL_PORT: '587',
      AUTH_EMAIL_SECURE: 'false',
      AUTH_EMAIL_USER: 'synthetic',
      AUTH_EMAIL_PASSWORD: 'synthetic-password',
      AUTH_EMAIL_FROM: 'sender@example.test',
      AUTH_EMAIL_REPLY_TO: 'support@example.test',
      MAIL_HOST: 'unrelated.test',
    });
    expect(await config.validate()).toEqual([]);
    expect(config.get('auth.email')).toEqual({
      provider: 'smtp',
      host: 'smtp.test',
      port: 587,
      secure: false,
      auth: { user: 'synthetic', pass: 'synthetic-password' },
      from: 'sender@example.test',
      replyTo: 'support@example.test',
    });
    expect(config.environmentVariableMappings()).toMatchObject({
      AUTH_EMAIL_PASSWORD: { path: 'auth.email.auth.pass', secret: true },
      AUTH_EMAIL_API_KEY: { path: 'auth.email.apiKey', secret: true },
      AUTH_EMAIL_PORT: { path: 'auth.email.port', type: 'integer' },
      AUTH_EMAIL_SECURE: { path: 'auth.email.secure', type: 'boolean' },
    });
    expect(config.publicValues()).toEqual({
      auth: { emailAndPassword: { enabled: true } },
    });
  });

  it('loads Resend from environment and reports incomplete configuration by path', async () => {
    const { config } = await validate({});
    await config.loadSectionEnvironment({
      AUTH_EMAIL_PROVIDER: 'resend',
      AUTH_EMAIL_API_KEY: 'synthetic-key',
    });
    expect(await config.validate()).toEqual([
      expect.objectContaining({ path: 'auth.email.from', level: 'error' }),
    ]);
    await config.loadSectionEnvironment({
      AUTH_EMAIL_PROVIDER: 'resend',
      AUTH_EMAIL_API_KEY: 'synthetic-key',
      AUTH_EMAIL_FROM: 'sender@example.test',
    });
    expect(await config.validate()).toEqual([]);
    expect(JSON.stringify(config.publicValues())).not.toContain(
      'synthetic-key',
    );
  });
});
