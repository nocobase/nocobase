import { describe, expect, it } from 'vitest';

import { createOriginResolver } from '../../settings.js';
import {
  describeResetSender,
  settingsEnvironment,
} from '../../settings-service.js';

describe('createOriginResolver', () => {
  const originOf = createOriginResolver({
    layers: {
      defaults: { auth: { plugins: [{ id: 'username' }], session: {} } },
      overrides: {
        app: { publicOrigin: 'https://apps.example.com' },
        auth: { session: { expiresIn: 3600 } },
      },
    },
    environmentVariables: {
      APP_PUBLIC_ORIGIN: 'app.publicOrigin',
      AUTH_EMAIL_PASSWORD: 'auth.email.auth.pass',
      AUTH_SECRET: 'auth.secret',
    },
    environment: {
      APP_PUBLIC_ORIGIN: 'https://apps.example.com',
      AUTH_SECRET: '',
    },
  });

  it('names the environment variable that sets a value, ahead of config.yml', () => {
    expect(originOf('app.publicOrigin')).toEqual({
      path: 'app.publicOrigin',
      source: 'env',
      env: 'APP_PUBLIC_ORIGIN',
    });
  });

  it('tells config.yml, code and defaults apart, ignoring empty variables', () => {
    expect(originOf('auth.session.expiresIn').source).toBe('file');
    expect(originOf('auth.plugins').source).toBe('code');
    expect(originOf('auth.session.updateAge').source).toBe('default');
    expect(originOf('auth.secret').source).toBe('default');
  });

  it('counts a variable as set only when the application’s own environment set it, not the host process', () => {
    const previous = process.env.AUTH_SESSION_EXPIRES_IN;
    process.env.AUTH_SESSION_EXPIRES_IN = '60';
    try {
      const originOfApp = createOriginResolver({
        layers: { defaults: {}, overrides: {} },
        ...settingsEnvironment({
          environmentVariableMappings: () => ({
            APP_PUBLIC_ORIGIN: { path: 'app.publicOrigin', type: 'string' },
            AUTH_SESSION_EXPIRES_IN: {
              path: 'auth.session.expiresIn',
              type: 'number',
            },
          }),
          loadedEnvironmentVariables: () => ['APP_PUBLIC_ORIGIN'],
        }),
      });
      expect(originOfApp('app.publicOrigin')).toEqual({
        path: 'app.publicOrigin',
        source: 'env',
        env: 'APP_PUBLIC_ORIGIN',
      });
      expect(originOfApp('auth.session.expiresIn').source).toBe('default');
    } finally {
      if (previous === undefined) delete process.env.AUTH_SESSION_EXPIRES_IN;
      else process.env.AUTH_SESSION_EXPIRES_IN = previous;
    }
  });
});

describe('describeResetSender', () => {
  it('names the sender in the precedence password reset applies, never its credentials', () => {
    expect(
      describeResetSender({ passwordReset: { mailer: 'system' } }, {}),
    ).toEqual({ kind: 'mailer', mailer: 'system' });
    expect(
      describeResetSender(
        {
          email: {
            provider: 'resend',
            apiKey: 'secret',
            from: 'a@example.com',
          },
        },
        {},
      ),
    ).toEqual({ kind: 'inline', provider: 'resend' });
    expect(describeResetSender({}, { defaultMailer: 'system' })).toEqual({
      kind: 'mailer',
      mailer: 'system',
    });
    expect(describeResetSender({}, {})).toEqual({ kind: 'legacyChannel' });
  });
});
