import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import type { DatabaseManager } from '@nocobase/db';
import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context, type Next } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { exchangeToken as exchangeGmailToken } from '../../server/adapters/gmail/auth.js';
import { responseError as gmailResponseError } from '../../server/adapters/gmail/http.js';
import { classifyError as classifyImapError } from '../../server/adapters/imap-smtp/errors.js';
import { exchangeToken as exchangeMicrosoftToken } from '../../server/adapters/microsoft/auth.js';
import { responseError as microsoftResponseError } from '../../server/adapters/microsoft/http.js';
import { createMailProviderAdapterResolver } from '../../server/adapter-resolver.js';
import { DatabaseMailCredentialVault } from '../../server/credentials.js';
import locales from '../../server/locales/index.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import { mailApiRoutes } from '../../server/routes/api.js';
import { DefaultMailService } from '../../server/service.js';
import {
  assertProviderResult,
  classifyMailProviderError,
  isMailProviderError,
  MailProviderRequestError,
} from '../../server/services/errors.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { mailServiceToken } from '../../server/tokens.js';
import type {
  MailProviderAdapter,
  MailProviderDefinition,
  MailStore,
} from '../../server/types.js';
import type {
  MailAccount,
  MailProviderError,
  MailProviderResult,
  NormalizedMailMessage,
} from '../../shared/mail.js';
import { createMailTestDatabase } from '../helpers/database.js';

function providerError(
  category: MailProviderError['category'],
  retryable: boolean,
  extra: Partial<MailProviderError> = {},
): MailProviderError {
  return {
    code: 'TEST_FAILURE',
    message: 'Private provider details',
    category,
    retryable,
    ...extra,
  };
}

describe('Provider failure classification', () => {
  it.each([
    ['rate_limit', true, 'RATE_LIMITED'],
    ['rate_limit', false, 'RATE_LIMITED'],
    ['network', true, 'UNAVAILABLE'],
    ['timeout', true, 'UNAVAILABLE'],
    ['provider', true, 'UNAVAILABLE'],
    ['authentication', false, 'REAUTHORIZATION_REQUIRED'],
    ['provider', false, 'REJECTED'],
    ['recipient', false, 'REJECTED'],
    ['content', false, 'REJECTED'],
    ['configuration', false, 'REJECTED'],
    ['unknown', false, 'REJECTED'],
  ] as const)(
    'classifies %s (retryable: %s) as %s',
    (category, retryable, kind) => {
      expect(
        classifyMailProviderError(providerError(category, retryable)),
      ).toBe(kind);
    },
  );

  it('throws a typed error that keeps the Provider error fields', () => {
    const failed: MailProviderResult<never> = {
      ok: false,
      error: providerError('rate_limit', true, { retryAfterMs: 1_500 }),
    };
    let thrown: unknown;
    try {
      assertProviderResult(failed);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(MailProviderRequestError);
    expect(isMailProviderError(thrown)).toBe(true);
    expect(thrown).toMatchObject({
      message: 'Private provider details',
      code: 'TEST_FAILURE',
      category: 'rate_limit',
      retryable: true,
      retryAfterMs: 1_500,
      kind: 'RATE_LIMITED',
    });
  });

  it('leaves an unexpected error unclassified', () => {
    expect(isMailProviderError(new TypeError('boom'))).toBe(false);
  });
});

describe('Provider response classification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads Google rate limits and Retry-After', async () => {
    const error = await gmailResponseError(
      'GMAIL',
      Response.json(
        {
          error: {
            message: 'Too many requests',
            errors: [{ reason: 'userRateLimitExceeded' }],
          },
        },
        { status: 403, headers: { 'retry-after': '30' } },
      ),
    );
    expect(error).toMatchObject({
      category: 'rate_limit',
      retryable: true,
      retryAfterMs: 30_000,
      reasonCode: 'gmailUserRateLimitExceeded',
    });
    expect(classifyMailProviderError(error)).toBe('RATE_LIMITED');
  });

  it('treats a Google 5xx as unavailable and a 401 as revoked authorization', async () => {
    const unavailable = await gmailResponseError(
      'GMAIL',
      new Response('Service Unavailable', { status: 503 }),
    );
    expect(classifyMailProviderError(unavailable)).toBe('UNAVAILABLE');
    const revoked = await gmailResponseError(
      'GMAIL',
      Response.json(
        { error: { message: 'Invalid Credentials' } },
        { status: 401 },
      ),
    );
    expect(classifyMailProviderError(revoked)).toBe('REAUTHORIZATION_REQUIRED');
  });

  it('reads a Microsoft Graph Retry-After given as an HTTP date', async () => {
    const retryAt = new Date(Date.now() + 120_000).toUTCString();
    const error = await microsoftResponseError(
      new Response(null, { status: 503, headers: { 'retry-after': retryAt } }),
    );
    expect(error).toMatchObject({ category: 'provider', retryable: true });
    expect(error.retryAfterMs).toBeGreaterThan(100_000);
    expect(classifyMailProviderError(error)).toBe('UNAVAILABLE');
  });

  it.each([
    [
      'Gmail',
      (signal?: AbortSignal) =>
        exchangeGmailToken(
          {
            type: 'gmail',
            name: 'gmail',
            clientId: 'client',
            clientSecret: 'secret',
          },
          { grant_type: 'refresh_token' },
          signal,
        ),
    ],
    [
      'Microsoft',
      (signal?: AbortSignal) =>
        exchangeMicrosoftToken(
          {
            type: 'microsoft',
            name: 'microsoft',
            clientId: 'client',
            clientSecret: 'secret',
          },
          { grant_type: 'refresh_token' },
          signal,
        ),
    ],
  ])(
    'classifies %s token endpoint failures by what they mean for the account',
    async (_provider, exchange) => {
      const fetch = vi.fn<typeof globalThis.fetch>();
      vi.stubGlobal('fetch', fetch);

      fetch.mockResolvedValueOnce(
        Response.json(
          {
            error: 'invalid_grant',
            error_description: 'Token has been expired or revoked.',
          },
          { status: 400 },
        ),
      );
      const revoked = await exchange();
      expect(revoked.ok).toBe(false);
      if (revoked.ok) return;
      expect(revoked.error).toMatchObject({
        category: 'authentication',
        retryable: false,
      });
      expect(classifyMailProviderError(revoked.error)).toBe(
        'REAUTHORIZATION_REQUIRED',
      );

      fetch.mockResolvedValueOnce(
        new Response('<html>Bad gateway</html>', { status: 502 }),
      );
      const unavailable = await exchange();
      if (unavailable.ok) throw new Error('Expected a failure.');
      expect(unavailable.error).toMatchObject({
        category: 'provider',
        retryable: true,
      });
      expect(classifyMailProviderError(unavailable.error)).toBe('UNAVAILABLE');

      fetch.mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { 'retry-after': '5' } }),
      );
      const throttled = await exchange();
      if (throttled.ok) throw new Error('Expected a failure.');
      expect(throttled.error).toMatchObject({
        category: 'rate_limit',
        retryable: true,
        retryAfterMs: 5_000,
      });
    },
  );

  it('classifies IMAP response codes and SMTP replies', () => {
    expect(
      classifyImapError(
        Object.assign(new Error('Command failed'), {
          serverResponseCode: 'THROTTLED',
        }),
        'IMAP_FETCH',
      ),
    ).toMatchObject({ category: 'rate_limit', retryable: true });
    expect(
      classifyImapError(
        Object.assign(new Error('Request is throttled'), {
          code: 'ETHROTTLE',
          throttleReset: 92_415,
        }),
        'IMAP_FETCH',
      ),
    ).toMatchObject({
      category: 'rate_limit',
      retryable: true,
      retryAfterMs: 92_415,
    });
    expect(
      classifyMailProviderError(
        classifyImapError(
          Object.assign(new Error('Command failed'), {
            serverResponseCode: 'UNAVAILABLE',
          }),
          'IMAP_FETCH',
        ),
      ),
    ).toBe('UNAVAILABLE');
    expect(
      classifyImapError(
        Object.assign(new Error('Command failed'), {
          serverResponseCode: 'EXPIRED',
        }),
        'IMAP_FETCH',
      ),
    ).toMatchObject({ category: 'authentication', retryable: false });
    expect(
      classifyImapError(
        Object.assign(new Error('Socket timeout'), { code: 'ETIMEOUT' }),
        'IMAP_FETCH',
      ),
    ).toMatchObject({ category: 'timeout', retryable: true });
    expect(
      classifyImapError(
        Object.assign(new Error('Message failed'), {
          code: 'EMESSAGE',
          responseCode: 421,
          response: '421 4.7.0 Try again later, too many messages',
        }),
        'SMTP_SEND',
      ),
    ).toMatchObject({ category: 'rate_limit', retryable: true });
    const rejected = classifyImapError(
      Object.assign(new Error('Message failed'), {
        code: 'EMESSAGE',
        responseCode: 552,
        response: '552 5.3.4 Message size exceeds fixed limit',
      }),
      'SMTP_SEND',
    );
    expect(rejected).toMatchObject({ category: 'provider', retryable: false });
    expect(classifyMailProviderError(rejected)).toBe('REJECTED');
  });
});

describe('[API] mail routes answer Provider failures', () => {
  const account: MailAccount = {
    id: 'account-1',
    userId: 'alice',
    address: 'alice@example.com',
    provider: { type: 'fixture', name: 'fixture' },
    credentialReference: 'credential',
    scopes: [],
    status: 'active',
  };
  const message: NormalizedMailMessage = {
    providerMessageId: 'remote-1',
    providerFolderIds: [],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Test',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
  let database: DatabaseManager;
  let store: MailStore;
  let router: Hono;
  let messageId: string;
  const connect =
    vi.fn<NonNullable<MailProviderDefinition['connection']>['connect']>();
  const setRead = vi.fn<NonNullable<MailProviderAdapter['setRead']>>();

  beforeEach(async () => {
    connect.mockReset();
    setRead.mockReset();
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount(account);
    messageId = (await store.saveMessage(account.id, message)).id;
    const credentials = new DatabaseMailCredentialVault(database);
    const providerContext = { credentials, publicBasePath: '/test' };
    const registry = createMailProviderRegistry();
    const definition: MailProviderDefinition = {
      type: 'fixture',
      label: 'Fixture mailbox',
      capabilities: {
        receive: true,
        send: true,
        incrementalSync: true,
        pushNotifications: false,
        folders: false,
        labels: false,
        drafts: false,
        moveMessage: false,
        aliases: false,
      },
      connection: { connect },
      async createAdapter(_context, _config, owner) {
        return {
          identity: owner.provider,
          capabilities: definition.capabilities,
          setRead,
        };
      },
    };
    registry.register(definition);
    const adapters = createMailProviderAdapterResolver({
      registry,
      context: providerContext,
      resolveConfig: (owner) => owner.provider,
    });
    const service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick() {} },
      registry,
      providerContext,
      credentials,
      resolveProviderConfig: (provider) => provider,
    });
    const container = new ServiceContainer();
    container.instance(mailServiceToken, service);
    container.instance(authenticationToken, {
      required: () => async (context: Context, next: Next) => {
        context.set('auth', { user: { id: 'alice' }, session: {} });
        await next();
      },
    } as unknown as Auth);
    container.instance(authorizationToken, {
      middleware: () => async (context: Context, next: Next) => {
        context.set('authz', { can: async () => true });
        await next();
      },
    } as unknown as AppAuthorization);
    const config = new AppConfig();
    await config.loadAll();
    config.mergeDefaults({
      app: {
        name: 'test',
        publicOrigin: 'https://mail.test',
        publicBasePath: '/test',
      },
    });
    const contribution = await mailApiRoutes.createRouter({
      appName: 'test',
      publicBasePath: '/test',
      config,
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });
    const i18n = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: ['en-US'],
    });
    i18n.registerNamespace('@nocobase/app-plugin-mail', locales);
    await i18n.init();
    router = new Hono();
    router.use('*', createI18nMiddleware(i18n));
    router.route('/api', contribution);
  });

  afterEach(async () => {
    await database?.destroy();
  });

  function connectAccount(): Promise<Response> {
    return Promise.resolve(
      router.request('/api/mail/accounts/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'fixture',
          name: 'fixture',
          address: 'bob@example.com',
          password: 'secret',
          initialSyncReceivedAfter: '2026-01-01T00:00:00Z',
        }),
      }),
    );
  }

  function markRead(): Promise<Response> {
    return Promise.resolve(
      router.request(`/api/mail/accounts/${account.id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ read: true }),
      }),
    );
  }

  it('answers a throttled Provider with 429 and Retry-After', async () => {
    connect.mockResolvedValue({
      ok: false,
      error: providerError('rate_limit', true, {
        code: 'IMAP_THROTTLED',
        retryAfterMs: 29_100,
      }),
    });
    const response = await connectAccount();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('30');
    const body = (await response.json()) as {
      error: Record<string, unknown>;
    };
    expect(body.error).toMatchObject({
      status: 'RESOURCE_EXHAUSTED',
      reason: 'MAIL_PROVIDER_REQUEST_FAILED',
      domain: 'mail',
      metadata: {
        code: 'IMAP_THROTTLED',
        category: 'rate_limit',
        retryable: true,
        retryAfterMs: 29_100,
        retryAfter: 30,
      },
    });
    expect(JSON.stringify(body)).not.toContain('Private provider details');
  });

  it('answers 429 without Retry-After when the Provider gives no delay', async () => {
    setRead.mockResolvedValue({
      ok: false,
      error: providerError('rate_limit', true),
    });
    const response = await markRead();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeNull();
  });

  it('answers an unreachable or failing Provider with 503', async () => {
    connect.mockResolvedValue({
      ok: false,
      error: providerError('network', true, { code: 'ECONNREFUSED' }),
    });
    const unreachable = await connectAccount();
    expect(unreachable.status).toBe(503);
    expect(await unreachable.json()).toMatchObject({
      error: {
        status: 'UNAVAILABLE',
        reason: 'MAIL_PROVIDER_REQUEST_FAILED',
        domain: 'mail',
        metadata: { code: 'ECONNREFUSED', category: 'network' },
      },
    });

    setRead.mockResolvedValue({
      ok: false,
      error: providerError('provider', true, {
        code: 'GMAIL_HTTP_503',
        retryAfterMs: 10_000,
      }),
    });
    const failing = await markRead();
    expect(failing.status).toBe(503);
    expect(failing.headers.get('retry-after')).toBe('10');
  });

  it('answers revoked authorization with 400 MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED', async () => {
    setRead.mockResolvedValue({
      ok: false,
      error: providerError('authentication', false, {
        code: 'GMAIL_OAUTH_invalid_grant',
      }),
    });
    const response = await markRead();
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED',
        domain: 'mail',
        metadata: { category: 'authentication', retryable: false },
        localizedMessage: {
          message:
            'This mail account must be reconnected before it can be used.',
        },
      },
    });
  });

  it('answers wrong credentials while connecting as invalid input, not as reauthorization', async () => {
    connect.mockResolvedValue({
      ok: false,
      error: providerError('authentication', false, {
        code: 'AUTHENTICATIONFAILED',
      }),
    });
    const response = await connectAccount();
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'MAIL_ACCOUNT_CREDENTIALS_INVALID',
        domain: 'mail',
        fieldViolations: [{ field: 'password' }],
      },
    });
  });

  it('answers any other Provider refusal with 400 MAIL_PROVIDER_REQUEST_FAILED', async () => {
    setRead.mockResolvedValue({
      ok: false,
      error: providerError('provider', false, { code: 'GMAIL_HTTP_400' }),
    });
    const response = await markRead();
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'MAIL_PROVIDER_REQUEST_FAILED',
      },
    });
  });

  it('leaves a genuinely unexpected failure to the opaque 500', async () => {
    setRead.mockRejectedValue(new TypeError('adapter bug'));
    const response = await markRead();
    expect(response.status).toBe(500);
  });
});
