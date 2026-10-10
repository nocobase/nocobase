import { testId } from '../helpers/test-id.js';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  ServiceContainer,
  ServiceProvider,
  ServiceProviderRegistry,
  type ServiceToken,
} from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mailServiceToken,
  type MailMessagesSyncedEvent,
  type MailMessagesSyncedListener,
  type MailUnsubscribe,
  type MailProviderDefinition,
} from '../../server/index.js';
import { MailCoreProvider } from '../../server/providers/mail-core.js';
import {
  mailOutboundAttachmentStorageToken,
  mailProviderRegistryToken,
  mailRuntimeToken,
  mailStoreToken,
} from '../../server/tokens.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';
import type { MailAccount, NormalizedMailMessage } from '../../shared/mail.js';

const account: MailAccount = {
  id: testId('account-1'),
  userId: 'owner-1',
  provider: { type: 'fixture', name: 'fixture' },
  address: 'owner@example.com',
  credentialReference: 'fixture-secret',
  scopes: [],
  status: 'active',
  initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
};
function message(id: string): NormalizedMailMessage {
  return {
    providerMessageId: id,
    providerFolderIds: ['inbox'],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: id,
    receivedAt: '2026-01-02T00:00:00.000Z',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}

async function fixture(
  database: DatabaseManager,
  listener?: MailMessagesSyncedListener,
) {
  const container = new ServiceContainer();
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    mail: { providers: { fixture: { type: 'fixture' } } },
  });
  const executor = new InlineJobExecutor();
  const topic = { publishFor: vi.fn(), close: vi.fn() };
  container.instance(realtimeServiceToken, {
    defineTopic: () => topic,
  } as never);
  const logger = {
    child: () => logger,
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
  container.instance(databaseManagerToken, database);
  container.instance(loggingToken, { getLogger: () => logger } as never);
  container.instance(userAdministrationServiceToken, {} as never);
  container.instance(jobExecutorServiceToken, {
    getJobExecutor: () => executor,
  } as never);
  const resolve = container.resolve.bind(container);
  vi.spyOn(container, 'resolve').mockImplementation(
    <T>(token: ServiceToken<T>): T =>
      token === mailOutboundAttachmentStorageToken ? ({} as T) : resolve(token),
  );
  const provider = new MailCoreProvider({
    appName: 'fixture',
    publicBasePath: '/fixture',
    config,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  const lifecycle = new ServiceProviderRegistry();
  lifecycle.add(provider);
  let cancel: MailUnsubscribe = () => {};
  class ConsumerProvider extends ServiceProvider<{
    container: ServiceContainer;
  }> {
    public readonly name = 'fixture-consumer';
    public override boot(): Promise<void> {
      if (listener)
        cancel = this.app.container
          .resolve(mailServiceToken)
          .onMessagesSynced(listener);
      return Promise.resolve();
    }
    public override shutdown(): Promise<void> {
      cancel();
      return Promise.resolve();
    }
  }
  lifecycle.add(new ConsumerProvider({ container }));
  lifecycle.registerAll();
  let changes = 0;
  const definition: MailProviderDefinition = {
    type: 'fixture',
    label: 'Fixture',
    capabilities: {
      receive: true,
      send: false,
      incrementalSync: true,
      pushNotifications: false,
      folders: true,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    },
    createAdapter: async () => ({
      identity: account.provider,
      capabilities: definition.capabilities,
      getCurrentSyncCursor: async () => ({
        ok: true,
        value: { value: 'baseline' },
      }),
      listFolders: async () => ({
        ok: true,
        value: {
          folders: [
            {
              providerFolderId: 'inbox',
              name: 'Inbox',
              type: 'inbox',
              kind: 'folder',
            },
          ],
          completeProviderFolderIds: ['inbox'],
        },
      }),
      listMessages: async () => ({
        ok: true,
        value: { messages: [message('history')] },
      }),
      listChanges: async () => ({
        ok: true,
        value: {
          messages: [message(`change-${++changes}`)],
          nextCursor: { value: `cursor-${changes}` },
          hasMore: false,
        },
      }),
    }),
  };
  container.resolve(mailProviderRegistryToken).register(definition);
  return {
    container,
    provider,
    lifecycle,
    executor,
    logger,
    topic,
    cancel: () => cancel(),
  };
}

describe('production Mail public token and lifecycle message sync wiring', () => {
  const databases: DatabaseManager[] = [];
  const lifecycles: ServiceProviderRegistry[] = [];
  async function setup(listener?: MailMessagesSyncedListener) {
    const database = await createMailTestDatabase();
    databases.push(database);
    const result = await fixture(database, listener);
    lifecycles.push(result.lifecycle);
    return result;
  }
  afterEach(async () => {
    for (const lifecycle of lifecycles.splice(0))
      await lifecycle.shutdown().catch(() => {});
    for (const database of databases.splice(0))
      await destroyMailTestDatabase(database);
    vi.restoreAllMocks();
  });

  it('registers in consumer boot before start consumes restored tasks, and isolates instances', async () => {
    const received: MailMessagesSyncedEvent[] = [];
    const reads: Promise<unknown>[] = [];
    const other = vi.fn();
    const first = await setup((event) => {
      received.push(event);
      const read = Promise.all(
        event.messageIds.map(async (id) => {
          const detail = await service.getMessage(
            { actorId: 'owner-1' },
            event.accountId,
            id,
          );
          const folders = await service.listFolders(
            { actorId: 'owner-1' },
            event.accountId,
          );
          expect(detail?.folderIds).toContain(
            folders.find((folder) => folder.providerFolderId === 'inbox')
              ?.providerFolderId,
          );
          expect(detail?.id).toBe(id);
        }),
      ).then(() => undefined);
      reads.push(read);
      return read;
    });
    const second = await setup(other);
    const service = first.container.resolve(mailServiceToken);
    const cancel = first.cancel;
    const store = first.container.resolve(mailStoreToken);
    await store.saveAccount(account);
    await store.createSyncRun({
      id: testId('restored'),
      accountId: account.id,
      requestedBy: account.userId,
      mode: 'initial',
      policy: {
        batchSize: 10,
        receivedAfter: account.initialSyncReceivedAfter,
      },
    });
    await first.lifecycle.bootAll();
    await second.lifecycle.bootAll();
    expect(received).toEqual([]);
    await first.lifecycle.startAll();
    await vi.waitFor(
      () =>
        expect(received.map((event) => event.phase)).toEqual([
          'history',
          'catchUp',
        ]),
      { timeout: 10000 },
    );
    await service.startSync({ actorId: 'owner-1' }, { accountId: account.id });
    await vi.waitFor(
      () =>
        expect(received.map((event) => event.phase)).toEqual([
          'history',
          'catchUp',
          'incremental',
        ]),
      { timeout: 10000 },
    );
    await Promise.all(reads);
    expect(other).not.toHaveBeenCalled();
    expect(received).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: account.id,
          ownerId: account.userId,
          syncRunId: testId('restored'),
          messageIds: [expect.any(String)],
        }),
      ]),
    );
    const page = await service.listMessageSyncEvents(
      { actorId: 'owner-1' },
      { accountId: account.id },
    );
    expect(page.items).toEqual(received);
    await expect(
      service.listMessageSyncEvents(
        { actorId: 'another-owner' },
        { accountId: account.id, after: page.checkpoint },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_NOT_FOUND' });
    expect(
      await service.listManagedMessageSyncEvents(
        { actorId: 'admin' },
        { accountId: account.id },
      ),
    ).toEqual(page);
    cancel();
    cancel();
    await service.startSync({ actorId: 'owner-1' }, { accountId: account.id });
    await vi.waitFor(
      async () =>
        expect(
          (await store.listMessageSyncEvents({ accountId: account.id })).items,
        ).toHaveLength(4),
      { timeout: 10000 },
    );
    expect(received).toHaveLength(3);
    await first.lifecycle.shutdown();
  });

  it('closes even uncreated services without resolving them during shutdown', async () => {
    const { container, lifecycle, executor } = await setup();
    expect(container.resolveIfCreated(mailServiceToken)).toBeUndefined();
    expect(container.resolveIfCreated(mailRuntimeToken)).toBeUndefined();
    await lifecycle.shutdown();
    expect(container.resolveIfCreated(mailServiceToken)).toBeUndefined();
    expect(container.resolveIfCreated(mailRuntimeToken)).toBeUndefined();
    // A late lazy service must share the already closed notifier, not create a fresh one.
    const service = container.resolve(mailServiceToken);
    const listener = vi.fn();
    const cancel = service.onMessagesSynced(listener);
    const store = container.resolve(mailStoreToken);
    await store.saveAccount(account);
    await executor.setup();
    await service.startSync(
      { actorId: account.userId },
      { accountId: account.id },
    );
    const runtime = container.resolve(mailRuntimeToken);
    try {
      await runtime.start();
      await vi.waitFor(
        async () =>
          expect(
            (await store.listMessageSyncEvents({ accountId: account.id }))
              .items,
          ).toHaveLength(2),
        { timeout: 10000 },
      );
      expect(listener).not.toHaveBeenCalled();
      cancel();
      cancel();
    } finally {
      await runtime.close();
    }
  });

  it('does not await subscriber tasks on shutdown and safely isolates their late rejection', async () => {
    const pending = Promise.withResolvers<void>();
    const listener = vi.fn(() => pending.promise);
    const { container, lifecycle, logger } = await setup(listener);
    const store = container.resolve(mailStoreToken);
    await store.saveAccount(account);
    await store.createSyncRun({
      id: testId('restored'),
      accountId: account.id,
      requestedBy: account.userId,
      mode: 'initial',
      policy: {
        batchSize: 10,
        receivedAfter: account.initialSyncReceivedAfter,
      },
    });
    await lifecycle.bootAll();
    await lifecycle.startAll();
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(2), {
      timeout: 10000,
    });
    await lifecycle.shutdown();
    pending.reject(new Error('private-consumer-data'));
    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledTimes(2));
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      'private-consumer-data',
    );
  });

  it('rejects runtime closure without retaining listeners or realtime resources', async () => {
    const { container, lifecycle, provider, topic } = await setup();
    const service = container.resolve(mailServiceToken);
    const runtime = container.resolve(mailRuntimeToken);
    const listener = vi.fn(() => new Promise<void>(() => {}));
    const cancel = service.onMessagesSynced(listener);
    await lifecycle.bootAll();
    await lifecycle.startAll();
    const close = vi
      .spyOn(runtime, 'close')
      .mockRejectedValueOnce(new Error('shutdown failed'));
    await expect(provider.shutdown()).rejects.toThrow('shutdown failed');
    expect(topic.close).toHaveBeenCalledOnce();
    const late = vi.fn();
    service.onMessagesSynced(late);
    const store = container.resolve(mailStoreToken);
    await store.saveAccount(account);
    await service.startSync(
      { actorId: account.userId },
      { accountId: account.id },
    );
    await vi.waitFor(
      async () =>
        expect(
          (await store.listMessageSyncEvents({ accountId: account.id })).items,
        ).toHaveLength(2),
      { timeout: 10000 },
    );
    expect(listener).not.toHaveBeenCalled();
    expect(late).not.toHaveBeenCalled();
    cancel();
    cancel();
    close.mockRestore();
    await lifecycle.shutdown();
    expect(topic.close).toHaveBeenCalledOnce();
  });
});
