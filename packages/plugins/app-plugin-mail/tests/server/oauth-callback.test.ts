import { createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_MAIL_OAUTH_CALLBACK_PATH } from '../../server/config.js';
import { mailOAuthCallbackRoutes } from '../../server/routes/oauth-callback.js';
import { mailServiceToken } from '../../server/tokens.js';
import type { MailService } from '../../server/types.js';
import serverLocales from '../../server/locales/index.js';

describe('Mail OAuth callback route', () => {
  it('is public but requires a valid state value', async () => {
    const completeAuthorization = vi.fn<MailService['completeAuthorization']>(
      async () => ({
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'user@example.com',
        scopes: [],
        status: 'active',
      }),
    );
    const router = await createRouter(service({ completeAuthorization }));

    const missing = await router.request('/mail/oauth/callback');
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({
      error: {
        code: 'MAIL_AUTHORIZATION_STATE_REQUIRED',
        message: 'Mail authorization state is required.',
        ns: '@nocobase/app-plugin-mail',
        key: 'errors.authorizationStateRequired',
        params: {},
      },
    });
    expect(completeAuthorization).not.toHaveBeenCalled();

    const completed = await router.request(
      '/mail/oauth/callback?state=state-1&code=code-1',
    );
    expect(completed.status).toBe(302);
    expect(completed.headers.get('location')).toBe(
      '/test/dev/mail/accounts?mailAuthorization=success',
    );
    expect(completeAuthorization).toHaveBeenCalledWith({
      state: 'state-1',
      code: 'code-1',
    });
  });

  it('redirects Provider callback errors without exposing their details', async () => {
    const router = await createRouter(
      service({
        completeAuthorization: async () => {
          throw new Error('secret token exchange response');
        },
      }),
    );
    const response = await router.request(
      '/mail/oauth/callback?state=state-1&error=access_denied',
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      '/test/dev/mail/accounts?mailAuthorization=failure',
    );
  });

  it('redirects to the configured return URL and preserves its query', async () => {
    const router = await createRouter(
      service({
        completeAuthorization: async () => ({
          id: 'account-1',
          userId: 'user-1',
          provider: { type: 'gmail', name: 'google' },
          address: 'user@example.com',
          scopes: [],
          status: 'active',
        }),
      }),
      DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
      '/mail/accounts?source=oauth',
    );
    const response = await router.request(
      '/mail/oauth/callback?state=state-1&code=code-1',
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      '/test/mail/accounts?source=oauth&mailAuthorization=success',
    );
  });

  it('uses the configured callback path', async () => {
    const completeAuthorization = vi.fn<MailService['completeAuthorization']>(
      async () => ({
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'user@example.com',
        scopes: [],
        status: 'active',
      }),
    );
    const router = await createRouter(
      service({ completeAuthorization }),
      'https://mail.example.com/test/mail/oauth/complete',
    );

    const response = await router.request(
      '/mail/oauth/complete?state=state-1&code=code-1',
    );

    expect(response.status).toBe(302);
    expect(completeAuthorization).toHaveBeenCalledWith({
      state: 'state-1',
      code: 'code-1',
    });
  });
});

async function createRouter(
  mail: MailService,
  oauthCallbackUrl: string = DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
  oauthReturnUrl?: string,
): Promise<Hono> {
  const container = new ServiceContainer();
  container.instance(mailServiceToken, mail);
  const contribution = await mailOAuthCallbackRoutes.createRouter({
    appName: 'test',
    publicBasePath: '/test',
    config: { get: () => ({ oauthCallbackUrl, oauthReturnUrl }) },
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace('@nocobase/app-plugin-mail', serverLocales);
  await runtime.init();
  const router = new Hono();
  router.use('*', createI18nMiddleware(runtime));
  router.route('/', contribution);
  return router;
}

function service(overrides: Partial<MailService> = {}): MailService {
  return {
    listProviders: async () => [],
    startAuthorization: async () => ({
      authorizationUrl: 'https://example.com/authorize',
      state: 'state-1',
    }),
    connectAccount: async () => {
      throw new Error('Not implemented.');
    },
    completeAuthorization: async () => {
      throw new Error('Not implemented.');
    },
    listAccounts: async () => [],
    updateAccount: async () => {
      throw new Error('Not implemented.');
    },
    removeAccount: async () => {},
    listManagedAccounts: async () => [],
    listManagedSyncRunsPage: async () => ({ items: [], total: 0 }),
    listManagedSubmissionsPage: async () => ({ items: [], total: 0 }),
    listFolders: async () => [],
    listLabels: async () => [],
    listIdentities: async () => [],
    listSignatures: async () => [],
    saveSignature: async () => {
      throw new Error('Not implemented.');
    },
    deleteSignature: async () => {},
    createLabel: async () => {
      throw new Error('Not implemented.');
    },
    updateLabel: async () => {
      throw new Error('Not implemented.');
    },
    deleteLabel: async () => {},
    startSync: async () => {
      throw new Error('Not implemented.');
    },
    getSyncRun: async () => undefined,
    listSyncRuns: async () => [],
    listSyncRunsPage: async () => ({ items: [], total: 0 }),
    listSubmissionsPage: async () => ({ items: [], total: 0 }),
    listSubmissions: async () => [],
    listMessages: async () => ({ items: [] }),
    getMessage: async () => undefined,
    getAttachment: async () => ({
      fileName: 'attachment.bin',
      contentType: 'application/octet-stream',
      stream: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    }),
    listConversationMessages: async () => ({ items: [] }),
    sendMessage: async () => {
      throw new Error('Not implemented.');
    },
    saveDraft: async () => {
      throw new Error('Not implemented.');
    },
    updateMessage: async () => {
      throw new Error('Not implemented.');
    },
    moveMessage: async () => {
      throw new Error('Not implemented.');
    },
    deleteMessage: async () => {},
    ...overrides,
  };
}
