import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { LoggingProvider, loggingToken } from '@nocobase/app-server/logging';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailCoreProvider } from '../../server/providers/mail-core.js';
import { DEFAULT_MAIL_CONFIG } from '../../server/config.js';

const loggingProviders: LoggingProvider[] = [];
afterEach(async () => {
  for (const provider of loggingProviders.splice(0)) await provider.shutdown();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function fixture(
  mail: unknown,
  nodeEnv: string | undefined,
  publicBasePath: string,
) {
  const config = new AppConfig();
  config.load({
    name: 'warning-fixture',
    read: async () => ({
      kind: 'map',
      value: {
        app: { name: 'warning-fixture', publicBasePath },
        logging: {
          level: 'warn',
          console: { enabled: false },
          file: { enabled: false },
        },
        ...(mail === undefined ? {} : { mail }),
      },
    }),
  });
  await config.loadAll();
  const app = new Application({
    config,
    nodeEnv,
    paths: createAppPaths({ rootDir: '/missing' }),
  });
  const logging = new LoggingProvider(app);
  logging.register();
  loggingProviders.push(logging);
  const warn = vi.spyOn(
    app.container.resolve(loggingToken).getLogger(),
    'warn',
  );
  return { app, provider: new MailCoreProvider(app), warn };
}

const warning =
  'Mail OAuth return URL points to a development-only page that is excluded from production builds. Configure mail.oauthReturnUrl to an application-owned production account page.';

describe('production OAuth return warning', () => {
  for (const basePath of ['', '/main', '/nested/app']) {
    it.each([
      { oauthReturnUrl: '/dev/mail/accounts' },
      {
        oauthReturnUrl:
          '/dev/mail/accounts/?source=connect&token=private-query',
      },
      {
        oauthReturnUrl: `${basePath}/dev/mail/accounts?mailAuthorization=failure`,
      },
      {
        oauthReturnUrl: `https://mail.example.test${basePath}/dev/mail/accounts?token=private-query`,
      },
    ])(
      `warns once for effective development returns under ${basePath || '/'}: %j`,
      async (mail) => {
        vi.stubEnv('NODE_ENV', 'development');
        const { provider, app, warn } = await fixture(
          mail,
          'production',
          basePath,
        );
        const original = app.config.get('mail');
        await expect(provider.boot()).resolves.toBeUndefined();
        await provider.boot();
        expect(warn.mock.calls.filter((call) => call[1] === warning)).toEqual([
          [{ namespace: 'mail' }, warning],
        ]);
        expect(JSON.stringify(warn.mock.calls)).not.toContain('private-query');
        expect(app.config.get('mail')).toEqual(original);
      },
    );
  }

  it.each([
    undefined,
    {},
    DEFAULT_MAIL_CONFIG,
    { oauthReturnUrl: '' },
    { oauthReturnUrl: '   ' },
    { oauthReturnUrl: '/' },
  ])(
    'does not warn about the current root return default: %j',
    async (mail) => {
      const { provider, warn } = await fixture(mail, 'production', '/main');
      await provider.boot();
      expect(warn.mock.calls.filter((call) => call[1] === warning)).toEqual([]);
    },
  );

  it.each(['development', 'develop', 'test', undefined])(
    'uses application environment rather than ambient production: %s',
    async (nodeEnv) => {
      vi.stubEnv('NODE_ENV', 'production');
      const { provider, warn } = await fixture(
        { oauthReturnUrl: '/dev/mail/accounts' },
        nodeEnv,
        '/main',
      );
      await provider.boot();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it.each([
    '/mail/accounts',
    '/mail/accounts?source=oauth&mailAuthorization=old',
    'https://mail.example.test/main/mail/accounts?token=private-query',
    '/custom/dev/mail/accounts',
    '/mail/accounts/dev',
  ])(
    'does not guess whether a custom production route exists: %s',
    async (oauthReturnUrl) => {
      const { provider, warn } = await fixture(
        { oauthReturnUrl },
        'production',
        '/main',
      );
      await provider.boot();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it.each([
    'https://[invalid',
    '/dev/mail/accounts#fragment',
    'ftp://mail.example.test/dev/mail/accounts',
  ])(
    'does not turn an observability check into URL validation: %s',
    async (oauthReturnUrl) => {
      const { provider, warn } = await fixture(
        { oauthReturnUrl },
        'production',
        '/main',
      );
      await expect(provider.boot()).resolves.toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('warns once through the real application startup lifecycle without preventing startup', async () => {
    // Only mail-engine startup is omitted; the host registration/boot lifecycle and logging are real.
    class BootOnlyMailProvider extends MailCoreProvider {
      public override start(): Promise<void> {
        return Promise.resolve();
      }
    }
    const { app, warn } = await fixture(
      { oauthReturnUrl: '/dev/mail/accounts' },
      'production',
      '/main',
    );
    app.addServiceProvider(BootOnlyMailProvider);
    try {
      await expect(app.start()).resolves.toBeUndefined();
      await app.start();
      expect(warn.mock.calls.filter((call) => call[1] === warning)).toEqual([
        [{ namespace: 'mail' }, warning],
      ]);
    } finally {
      await app.shutdown();
    }
  });

  it('warns independently for each application instance without exposing credentials', async () => {
    const mail = {
      oauthReturnUrl:
        'https://user:private-password@mail.example.test/main/dev/mail/accounts?code=private-code',
      providers: {
        smtp: { type: 'imap', password: 'private-provider-password' },
      },
    };
    const first = await fixture(mail, 'production', '/main');
    const second = await fixture(mail, 'production', '/main');
    await first.provider.boot();
    await second.provider.boot();
    expect(first.warn).toHaveBeenCalledWith({ namespace: 'mail' }, warning);
    expect(second.warn).toHaveBeenCalledWith({ namespace: 'mail' }, warning);
    expect(
      JSON.stringify([first.warn.mock.calls, second.warn.mock.calls]),
    ).not.toContain('private-');
  });
});
