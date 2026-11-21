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
    for (let page = 0; page < 3; page += 1) {
      const result = await service.listManagedSyncRunsPage(
        context,
        page * 10,
        10,
      );
      expect(result.total).toBe(24);
      seen.push(...result.items.map((run) => run.id));
    }
    expect(seen).toHaveLength(24);
    expect(new Set(seen)).toEqual(new Set(ids));

    const bobFailed = await service.listManagedSyncRunsPage(context, 0, 20, {
      userId: 'bob',
      statuses: ['failed'],
    });
    expect(bobFailed.total).toBe(4);
    expect(
      bobFailed.items.every(
        (run) => run.accountId === accounts.bob && run.status === 'failed',
      ),
    ).toBe(true);

    const window = await service.listManagedSyncRunsPage(context, 0, 20, {
      accountId: accounts.alice,
      createdFrom: at(3),
      createdBefore: at(6),
    });
    expect(window.items.map((run) => run.createdAt)).toEqual([
      at(5),
      at(4),
      at(3),
    ]);
    expect(
      (
        await service.listManagedSyncRunsPage(context, 0, 20, {
          userId: 'nobody',
        })
      ).total,
    ).toBe(0);
    expect(
      (
        await service.listManagedSyncRunsPage(context, 0, 20, {
          userId: 'alice',
          accountId: accounts.bob,
        })
      ).total,
    ).toBe(0);
  });

  it("marks other members' logs manageable only for a manager", async () => {
    await insertRun(accounts.bob, 'failed', at(1));
    await insertSubmission(accounts.bob, 'failed', at(1));
    const reader = await service.listManagedSubmissionsPage(
      { actorId: 'admin' },
      0,
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
      0,
      20,
      {},
      true,
    );
    expect(manager.items[0]).toMatchObject({ canRetry: true, canCancel: true });
    expect(
      (
        await service.listManagedSyncRunsPage(
          { actorId: 'admin' },
          0,
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
    const runs = await store.listAllSyncRuns(0, 100);
    const submissions = await store.listAllSubmissions(0, 100);
    expect(
      [...runs.items, ...submissions.items].map((row) => row.id).sort(),
    ).toEqual([...keep].sort());
  });

  it('answers the settings lists and the overview without any subject, body, address or secret', async () => {
    await insertRun(accounts.alice, 'failed', at(1));
    await insertSubmission(accounts.alice, 'failed', at(1));
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
    for (const secret of [SUBJECT, BODY, RECIPIENT, SECRET, WEBHOOK_SECRET])
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
        pushWebhookUrl: { value: 'https://example.test/hooks/mail' },
        pushWebhookSecretConfigured: { value: true },
        logRetentionDays: { value: 90, source: 'default' },
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
