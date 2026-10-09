import { createApiClient } from '@nocobase/app-client';
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
type FixtureEnv = {
  Variables: {
    auth: { user: { id: string }; session: object };
    authz: { can: (request: { resource: { id: string } }) => Promise<boolean> };
  };
};
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MailClient,
  type MailSubmissionsRequest,
} from '../../client/mail-client.js';
import { createMailProviderAdapterResolver } from '../../server/adapter-resolver.js';
import { DatabaseMailCredentialVault } from '../../server/credentials.js';
import locales from '../../server/locales/index.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import { mailApiRoutes } from '../../server/routes/api.js';
import { createMailRuntime, type MailRuntime } from '../../server/runtime.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { mailServiceToken } from '../../server/tokens.js';
import type {
  MailProviderAdapter,
  MailProviderDefinition,
  MailStore,
  MailSubmissionLogView,
} from '../../server/types.js';
import { createMailTestDatabase } from '../helpers/database.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';

describe('MailClient → HTTP routes → service → database and jobs', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let executor: InlineJobExecutor;
  let runtime: MailRuntime;
  let router: Hono;
  let alice: MailClient;
  let bob: MailClient;
  const send = vi.fn<NonNullable<MailProviderAdapter['sendMessage']>>();

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    send.mockReset().mockResolvedValue({
      status: 'accepted',
      providerMessageId: 'remote-sent',
    });
    const credentials = new DatabaseMailCredentialVault(database);
    const providerContext = { credentials, publicBasePath: '/test' };
    const registry = createMailProviderRegistry();
    const definition: MailProviderDefinition = {
      type: 'fixture',
      label: 'Test mailbox',
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
      connection: {
        async connect(context, _config, input) {
          return {
            ok: true,
            value: {
              address: input.address,
              authorizationSubject: input.address,
              scopes: [],
              credentialReference: await context.credentials.put({
                password: input.password,
              }),
              identities: [
                { address: input.address, isPrimary: true, canSend: true },
              ],
            },
          };
        },
      },
      async createAdapter(_context, _config, account) {
        return {
          identity: account.provider,
          capabilities: definition.capabilities,
          sendMessage: send,
          getCurrentSyncCursor: async () => ({
            ok: true,
            value: { value: 'baseline' },
          }),
          listMessages: async () => ({
            ok: true,
            value: {
              messages: [
                {
                  providerMessageId: 'remote-incoming',
                  internetMessageId: '<incoming@example.com>',
                  providerFolderIds: [],
                  from: { address: 'customer@example.com' },
                  to: [{ address: account.address }],
                  cc: [],
                  bcc: [],
                  replyTo: [],
                  references: [],
                  subject: 'Customer request',
                  text: 'Please reply',
                  receivedAt: new Date().toISOString(),
                  read: false,
                  starred: false,
                  draft: false,
                  attachments: [],
                },
              ],
            },
          }),
          listChanges: async () => ({
            ok: true,
            value: {
              messages: [],
              deletedProviderMessageIds: [],
              nextCursor: { value: 'caught-up' },
              hasMore: false,
            },
          }),
        };
      },
    };
    registry.register(definition);
    const adapters = createMailProviderAdapterResolver({
      registry,
      context: providerContext,
      resolveConfig: (account) => account.provider,
    });
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters,
      executor,
    });
    const service = new DefaultMailService({
      users: {
        async list(input) {
          const items = (input?.userIds ?? []).map((id) => ({
            id,
            name: `${id} name`,
            username: `${id}.username`,
            email: `${id}@private.example.com`,
            emailVerified: true,
            disabledAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          return { items, total: items.length, page: 1, pageSize: 100 };
        },
      },
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
    // Authentication is the fixture boundary; all Mail code below it is real.
    container.instance(authenticationToken, {
      required: () => async (context: Context<FixtureEnv>, next: Next) => {
        const id = context.req.header('x-test-user');
        if (!id) return context.json({ message: 'Unauthorized' }, 401);
        context.set('auth', { user: { id }, session: {} });
        await next();
      },
    } as unknown as Auth);
    container.instance(authorizationToken, {
      middleware: () => async (context: Context<FixtureEnv>, next: Next) => {
        context.set('authz', {
          can: async ({ resource }: { resource: { id: string } }) =>
            resource.id === 'mail.workspace' ||
            context.req.header('x-test-user') === 'admin',
        });
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
    alice = client('alice');
    bob = client('bob');
  });

  afterEach(async () => {
    await runtime?.close();
    await executor?.shutdown();
    await database?.destroy();
  });

  function client(userId: string): MailClient {
    return new MailClient(
      createApiClient({
        baseURL: 'https://mail.test/api',
        headers: { 'x-test-user': userId },
        fetch: async (input, init) => router.request(new Request(input, init)),
      }),
    );
  }

  it('persists bulk logs, retries the original mail once, and cancels queued delivery', async () => {
    const account = await alice.connectAccount({
      type: 'fixture',
      name: 'fixture',
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      address: 'alice@example.com',
      username: 'alice',
      password: 'password',
    });
    const [identity] = await alice.listIdentities(account.id);
    const input = {
      accountId: account.id,
      identityId: identity.id,
      subject: 'Original bulk subject',
      text: 'Original bulk body',
      recipients: [
        { address: 'first@example.com' },
        { address: 'second@example.com' },
      ],
      idempotencyKey: 'bulk-logs',
    };
    const submissions = await alice.sendBulk(input);
    expect(await submissionRows(client('alice'), { bulkOnly: true })).toEqual(
      expect.arrayContaining(
        submissions.map((submission, index) =>
          expect.objectContaining({
            id: submission.id,
            subject: input.subject,
            recipients: [input.recipients[index]],
            canCancel: true,
          }),
        ),
      ),
    );
    expect(await submissionRows(bob, { bulkOnly: true })).toEqual([]);
    await expect(bob.cancelSubmission(submissions[0].id)).rejects.toThrow();
    await expect(bob.retrySubmission(submissions[0].id)).rejects.toThrow();
    await expect(
      router.request(`/api/mail/submissions/${submissions[0].id}/cancel`, {
        method: 'POST',
      }),
    ).resolves.toMatchObject({ status: 401 });
    await expect(
      alice.cancelSubmission(submissions[1].id),
    ).resolves.toMatchObject({ status: 'cancelled', canCancel: false });
    await expect(alice.cancelSubmission(submissions[1].id)).rejects.toThrow();
    send.mockResolvedValueOnce({
      status: 'failed',
      error: {
        code: 'TEMPORARY_FAILURE',
        message: 'Private provider error',
        category: 'provider',
        retryable: true,
      },
    });
    // Make the scheduled outbox due without replacing the real executor or runtime.
    await database
      .query()
      .updateTable('mailOutbox')
      .set({ availableAt: new Date(0).toISOString() })
      .where('type', '=', 'sendScheduledMail')
      .execute();
    for (let step = 0; step < 4; step += 1) await runtime.publishPending();
    expect(send).toHaveBeenCalledTimes(1);
    expect(await submissionRows(alice, { bulkOnly: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: submissions[0].id,
          status: 'failed',
          canRetry: true,
          subject: input.subject,
        }),
      ]),
    );
    const retries = await Promise.allSettled([
      alice.retrySubmission(submissions[0].id),
      alice.retrySubmission(submissions[0].id),
    ]);
    expect(
      retries.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    for (let step = 0; step < 4; step += 1) await runtime.publishPending();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].message).toMatchObject({
      to: [input.recipients[0]],
      subject: input.subject,
      text: input.text,
    });
    expect(await submissionRows(client('alice'), { bulkOnly: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: submissions[0].id,
          status: 'accepted',
          canRetry: false,
          canCancel: false,
          subject: input.subject,
        }),
        expect.objectContaining({ id: submissions[1].id, status: 'cancelled' }),
      ]),
    );
    await expect(alice.retrySubmission(submissions[0].id)).rejects.toThrow();
    await expect(alice.cancelSubmission(submissions[0].id)).rejects.toThrow();
  });

  it('rejects cancellation once a worker claims delivery and forbids retry of an unknown result', async () => {
    const account = await alice.connectAccount({
      type: 'fixture',
      name: 'fixture',
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      address: 'alice@example.com',
      username: 'alice',
      password: 'password',
    });
    const [identity] = await alice.listIdentities(account.id);
    const [submission] = await alice.sendBulk({
      accountId: account.id,
      identityId: identity.id,
      subject: 'Concurrent send',
      text: 'Body',
      recipients: [{ address: 'customer@example.com' }],
      idempotencyKey: 'claimed',
    });
    expect(
      await store.claimSubmission(
        submission.id,
        'lease',
        new Date(Date.now() + 60000).toISOString(),
      ),
    ).toBe(true);
    await expect(alice.cancelSubmission(submission.id)).rejects.toThrow();
    await store.finishSubmission({ ...submission, status: 'unknown' }, 'lease');
    await expect(alice.retrySubmission(submission.id)).rejects.toThrow();
    expect(await submissionRows(alice, { bulkOnly: true })).toEqual([
      expect.objectContaining({
        status: 'unknown',
        canRetry: false,
        canCancel: false,
      }),
    ]);
  });

  it('paginates whole batches and preserves batch identity across actions', async () => {
    const account = await alice.connectAccount({
      type: 'fixture',
      name: 'fixture',
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      address: 'alice@example.com',
      username: 'alice',
      password: 'password',
    });
    const [identity] = await alice.listIdentities(account.id);
    const input = {
      accountId: account.id,
      identityId: identity.id,
      recipients: Array.from({ length: 6 }, (_, index) => ({
        address: `recipient-${index}@example.com`,
      })),
      subject: 'Same subject',
      text: 'Body',
      scheduledAt: '2099-01-01T00:00:00Z',
      idempotencyKey: 'grouped-history',
    };
    for (let index = 0; index < 21; index++) {
      await client('alice').sendBulk({
        ...input,
        idempotencyKey: `grouped-${index}`,
      });
    }
    const first = await submissionRows(client('alice'), {
      bulkOnly: true,
      groupByBatch: true,
    });
    const second = await submissionRows(client('alice'), {
      bulkOnly: true,
      groupByBatch: true,
      page: 2,
    });
    expect(first).toHaveLength(120);
    expect(second).toHaveLength(6);
    const ids = new Set(first.map((row) => row.batchId));
    expect(ids.size).toBe(20);
    expect(ids.has(second[0].batchId)).toBe(false);
    expect(second[0].batchId).toBe(second[1].batchId);
    expect(
      first.every(
        (row) =>
          first.filter((other) => other.batchId === row.batchId).length === 6,
      ),
    ).toBe(true);
    expect(
      await submissionRows(client('bob'), {
        bulkOnly: true,
        groupByBatch: true,
      }),
    ).toEqual([]);
    const cancelled = await client('alice').cancelSubmission(first[0].id);
    expect(cancelled.batchId).toBe(first[0].batchId);
  });

  it('filters bulk history before pagination and rejects invalid offsets', async () => {
    const account = await alice.connectAccount({
      type: 'fixture',
      name: 'fixture',
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      address: 'alice@example.com',
      username: 'alice',
      password: 'password',
    });
    for (let index = 0; index < 102; index += 1) {
      await store.createSubmission(
        { id: `history-${index}`, accountId: account.id, status: 'accepted' },
        index === 101 ? 'single' : `bulk:history:${index}`,
        'fixture',
      );
    }
    const firstPage = await submissionRows(alice, {
      bulkOnly: true,
      pageSize: 100,
    });
    const secondPage = await submissionRows(alice, {
      bulkOnly: true,
      page: 2,
      pageSize: 100,
    });
    expect(firstPage).toHaveLength(100);
    expect(secondPage).toHaveLength(1);
    expect(
      new Set([...firstPage, ...secondPage].map((row) => row.id)).size,
    ).toBe(101);
    expect([...firstPage, ...secondPage].every((row) => row.bulk)).toBe(true);
    await expect(
      alice.listSubmissionsPage({ bulkOnly: true, page: 0 }),
    ).rejects.toMatchObject({ status: 400, reason: 'INVALID_INPUT' });
  });

  it('connects, synchronizes, opens and replies once, then reloads persisted delivery logs', async () => {
    const account = await alice.connectAccount({
      type: 'fixture',
      name: 'fixture',
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      address: 'alice@example.com',
      username: 'alice',
      password: 'private-password',
    });
    expect(account).not.toHaveProperty('credentialReference');
    const runs = (await alice.listSyncRunsPage({ pageSize: 100 })).items;
    expect(runs).toHaveLength(1);
    for (let step = 0; step < 4; step += 1) await runtime.publishPending();
    expect(await alice.getSyncRun(runs[0].id)).toMatchObject({
      status: 'completed',
    });
    const page = await alice.listMessages({ accountId: account.id });
    expect(page.items).toHaveLength(1);
    const message = await alice.getMessage(account.id, page.items[0].id);
    expect(message).toMatchObject({
      subject: 'Customer request',
      text: 'Please reply',
    });
    const identities = await alice.listIdentities(account.id);
    const compose = {
      accountId: account.id,
      identityId: identities[0].id,
      to: [{ address: 'customer@example.com' }],
      subject: 'Re: Customer request',
      text: 'Here is the answer',
      idempotencyKey: 'reply-once',
      inReplyToMessageId: page.items[0].id,
    };
    const first = await alice.sendMessage(compose);
    expect(first).toMatchObject({
      status: 'accepted',
      providerMessageId: 'remote-sent',
    });
    expect(await client('alice').sendMessage(compose)).toEqual(first);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          inReplyTo: '<incoming@example.com>',
          text: 'Here is the answer',
        }),
      }),
    );
    expect(await submissionRows(client('alice'))).toEqual([
      expect.objectContaining({ id: first.id, status: 'accepted' }),
    ]);
    expect(await bob.listAccounts()).toEqual([]);
    await expect(alice.listManagedAccounts()).rejects.toMatchObject({
      status: 403,
      reason: 'MAIL_ACCESS_DENIED',
    });
    const managedAccounts = await client('admin').listManagedAccounts();
    expect(managedAccounts).toEqual([
      expect.objectContaining({ userId: 'alice', ownerName: 'alice.username' }),
    ]);
    expect(JSON.stringify(managedAccounts)).not.toContain(
      'private.example.com',
    );
    expect((await bob.listMessages({})).items).toEqual([]);
    expect(await submissionRows(bob)).toEqual([]);
    // Bob's request names Alice's account: a resource the body refers to that he cannot see.
    await expect(bob.sendMessage(compose)).rejects.toMatchObject({
      status: 400,
      reason: 'MAIL_ACCOUNT_NOT_FOUND',
      domain: 'mail',
    });
    expect(send).toHaveBeenCalledTimes(1);
    await expect(
      alice.sendMessage({ ...compose, text: 'Different content' }),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'MAIL_IDEMPOTENCY_CONFLICT',
    });
    await expect(alice.listManagedSubmissionsPage()).rejects.toMatchObject({
      status: 403,
    });
    expect(await client('admin').listManagedSubmissionsPage()).toMatchObject({
      items: [expect.objectContaining({ id: first.id })],
      total: 1,
    });
  });

  it('persists template CRUD through the real client and prevents forged ownership changes', async () => {
    const bodyOnlyTemplate = await alice.saveTemplate({
      name: 'Body only',
      subject: '',
      text: 'Reusable content',
    });
    expect(bodyOnlyTemplate.subject).toBe('');
    expect(await alice.listTemplates()).toContainEqual(bodyOnlyTemplate);
    await alice.saveTemplate({
      id: bodyOnlyTemplate.id,
      name: 'Body only updated',
      subject: '',
      text: 'Updated content',
    });
    expect(await alice.listTemplates()).toContainEqual(
      expect.objectContaining({
        id: bodyOnlyTemplate.id,
        subject: '',
        text: 'Updated content',
      }),
    );
    await alice.deleteTemplate(bodyOnlyTemplate.id);

    const template = await alice.saveTemplate({
      name: ' Welcome ',
      subject: 'Hello',
      text: 'Original',
    });
    expect(await client('alice').listTemplates()).toEqual([
      expect.objectContaining({ id: template.id, name: 'Welcome' }),
    ]);
    expect(await bob.listTemplates()).toEqual([]);
    await expect(
      bob.saveTemplate({ id: template.id, name: 'Stolen', subject: 'Wrong' }),
    ).rejects.toMatchObject({ status: 404, reason: 'MAIL_TEMPLATE_NOT_FOUND' });
    await expect(bob.deleteTemplate(template.id)).rejects.toMatchObject({
      status: 404,
      reason: 'MAIL_TEMPLATE_NOT_FOUND',
    });
    await alice.saveTemplate({
      id: template.id,
      name: 'Welcome',
      subject: 'Updated',
      html: '<p>New</p>',
    });
    expect(await client('alice').listTemplates()).toEqual([
      expect.objectContaining({
        id: template.id,
        subject: 'Updated',
        html: '<p>New</p>',
      }),
    ]);
    await alice.deleteTemplate(template.id);
    expect(await client('alice').listTemplates()).toEqual([]);
  });
});

/** The rows of one page of the caller's send log, 20 to a page unless the request says otherwise. */
async function submissionRows(
  mail: MailClient,
  request: MailSubmissionsRequest = {},
): Promise<readonly MailSubmissionLogView[]> {
  return (await mail.listSubmissionsPage(request)).items;
}
