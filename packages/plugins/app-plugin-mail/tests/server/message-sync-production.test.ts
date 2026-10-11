import { testId } from '../helpers/test-id.js';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { queueServiceToken } from '@nocobase/app-server/queue';
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
import {
  createMailTestQueue,
  mailQueueBackends,
  type MailTestQueue,
} from '../helpers/queue.js';
import type { QueueAdapter } from '@nocobase/queue';
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
  backend: QueueAdapter,
  listener?: MailMessagesSyncedListener,
  queueService: boolean = true,
) {
  const queue = await createMailTestQueue(backend);
  const container = new ServiceContainer();
  if (queueService) container.instance(queueServiceToken, queue.hostQueue);
  const queueSetup = vi.spyOn(queue.hostQueue, 'setup');
  const queueShutdown = vi.spyOn(queue.hostQueue, 'shutdown');
  const queueConsumer = vi.spyOn(queue.hostQueue, 'consumer');
  const queueProducer = vi.spyOn(queue.hostQueue, 'producer');
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
  class HostQueueProvider extends ServiceProvider<Record<string, never>> {
    public readonly name = 'fixture-host-queue';
    public override start(): Promise<void> {
      return queue.setup();
    }
  }
  if (queueService) lifecycle.add(new HostQueueProvider({}));
  lifecycle.add(provider);
  let cancel: MailUnsubscribe = async () => {};
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
    public override async shutdown(): Promise<void> {
      await cancel();
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
    queue,
    queueSetup,
    queueShutdown,
    queueConsumer,
    queueProducer,
  };
}

describe('production Mail without an application queue service', () => {
  it.each([false, true])(
    'starts and synchronizes while ignoring events (consumer in boot=%s)',
    async (consumerInBoot) => {
      const database = await createMailTestDatabase();
      const listener = vi.fn();
      const result = await fixture(
        database,
        'inMemory',
        consumerInBoot ? listener : undefined,
        false,
      );
      try {
        const store = result.container.resolve(mailStoreToken);
        await store.saveAccount(account);
        const restoredId = testId('no-queue-restored');
        await store.createSyncRun({
          id: restoredId,
          accountId: account.id,
          requestedBy: account.userId,
          mode: 'initial',
          policy: {
            batchSize: 10,
            receivedAfter: account.initialSyncReceivedAfter,
          },
        });
        await result.lifecycle.bootAll();
        await expect(result.lifecycle.startAll()).resolves.toBeUndefined();
        const service = result.container.resolve(mailServiceToken);
        const cancel = service.onMessagesSynced(listener);
        const cancelOther = service.onMessagesSynced(listener);
        await vi.waitFor(
          async () =>
            expect(await store.getSyncRun(restoredId)).toMatchObject({
              status: 'completed',
            }),
          { timeout: 10000 },
        );
        const run = await service.startSync(
          { actorId: account.userId },
          { accountId: account.id },
        );
        await vi.waitFor(
          async () =>
            expect(await store.getSyncRun(run.id)).toMatchObject({
              status: 'completed',
            }),
          { timeout: 10000 },
        );
        const page = await service.listMessages(
          { actorId: account.userId },
          { accountIds: [account.id] },
        );
        expect(page.items.map((item) => item.providerMessageId).sort()).toEqual(
          ['change-1', 'change-2', 'history'],
        );
        expect(result.container.has(queueServiceToken)).toBe(false);
        expect(result.queueSetup).not.toHaveBeenCalled();
        expect(result.queueConsumer).not.toHaveBeenCalled();
        expect(result.queueProducer).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(result.logger.warn).toHaveBeenCalledExactlyOnceWith(
          { event: 'mail.message_sync.queue_unavailable' },
          expect.stringContaining('QueueServiceProvider'),
        );
        expect(result.logger.error).not.toHaveBeenCalled();
        expect(result.topic.publishFor).toHaveBeenCalledWith(account.userId, {
          kind: 'mail.changed',
        });
        await expect(cancel()).resolves.toBeUndefined();
        await expect(cancel()).resolves.toBeUndefined();
        await expect(cancelOther()).resolves.toBeUndefined();
        await expect(result.lifecycle.shutdown()).resolves.toBeUndefined();
        expect(result.topic.close).toHaveBeenCalledOnce();
        expect(result.queueShutdown).not.toHaveBeenCalled();
      } finally {
        await result.lifecycle.shutdown().catch(() => {});
        await result.queue.close();
        await destroyMailTestDatabase(database);
        vi.restoreAllMocks();
      }
    },
  );
});

describe.each(mailQueueBackends)(
  'production Mail public token and queue lifecycle (%s)',
  (backend) => {
    const queues: MailTestQueue[] = [];
    const databases: DatabaseManager[] = [];
    const lifecycles: ServiceProviderRegistry[] = [];
    async function setup(listener?: MailMessagesSyncedListener) {
      const database = await createMailTestDatabase();
      databases.push(database);
      const result = await fixture(database, backend, listener);
      lifecycles.push(result.lifecycle);
      queues.push(result.queue);
      return result;
    }
    afterEach(async () => {
      for (const lifecycle of lifecycles.splice(0))
        await lifecycle.shutdown().catch(() => {});
      for (const queue of queues.splice(0)) await queue.close();
      for (const database of databases.splice(0))
        await destroyMailTestDatabase(database);
      vi.restoreAllMocks();
    });

    it('subscribes in boot before host queue setup and restored sync, with isolated fixture namespaces', async () => {
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
      expect(first.queueSetup).not.toHaveBeenCalled();
      expect(first.queueConsumer).toHaveBeenCalled();
      await first.lifecycle.startAll();
      await second.lifecycle.startAll();
      await vi.waitFor(
        () =>
          expect(received.map((event) => event.phase)).toEqual([
            'history',
            'catchUp',
          ]),
        { timeout: 10000 },
      );
      await service.startSync(
        { actorId: 'owner-1' },
        { accountId: account.id },
      );
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
      expect(new Set(received.map((event) => event.eventId)).size).toBe(3);
      await cancel();
      await cancel();
      await service.startSync(
        { actorId: 'owner-1' },
        { accountId: account.id },
      );
      await vi.waitFor(
        async () =>
          expect(
            (
              await service.listMessages(
                { actorId: account.userId },
                { accountIds: [account.id] },
              )
            ).items,
          ).toHaveLength(4),
        { timeout: 10000 },
      );
      expect(received).toHaveLength(3);
      await first.lifecycle.shutdown();
      expect(first.queueShutdown).not.toHaveBeenCalled();
      await expect(
        first.queue.hostQueue.producer('unrelated').publish('alive', {}),
      ).resolves.toMatchObject({ jobId: expect.any(String) });
    });

    it('closes even uncreated services without resolving them during shutdown', async () => {
      const { container, lifecycle, queueShutdown } = await setup();
      expect(container.resolveIfCreated(mailServiceToken)).toBeUndefined();
      expect(container.resolveIfCreated(mailRuntimeToken)).toBeUndefined();
      await lifecycle.shutdown();
      expect(container.resolveIfCreated(mailServiceToken)).toBeUndefined();
      expect(container.resolveIfCreated(mailRuntimeToken)).toBeUndefined();
      // A late lazy resolution must not create a fresh notifier after Mail closes.
      expect(() => container.resolve(mailServiceToken)).toThrow('closed');
      expect(queueShutdown).not.toHaveBeenCalled();
    });

    it('awaits cooperative subscriber cancellation before completing shutdown', async () => {
      const pending = Promise.withResolvers<void>();
      let signal: AbortSignal | undefined;
      const listener = vi.fn(
        (_event: MailMessagesSyncedEvent, cancellation: AbortSignal) => {
          signal = cancellation;
          return pending.promise;
        },
      );
      const { container, lifecycle, logger, queueShutdown } =
        await setup(listener);
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
      await vi.waitFor(() => expect(listener).toHaveBeenCalledOnce(), {
        timeout: 10000,
      });
      let closed = false;
      const closing = lifecycle.shutdown().then(() => {
        closed = true;
      });
      try {
        await vi.waitFor(() => expect(signal?.aborted).toBe(true));
        expect(closed).toBe(false);
        pending.reject(new Error('private-consumer-data'));
        await closing;
        expect(closed).toBe(true);
        expect(queueShutdown).not.toHaveBeenCalled();
        expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
          'private-consumer-data',
        );
      } finally {
        pending.resolve();
        await closing;
      }
    });

    it('drains the runtime before awaiting subscriptions and closes realtime even when runtime closure fails', async () => {
      const { container, lifecycle, provider, topic, queueShutdown } =
        await setup();
      const service = container.resolve(mailServiceToken);
      const runtime = container.resolve(mailRuntimeToken);
      const pending = Promise.withResolvers<void>();
      let signal: AbortSignal | undefined;
      const listener = vi.fn(
        (_event: MailMessagesSyncedEvent, cancellation: AbortSignal) => {
          signal = cancellation;
          return pending.promise;
        },
      );
      const cancel = service.onMessagesSynced(listener);
      await container.resolve(mailStoreToken).saveAccount(account);
      await lifecycle.bootAll();
      await lifecycle.startAll();
      await service.startSync(
        { actorId: account.userId },
        { accountId: account.id },
      );
      await vi.waitFor(() => expect(listener).toHaveBeenCalledOnce(), {
        timeout: 10000,
      });
      const close = vi
        .spyOn(runtime, 'close')
        .mockImplementationOnce(async () => {
          expect(signal?.aborted).toBe(false);
          throw new Error('shutdown failed');
        });
      let closed = false;
      const closing = provider.shutdown().finally(() => {
        closed = true;
      });
      // Attach a rejection handler immediately while cancellation is still draining.
      const outcome = closing.then(
        () => undefined,
        (error: unknown) => error,
      );
      try {
        await vi.waitFor(() => expect(signal?.aborted).toBe(true));
        expect(closed).toBe(false);
        pending.resolve();
        await expect(outcome).resolves.toMatchObject({
          message: 'shutdown failed',
        });
        expect(topic.close).toHaveBeenCalledOnce();
        expect(queueShutdown).not.toHaveBeenCalled();
        expect(() => service.onMessagesSynced(vi.fn())).toThrow();
        await cancel();
        await cancel();
        close.mockRestore();
        await lifecycle.shutdown();
        expect(topic.close).toHaveBeenCalledOnce();
        expect(queueShutdown).not.toHaveBeenCalled();
      } finally {
        pending.resolve();
        await outcome;
        close.mockRestore();
      }
    });
  },
);
