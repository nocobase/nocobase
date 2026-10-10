import { randomUUID } from 'node:crypto';
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import {
  ApiError,
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  type ApiDocument,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';
import type { Context, Next } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mailApiRoutes } from '../../server/routes/api.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { mailServiceToken } from '../../server/tokens.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';
import type { MailMessageSummary } from '../../shared/mail.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

type FixtureEnv = {
  Variables: {
    auth: { user: { id: string }; session: object };
    authz: { can: (request: { resource: { id: string } }) => Promise<boolean> };
  };
};

interface MessageList {
  data: MailMessageSummary[];
  meta: {
    total: number;
    nextPageToken?: string;
    page?: number;
    pageSize?: number;
  };
}

const TARGET = 'alice@example.com';

function message(
  id: string,
  changes: Partial<NormalizedMailMessage> = {},
): NormalizedMailMessage {
  return {
    providerMessageId: id,
    providerFolderIds: ['inbox'],
    from: { address: TARGET },
    to: [{ address: TARGET }],
    cc: [{ address: TARGET }],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Project update',
    preview: 'Summary',
    receivedAt: '2026-09-20T00:00:00.000Z',
    read: false,
    starred: true,
    draft: false,
    attachments: [],
    ...changes,
  };
}

describe('Mail participant HTTP API in an Application', () => {
  let app: Application;
  let database: DatabaseManager;
  let store: MailStore;
  let service: DefaultMailService;
  let accountId: string;
  let otherAccountId: string;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    accountId = randomUUID();
    otherAccountId = randomUUID();
    for (const [id, userId] of [
      [accountId, 'owner'],
      [otherAccountId, 'other'],
    ]) {
      await store.saveAccount({
        id,
        userId,
        address: `${userId}@elsewhere.com`,
        status: 'active',
        provider: { type: 'test', name: 'test' },
        credentialReference: 'unused',
        scopes: [],
      });
    }
    for (const id of ['first', 'second', 'third'])
      await store.saveMessage(accountId, message(id));
    await store.saveMessage(
      accountId,
      message('subject-only', {
        from: undefined,
        to: [],
        cc: [],
        subject: TARGET,
      }),
    );
    await store.saveMessage(otherAccountId, message('other-owner'));
    service = new DefaultMailService({
      store,
      adapters: {
        resolve: async () => {
          throw new Error('List queries must not call a Provider.');
        },
      },
      outbox: { kick() {} },
    });
    const config = new AppConfig();
    await config.loadAll();
    config.mergeDefaults({
      app: {
        name: 'mail-test',
        publicBasePath: '/',
        publicOrigin: 'http://localhost',
      },
    });
    app = new Application({
      config,
      paths: createAppPaths({ rootDir: '/missing-mail-test-app' }),
    });
    app.container.instance(mailServiceToken, service);
    // Only identity and grants are fixture boundaries. The Application, production Mail route, service, migrations and database are real.
    app.container.instance(authenticationToken, {
      required: () => async (context: Context<FixtureEnv>, next: Next) => {
        const userId = context.req.header('x-test-user');
        if (!userId)
          throw new ApiError({
            status: 'UNAUTHENTICATED',
            reason: 'TEST_UNAUTHENTICATED',
            domain: 'test',
            message: 'Authentication is required.',
          });
        context.set('auth', { user: { id: userId }, session: {} });
        await next();
      },
    } as unknown as Auth);
    app.container.instance(authorizationToken, {
      middleware: () => async (context: Context<FixtureEnv>, next: Next) => {
        context.set('authz', {
          can: async ({ resource }) =>
            context.req.header('x-test-user') === 'admin' ||
            (context.req.header('x-test-user') !== 'denied' &&
              resource.id === 'mail.workspace'),
        });
        await next();
      },
    } as unknown as AppAuthorization);
    app.addRoutes(mailApiRoutes, { owner: '@nocobase/app-plugin-mail' });
    app.registerProviders();
    app.container.resolve(apiDocsToken).addAccess({
      name: 'test-session',
      check: (context) => context.req.header('x-test-user') === 'admin',
    });
    await app.start();
  });

  afterEach(async () => {
    await app?.shutdown();
    await destroyMailTestDatabase(database);
  });

  async function request(
    path: string,
    query: Record<string, string> = {},
    userId: string | null = 'owner',
  ): Promise<Response> {
    const url = new URL(path, 'http://localhost');
    url.search = new URLSearchParams(query).toString();
    return app.fetch(
      new Request(url, { headers: userId ? { 'x-test-user': userId } : {} }),
    );
  }

  async function list(
    path: string,
    query: Record<string, string> = {},
    userId = 'owner',
  ): Promise<MessageList> {
    const response = await request(path, query, userId);
    expect(response.status).toBe(200);
    return (await response.json()) as MessageList;
  }

  it('maps the normal filter through the service while retaining account ownership and totals', async () => {
    const input = { participant: ' ALICE@EXAMPLE.COM ', pageSize: '2' };
    const first = await list('/api/mail/messages', input);
    expect(first.data).toHaveLength(2);
    expect(first.meta.total).toBe(3);
    expect(first.meta.nextPageToken).toBeTruthy();
    const second = await list('/api/mail/messages', {
      ...input,
      pageToken: first.meta.nextPageToken!,
    });
    expect(second.data).toHaveLength(1);
    expect(second.meta).toEqual({ total: 3 });
    expect(
      new Set([...first.data, ...second.data].map((item) => item.id)).size,
    ).toBe(3);
    expect(
      [...first.data, ...second.data].every(
        (item) => item.accountId === accountId,
      ),
    ).toBe(true);
    expect(
      (
        await list('/api/mail/messages', {
          participant: TARGET,
          accountId: otherAccountId,
        })
      ).meta.total,
    ).toBe(0);
    expect(
      (
        await list('/api/mail/messages', { participant: TARGET }, 'other')
      ).data.map((item) => item.providerMessageId),
    ).toEqual(['other-owner']);
    expect(
      (await list('/api/mail/messages', { participant: '@example.com' })).meta
        .total,
    ).toBe(3);
    expect(
      (await list('/api/mail/messages', { q: TARGET })).data.map(
        (item) => item.providerMessageId,
      ),
    ).toEqual(expect.arrayContaining(['subject-only']));
    expect(
      (await list('/api/mail/messages', { q: TARGET, participant: TARGET }))
        .meta.total,
    ).toBe(3);
  });

  it('maps the management filter to numbered pages without expanding the normal endpoint scope', async () => {
    const input = { participant: '@EXAMPLE.COM', pageSize: '2' };
    const first = await list('/api/mail/management/messages', input, 'admin');
    const second = await list(
      '/api/mail/management/messages',
      { ...input, page: '2' },
      'admin',
    );
    expect(first.meta).toEqual({ page: 1, pageSize: 2, total: 4 });
    expect(second.meta).toEqual({ page: 2, pageSize: 2, total: 4 });
    const combined = [...first.data, ...second.data];
    expect(new Set(combined.map((item) => item.id)).size).toBe(4);
    expect(new Set(combined.map((item) => item.accountId))).toEqual(
      new Set([accountId, otherAccountId]),
    );
    expect(
      (
        await list(
          '/api/mail/management/messages',
          {
            participant: TARGET,
            accountId,
            q: 'Project',
            unread: 'true',
            starred: 'true',
          },
          'admin',
        )
      ).meta.total,
    ).toBe(3);
    expect(
      (await list('/api/mail/messages', { participant: TARGET }, 'admin')).meta
        .total,
    ).toBe(0);
  });

  it.each([
    '',
    ' ',
    '@',
    'bad',
    'alice@@example.com',
    '@bad_domain.com',
    'x'.repeat(321),
  ])(
    'answers a field-level INVALID_INPUT for explicit invalid participant (%s)',
    async (participant) => {
      const normal = vi.spyOn(service, 'listMessages');
      const managed = vi.spyOn(service, 'listManagedMessages');
      for (const path of [
        '/api/mail/messages',
        '/api/mail/management/messages',
      ]) {
        const response = await request(path, { participant }, 'admin');
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: {
            code: 400,
            status: 'INVALID_ARGUMENT',
            reason: 'INVALID_INPUT',
            fieldViolations: expect.arrayContaining([
              expect.objectContaining({ field: 'participant' }),
            ]),
          },
        });
      }
      expect(normal).not.toHaveBeenCalled();
      expect(managed).not.toHaveBeenCalled();
    },
  );

  it('rejects anonymous and denied callers before validating participant or querying the store', async () => {
    const normal = vi.spyOn(store, 'listMessages');
    const managed = vi.spyOn(store, 'listAllMessages');
    for (const path of [
      '/api/mail/messages',
      '/api/mail/management/messages',
    ]) {
      const anonymous = await request(path, { participant: '@' }, null);
      expect(anonymous.status).toBe(401);
      expect(await anonymous.json()).toMatchObject({
        error: { status: 'UNAUTHENTICATED' },
      });
      const denied = await request(path, { participant: '@' }, 'denied');
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({
        error: { reason: 'MAIL_ACCESS_DENIED' },
      });
    }
    const ordinary = await request('/api/mail/management/messages', {
      participant: '',
    });
    expect(ordinary.status).toBe(403);
    expect(await ordinary.json()).toMatchObject({
      error: { reason: 'MAIL_ACCESS_DENIED' },
    });
    expect(normal).not.toHaveBeenCalled();
    expect(managed).not.toHaveBeenCalled();
  });

  it('publishes the optional participant contract in the real Application OpenAPI document', async () => {
    const response = await request('/api/swagger', {}, 'admin');
    expect(response.status).toBe(200);
    const document = (await response.json()) as ApiDocument;
    expect(findUndeclaredApiRoutes(app)).toEqual([]);
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    for (const [path, operationId] of [
      ['/api/mail/messages', 'mailListMessages'],
      ['/api/mail/management/messages', 'mailListManagedMessages'],
    ]) {
      const operation = document.paths?.[path]?.get;
      expect(operation?.operationId).toBe(operationId);
      const parameters = operation?.parameters as OpenAPIV3_1.ParameterObject[];
      const participant = parameters.find(
        (parameter) => parameter.name === 'participant',
      );
      expect(participant).toMatchObject({
        name: 'participant',
        in: 'query',
        schema: { type: 'string', maxLength: 320 },
      });
      expect(participant?.required).not.toBe(true);
      expect(participant?.description).toContain('From, To and Cc');
      expect(participant?.description).toContain('excluding subdomains');
      expect(participant?.description).toContain(
        'full thread details remain unchanged',
      );
    }
  });
});
