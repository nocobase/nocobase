import { randomUUID } from 'node:crypto';

import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_MAIL_CONFIG } from '../../server/config.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import { mailApiRoutes } from '../../server/routes/api.js';
import { createMailRuntime } from '../../server/runtime.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { mailServiceToken } from '../../server/tokens.js';
import {
  toManagedSubmissionView,
  toManagedSyncRunView,
} from '../../server/views.js';
import type { MailStore } from '../../server/types.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';

const SUBJECT = 'sentinel-private-subject';
const BODY = 'sentinel-private-body';
const SECRET = 'sentinel-private-client-secret';
const WEBHOOK_SECRET = 'sentinel-private-webhook-secret';
const RECIPIENT = 'sentinel-recipient@example.com';
const REJECTED = 'sentinel-rejected@example.com';

/** A partial SMTP delivery: the failure names whom the server accepted and rejected. */
const PARTIAL_DELIVERY = JSON.stringify({
  code: 'SMTP_RECIPIENTS_REJECTED',
  message: `Rejected ${REJECTED}`,
  category: 'recipient',
  retryable: false,
  recipients: { accepted: [RECIPIENT], rejected: [REJECTED] },
});

describe('[SEC] Mail settings logs, retention and overview', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let service: DefaultMailService;
  const accounts = { alice: randomUUID(), bob: randomUUID() };

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    const registry = createMailProviderRegistry();
    registry.register({
      type: 'fixture',
      label: 'Fixture mail',
      capabilities: { receive: true, send: true, incrementalSync: true },
      async createAdapter() {
        throw new Error('Not used.');
      },
    });
    service = new DefaultMailService({
      store,
      adapters: { resolve: () => Promise.reject(new Error('Not used.')) },
      outbox: { kick() {} },
      registry,
      listProviderConfigs: () => [{ type: 'fixture', name: 'company' }],
    } as unknown as ConstructorParameters<typeof DefaultMailService>[0]);
    for (const [user, id] of Object.entries(accounts))
      await store.saveAccount({
        id,
        userId: user,
        address: `${user}@example.test`,
        status: user === 'bob' ? 'reauthorizationRequired' : 'active',
        provider: { type: 'fixture', name: 'company' },
        credentialReference: 'unused',
        scopes: [],
      });
  });

  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  async function insertRun(
    accountId: string,
    status: string,
    createdAt: string,
    mode: 'initial' | 'incremental' = 'incremental',
    error?: string,
  ): Promise<string> {
    const id = randomUUID();
    await database
      .connection()
      .query.insertInto('mailSyncRuns')
      .values({
        id,
        accountId,
        requestedBy: 'alice',
        mode,
        phase: status === 'running' ? 'incremental' : 'completed',
        status,
        revision: 0,
        policy: JSON.stringify({ batchSize: 100 }),
        processedMessages: 0,
        processedPages: 0,
        ...(error ? { error } : {}),
        createdAt,
        updatedAt: createdAt,
      })
      .execute();
    return id;
  }

  async function insertSubmission(
    accountId: string,
    status: string,
    createdAt: string,
    error?: string,
  ): Promise<string> {
    const id = randomUUID();
    await database
      .connection()
      .query.insertInto('mailSubmissions')
      .values({
        id,
        accountId,
        idempotencyKey: id,
        requestFingerprint: 'fingerprint',
        status,
        requestedBy: 'alice',
        composeInput: JSON.stringify({
          accountId,
          to: [{ address: RECIPIENT }],
          cc: [{ address: 'cc@example.com' }],
          bcc: [],
          subject: SUBJECT,
          text: BODY,
          html: `<p>${BODY}</p>`,
          idempotencyKey: id,
        }),
        ...(error ? { error } : {}),
        createdAt,
        updatedAt: createdAt,
      })
      .execute();
    return id;
  }

  const at = (day: number, hour = 0) =>
    new Date(Date.UTC(2026, 8, day, hour)).toISOString();

  it("filters every member's runs by member, account, status and time, and pages them without gaps or repeats", async () => {
    const ids: string[] = [];
    for (let day = 1; day <= 12; day += 1) {
      ids.push(await insertRun(accounts.alice, 'completed', at(day)));
      // A second run at the same instant: ties are ordered by id, so paging stays stable.
      ids.push(
        await insertRun(
          accounts.bob,
          day % 3 === 0 ? 'failed' : 'completed',
          at(day),
        ),
      );
    }
    const context = { actorId: 'admin' };
    const seen: string[] = [];
    let pageToken: string | undefined;
    do {
      const result = await service.listManagedSyncRunsPage(
        context,
        pageToken,
        10,
      );
      expect(result.total).toBe(24);
      seen.push(...result.items.map((run) => run.id));
      pageToken = result.nextCursor;
    } while (pageToken);
    expect(seen).toHaveLength(24);
    expect(new Set(seen)).toEqual(new Set(ids));

    const bobFailed = await service.listManagedSyncRunsPage(
      context,
      undefined,
      20,
      {
        userId: 'bob',
        statuses: ['failed'],
      },
    );
    expect(bobFailed.total).toBe(4);
    expect(
      bobFailed.items.every(
        (run) => run.accountId === accounts.bob && run.status === 'failed',
      ),
    ).toBe(true);

    const window = await service.listManagedSyncRunsPage(
      context,
      undefined,
      20,
      {
        accountId: accounts.alice,
        createdFrom: at(3),
        createdBefore: at(6),
      },
    );
    expect(window.items.map((run) => run.createdAt)).toEqual([
      at(5),
      at(4),
      at(3),
    ]);
    expect(
      (
        await service.listManagedSyncRunsPage(context, undefined, 20, {
          userId: 'nobody',
        })
      ).total,
    ).toBe(0);
    expect(
      (
        await service.listManagedSyncRunsPage(context, undefined, 20, {
          userId: 'alice',
          accountId: accounts.bob,
        })
      ).total,
    ).toBe(0);
  });

  it('neither repeats nor skips a row when rows are added or cleaned up between two pages', async () => {
    const old = Date.UTC(2026, 0, 1);
    const ids: string[] = [];
    for (let day = 0; day < 6; day += 1)
      ids.push(
        await insertSubmission(
          accounts.alice,
          'accepted',
          new Date(old + day * 24 * 60 * 60_000).toISOString(),
        ),
      );
    const context = { actorId: 'admin' };
    const first = await service.listManagedSubmissionsPage(
      context,
      undefined,
      3,
    );
    expect(first.items.map((item) => item.id)).toEqual(
      [...ids].reverse().slice(0, 3),
    );
    // A new send arrives, and the retention period deletes the oldest finished one, before the next page is read.
    await insertSubmission(
      accounts.alice,
      'accepted',
      new Date().toISOString(),
    );
    expect(
      await store.deleteFinishedSubmissionsBefore(
        new Date(old + 1).toISOString(),
        10,
      ),
    ).toBe(1);
    const second = await service.listManagedSubmissionsPage(
      context,
      first.nextCursor,
      3,
    );
    expect(second.items.map((item) => item.id)).toEqual([ids[2], ids[1]]);
    expect(second.nextCursor).toBeUndefined();
    await expect(
      service.listManagedSyncRunsPage(context, 'not-a-token', 3),
    ).rejects.toMatchObject({ field: 'pageToken' });
  });

  it("marks other members' logs manageable only for a manager", async () => {
    await insertRun(accounts.bob, 'failed', at(1));
    await insertSubmission(accounts.bob, 'failed', at(1));
    const reader = await service.listManagedSubmissionsPage(
      { actorId: 'admin' },
      undefined,
      20,
      {},
      false,
    );
    expect(reader.items[0]).toMatchObject({
      canRetry: false,
      canCancel: false,
      recipientCount: 2,
    });
    const manager = await service.listManagedSubmissionsPage(
      { actorId: 'admin' },
      undefined,
      20,
      {},
      true,
    );
    expect(manager.items[0]).toMatchObject({ canRetry: true, canCancel: true });
    expect(
      (
        await service.listManagedSyncRunsPage(
          { actorId: 'admin' },
          undefined,
          20,
          {},
          false,
        )
      ).items[0].canManage,
    ).toBe(false);
  });

  it("lets a manager cancel and retry another member's submission and run", async () => {
    const submission = await insertSubmission(accounts.alice, 'failed', at(1));
    expect(
      await service.cancelManagedSubmission({ actorId: 'admin' }, submission),
    ).toMatchObject({ id: submission, status: 'cancelled' });
    const run = await insertRun(accounts.alice, 'running', at(2), 'initial');
    expect(
      await service.cancelManagedSyncRun({ actorId: 'admin' }, run),
    ).toMatchObject({ id: run, status: 'cancelled' });
    await expect(
      service.retryManagedSyncRun({ actorId: 'admin' }, run),
    ).resolves.toMatchObject({ accountId: accounts.alice, status: 'pending' });
    // An owner-only call by someone else still cannot find it.
    await expect(
      service.retrySyncRun({ actorId: 'admin' }, run),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_NOT_FOUND' });
    // A member whose authorization lapsed cannot be synchronized for them.
    const lapsed = await insertRun(accounts.bob, 'failed', at(3));
    await expect(
      service.retryManagedSyncRun({ actorId: 'admin' }, lapsed),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_INACTIVE' });
  });

  it("opens a member's message in Team mail without marking it read", async () => {
    const message = await store.saveMessage(accounts.alice, {
      providerMessageId: 'remote-1',
      providerFolderIds: [],
      to: [],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Unread',
      read: false,
      starred: false,
      draft: false,
      attachments: [],
    });
    const opened = await service.getManagedMessage(
      { actorId: 'admin' },
      accounts.alice,
      message.id,
    );
    expect(opened).toMatchObject({ id: message.id, read: false });
    expect(
      await store.getMessage('alice', accounts.alice, message.id),
    ).toMatchObject({ read: false });
    expect(
      (
        await service.listManagedMessages(
          { actorId: 'admin' },
          { withTotal: true },
          'bob',
        )
      ).total,
    ).toBe(0);
    expect(
      (
        await service.listManagedMessages(
          { actorId: 'admin' },
          { withTotal: true },
          'alice',
        )
      ).items.map((item) => item.id),
    ).toEqual([message.id]);
  });

  it('deletes only finished logs older than the retention period, at most a batch at a time', async () => {
    const old = Date.UTC(2026, 0, 1);
    const now = old + 100 * 24 * 60 * 60_000;
    const oldTime = new Date(old).toISOString();
    // Old but unfinished, or finished but recent: never deleted.
    const keep = [
      await insertRun(accounts.alice, 'running', oldTime),
      await insertRun(accounts.alice, 'pending', oldTime),
      await insertSubmission(accounts.alice, 'pending', oldTime),
      await insertSubmission(accounts.alice, 'submitting', oldTime),
      await insertRun(accounts.alice, 'failed', new Date(now).toISOString()),
    ];
    for (let index = 0; index < 3; index += 1) {
      await insertRun(accounts.alice, 'completed', new Date(old).toISOString());
      await insertSubmission(
        accounts.alice,
        'accepted',
        new Date(old).toISOString(),
      );
    }
    const executor = await InlineJobExecutor.ready();
    const runtime = createMailRuntime({
      store,
      adapters: { resolve: () => Promise.reject(new Error('Not used.')) },
      executor,
      logRetentionDays: 90,
    } as unknown as Parameters<typeof createMailRuntime>[0]);
    try {
      expect(await runtime.deleteExpiredLogs(now)).toBe(6);
      // Throttled: a second sweep within the hour deletes nothing even if there were more.
      await insertRun(accounts.alice, 'completed', new Date(old).toISOString());
      expect(await runtime.deleteExpiredLogs(now + 60_000)).toBe(0);
      expect(await runtime.deleteExpiredLogs(now + 60 * 60_000)).toBe(1);
    } finally {
      await runtime.close();
      await executor.shutdown();
    }
    const runs = await store.listAllSyncRuns(undefined, 100);
    const submissions = await store.listAllSubmissions(undefined, 100);
    expect(
      [...runs.items, ...submissions.items].map((row) => row.id).sort(),
    ).toEqual([...keep].sort());
  });

  it('answers the settings lists, actions and the overview without any subject, body, address or secret', async () => {
    // A running run keeps the failure of its last attempt until it ends.
    const run = await insertRun(
      accounts.alice,
      'running',
      at(1),
      'incremental',
      PARTIAL_DELIVERY,
    );
    const submission = await insertSubmission(
      accounts.alice,
      'failed',
      at(1),
      PARTIAL_DELIVERY,
    );
    const container = new ServiceContainer();
    container.instance(mailServiceToken, service);
    container.instance(authenticationToken, {
      required: () => async (context, next) => {
        context.set('auth', { user: { id: 'admin' }, session: {} });
        await next();
      },
    } as Auth);
    container.instance(authorizationToken, {
      middleware: () => async (context, next) => {
        context.set('authz', { can: async () => true });
        await next();
      },
    } as unknown as AppAuthorization);
    const mailConfig = {
      ...DEFAULT_MAIL_CONFIG,
      pushWebhookUrl: 'https://example.test/hooks/mail',
      pushWebhookSecret: WEBHOOK_SECRET,
      providers: {
        company: { type: 'fixture', clientId: 'id', clientSecret: SECRET },
      },
    };
    const contribution = await mailApiRoutes.createRouter({
      appName: 'test',
      publicBasePath: '/main',
      config: {
        get: (key: string) =>
          key === 'mail'
            ? mailConfig
            : { name: 'test', publicOrigin: 'https://mail.example.com' },
        // config.yml sets the retention period to its default value: still configured, not the default.
        layers: () => ({
          defaults: { mail: DEFAULT_MAIL_CONFIG },
          overrides: {
            mail: {
              pushWebhookUrl: mailConfig.pushWebhookUrl,
              pushWebhookSecret: WEBHOOK_SECRET,
              logRetentionDays: 90,
              providers: mailConfig.providers,
            },
          },
        }),
      },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });
    const router = new Hono();
    router.route('/api', contribution);
    const bodies: string[] = [];
    for (const path of [
      '/api/mail/settings/overview',
      '/api/mail/settings/accounts',
      '/api/mail/settings/syncRuns',
      '/api/mail/settings/submissions',
    ]) {
      const response = await router.request(path);
      expect({ path, status: response.status }).toEqual({ path, status: 200 });
      bodies.push(await response.text());
    }
    for (const path of [
      `/api/mail/settings/submissions/${submission}/cancel`,
      `/api/mail/settings/syncRuns/${run}/cancel`,
    ]) {
      const response = await router.request(path, { method: 'POST' });
      expect({ path, status: response.status }).toEqual({ path, status: 200 });
      bodies.push(await response.text());
    }
    expect(bodies[2]).toContain('SMTP_RECIPIENTS_REJECTED');
    expect(bodies[3]).toContain('SMTP_RECIPIENTS_REJECTED');
    // The actions answer through the same views; a run or submission that still has its failure keeps only the code.
    expect(
      toManagedSubmissionView(
        {
          id: submission,
          accountId: accounts.alice,
          status: 'failed',
          error: JSON.parse(PARTIAL_DELIVERY),
        } as unknown as Parameters<typeof toManagedSubmissionView>[0],
        true,
      ).error,
    ).toEqual({
      code: 'SMTP_RECIPIENTS_REJECTED',
      category: 'recipient',
      retryable: false,
    });
    expect(
      toManagedSyncRunView(
        {
          id: run,
          accountId: accounts.alice,
          error: JSON.parse(PARTIAL_DELIVERY),
        } as unknown as Parameters<typeof toManagedSyncRunView>[0],
        true,
      ).error,
    ).toEqual({
      code: 'SMTP_RECIPIENTS_REJECTED',
      category: 'recipient',
      retryable: false,
    });
    for (const secret of [
      SUBJECT,
      BODY,
      RECIPIENT,
      REJECTED,
      SECRET,
      WEBHOOK_SECRET,
    ])
      for (const body of bodies) expect(body).not.toContain(secret);
    const overview = JSON.parse(bodies[0]!) as {
      data: Record<string, unknown>;
    };
    expect(overview.data).toMatchObject({
      providers: [
        {
          name: 'company',
          type: 'fixture',
          source: 'config',
          accountCount: 2,
          attentionCount: 1,
        },
      ],
      accounts: { total: 2, reauthorizationRequired: 1 },
      runtime: {
        oauthCallbackUrl: {
          value: 'https://mail.example.com/main/mail/oauth/callback',
          source: 'default',
        },
        oauthReturnUrl: { value: '/main/me/mail', source: 'default' },
        pushWebhookUrl: {
          value: 'https://example.test/hooks/mail',
          source: 'config',
        },
        pushWebhookSecretConfigured: { value: true, source: 'config' },
        logRetentionDays: { value: 90, source: 'config' },
        syncBatchSize: { value: 100, source: 'default' },
        credentialVault: { value: 'builtin', source: 'default' },
        jobs: { value: null, source: 'default' },
      },
    });
    expect(JSON.parse(bodies[1]!)).toMatchObject({
      data: [
        expect.objectContaining({ userId: 'alice', status: 'active' }),
        expect.objectContaining({
          userId: 'bob',
          status: 'reauthorizationRequired',
        }),
      ],
    });
    expect(JSON.parse(bodies[3]!)).toMatchObject({
      data: [expect.objectContaining({ recipientCount: 2, status: 'failed' })],
    });
  });
});
