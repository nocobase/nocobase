import { describe, expect, it } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };

import {
  DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
  DEFAULT_MAIL_OAUTH_RETURN_PATH,
  DEFAULT_MAIL_CONFIG,
  DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
  resolveMailAutomaticSyncIntervalFromMs,
  resolveMailAutomaticSyncIntervalMinutes,
  resolveMailConfig,
  resolveMailOAuthCallbackPath,
  resolveMailOAuthCallbackUrl,
  resolveMailOAuthOrigin,
  resolveMailOAuthReturnUrl,
  mailEnvironmentMappings,
} from '../../server/config.js';

describe('mail environment variables', () => {
  it('are exported as app-level mappings and match what the package advertises', () => {
    const declared = Object.keys(mailEnvironmentMappings).sort();
    expect(declared).toEqual([
      'MAIL_AUTOMATIC_SYNC_INTERVAL_MS',
      'MAIL_JOBS',
      'MAIL_OAUTH_CALLBACK_URL',
      'MAIL_OAUTH_RETURN_URL',
      'MAIL_PUSH_WEBHOOK_SECRET',
      'MAIL_PUSH_WEBHOOK_URL',
      'MAIL_SYNC_BATCH_SIZE',
    ]);
    expect(
      [...packageMetadata.nocobase.appConfig.environmentVariables].sort(),
    ).toEqual(declared);
  });
});

describe('mail namespace configuration', () => {
  it('falls back to the built-in configuration when the namespace is absent', () => {
    expect(resolveMailConfig(undefined)).toEqual(DEFAULT_MAIL_CONFIG);
  });

  it('merges omitted settings with defaults and preserves provider options', () => {
    expect(
      resolveMailConfig({
        providers: {
          google: {
            type: 'gmail',
            clientId: 'client-id',
            clientSecret: 'client-secret',
          },
        },
      }),
    ).toMatchObject({
      oauthCallbackUrl: DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
      oauthReturnUrl: DEFAULT_MAIL_OAUTH_RETURN_PATH,
      automaticSyncIntervalMs: 300_000,
      syncBatchSize: 100,
      providers: {
        google: {
          type: 'gmail',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
      },
    });
  });

  it('reports malformed namespace and provider configuration paths', () => {
    expect(() => resolveMailConfig(null)).toThrow(
      'Mail configuration at "mail" must be an object',
    );
    expect(() => resolveMailConfig({ providers: null })).toThrow(
      'mail.providers',
    );
    expect(() => resolveMailConfig({ providers: { google: {} } })).toThrow(
      'mail.providers.google',
    );
    expect(() =>
      resolveMailConfig({ automaticSyncIntervalMs: 'five minutes' }),
    ).toThrow('mail.automaticSyncIntervalMs');
    expect(() => resolveMailConfig({ oauthReturnUrl: 42 })).toThrow(
      'mail.oauthReturnUrl',
    );
    expect(() => resolveMailConfig({ jobs: '' })).toThrow('mail.jobs');
    expect(() => resolveMailConfig({ jobs: 1 })).toThrow('mail.jobs');
  });

  it('keeps the jobs configuration name only when one is set', () => {
    expect(resolveMailConfig({})).not.toHaveProperty('jobs');
    expect(resolveMailConfig({ jobs: 'mail' })).toMatchObject({
      jobs: 'mail',
    });
  });
});

describe('mail automatic sync configuration', () => {
  it('uses a five-minute automatic sync default and accepts positive minute values', () => {
    expect(resolveMailAutomaticSyncIntervalMinutes()).toBe(
      DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
    );
    expect(resolveMailAutomaticSyncIntervalMinutes(30)).toBe(30);
    expect(resolveMailAutomaticSyncIntervalFromMs(90_001)).toBe(2);
  });

  it('rejects non-positive or unsafe automatic sync intervals', () => {
    for (const value of [0, -1, 1.5, Number.POSITIVE_INFINITY]) {
      expect(() => resolveMailAutomaticSyncIntervalMinutes(value)).toThrow(
        'Mail automatic sync interval',
      );
    }
    expect(() => resolveMailAutomaticSyncIntervalFromMs(59_999)).toThrow(
      'automaticSyncIntervalMs',
    );
  });
});

describe('mail OAuth callback configuration', () => {
  it('follows localhost when the configured development origin uses 127.0.0.1', () => {
    expect(
      resolveMailOAuthOrigin(
        'http://127.0.0.1:13000',
        'http://localhost:13000',
      ),
    ).toBe('http://localhost:13000');
  });

  it('keeps an explicit origin when the request is not a loopback alias', () => {
    expect(
      resolveMailOAuthOrigin(
        'https://mail.example.com',
        'http://localhost:13000',
      ),
    ).toBe('https://mail.example.com');
  });

  it('uses the default path with the application origin and base path', () => {
    expect(DEFAULT_MAIL_CONFIG).toMatchObject({
      oauthCallbackUrl: DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
    });
    expect(
      resolveMailOAuthCallbackUrl(
        undefined,
        'https://mail.example.com',
        '/main',
      ),
    ).toBe('https://mail.example.com/main/mail/oauth/callback');
    expect(resolveMailOAuthCallbackPath(undefined, '/main')).toBe(
      '/mail/oauth/callback',
    );
    expect(
      resolveMailOAuthReturnUrl(
        undefined,
        'https://mail.example.com',
        '/main',
        'success',
      ),
    ).toBe('/main/dev/mail/accounts?mailAuthorization=success');
  });

  it('resolves a configured return path and preserves its query parameters', () => {
    expect(
      resolveMailOAuthReturnUrl(
        '/mail/accounts?source=oauth',
        'https://mail.example.com',
        '/main',
        'failure',
      ),
    ).toBe('/main/mail/accounts?source=oauth&mailAuthorization=failure');
  });

  it('supports an absolute return URL without requiring the app base path', () => {
    expect(
      resolveMailOAuthReturnUrl(
        'https://portal.example.com/accounts?tab=mail',
        'https://mail.example.com',
        '/main',
        'success',
      ),
    ).toBe(
      'https://portal.example.com/accounts?tab=mail&mailAuthorization=success',
    );
  });

  it('rejects return URL fragments and non-http protocols', () => {
    expect(() =>
      resolveMailOAuthReturnUrl(
        '/mail/accounts#connected',
        'https://mail.example.com',
        '/main',
        'success',
      ),
    ).toThrow('Mail OAuth return URL must not contain a URL fragment');
    expect(() =>
      resolveMailOAuthReturnUrl(
        'javascript:alert(1)',
        'https://mail.example.com',
        '/main',
        'success',
      ),
    ).toThrow('Mail OAuth return URL must use the http or https protocol');
  });

  it('supports an absolute callback URL under the application base path', () => {
    const configuredUrl =
      'https://oauth.example.com/customer/mail/oauth/callback';
    expect(
      resolveMailOAuthCallbackUrl(
        configuredUrl,
        'https://ignored.example.com',
        '/customer',
      ),
    ).toBe(configuredUrl);
    expect(resolveMailOAuthCallbackPath(configuredUrl, '/customer')).toBe(
      '/mail/oauth/callback',
    );
  });

  it('rejects an absolute callback URL outside the application base path', () => {
    expect(() =>
      resolveMailOAuthCallbackPath(
        'https://oauth.example.com/mail/oauth/callback',
        '/customer',
      ),
    ).toThrow('must include application public base path');
  });
});
