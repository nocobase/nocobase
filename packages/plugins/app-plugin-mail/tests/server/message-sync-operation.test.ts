import { testId } from '../helpers/test-id.js';
import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailMessageSyncNotifier } from '../../server/message-sync-notifier.js';
import { SyncMailboxOperation } from '../../server/operations/sync-mailbox.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailMessagesSyncedEvent } from '../../server/index.js';
import type {
  MailStore,
  MailSyncStepResult,
} from '../../server/contracts/persistence.js';
import type { MailProviderAdapterResolver } from '../../server/contracts/provider.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const adapters: MailProviderAdapterResolver = {
  resolve: async () => ({
    identity: { name: 'fixture', type: 'fixture' },
    capabilities: { receive: true, incrementalSync: true },
    listChanges: async () => ({
      ok: true,
      value: {
        messages: [
          {
            providerMessageId: 'remote',
            providerFolderIds: [],
            to: [],
            cc: [],
            bcc: [],
            replyTo: [],
            references: [],
            subject: 'Private body not in notification',
            receivedAt: '2000-01-01T00:00:00.000Z',
            read: false,
            starred: false,
            draft: false,
            attachments: [],
          },
        ],
        nextCursor: { value: 'next' },
        hasMore: false,
      },
    }),
  }),
};

describe('sync commit and public listener failure boundaries', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let notifier: MailMessageSyncNotifier;
  let operation: SyncMailboxOperation;
  let service: DefaultMailService;
  const logger = { error: vi.fn() };
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: testId('account'),
      userId: 'owner',
      provider: { name: 'fixture', type: 'fixture' },
      address: 'owner@example.com',
      scopes: [],
      credentialReference: 'secret',
      status: 'active',
    });
    const run = await store.createSyncRun({
      id: testId('run'),
      accountId: testId('account'),
      requestedBy: 'owner',
      mode: 'incremental',
      policy: { batchSize: 10 },
    });
    const claimed = await store.claimSyncRun(
      run.id,
      0,
      'preparing',
      'prepare-lease',
      new Date(Date.now() + 60000).toISOString(),
    );
    await store.commitSyncStep({
      run: claimed!,
      messages: [],
      phase: 'incremental',
      status: 'running',
      createNextTask: true,
    });
    notifier = new MailMessageSyncNotifier(logger);
    operation = new SyncMailboxOperation({
      store,
      adapters,
      messageSyncNotifier: notifier,
      logger,
    });
    service = new DefaultMailService({
      store,
      adapters,
      outbox: { kick() {} },
      messageSyncNotifier: notifier,
    });
    logger.error.mockClear();
  });
  afterEach(async () => {
    notifier.close();
    vi.restoreAllMocks();
    await destroyMailTestDatabase(database);
  });

  it('dispatches committed local IDs even when subsequent readback fails, without awaiting listeners or retrying', async () => {
    const received: MailMessagesSyncedEvent[] = [];
    const read = Promise.withResolvers<void>();
    const release = vi.spyOn(store, 'releaseSyncRun');
    const fail = vi.spyOn(store, 'failSyncRun');
    const commit = store.commitSyncStep.bind(store);
    vi.spyOn(store, 'commitSyncStep').mockImplementationOnce(async (input) => {
      const result = await commit(input);
      vi.spyOn(store, 'getSyncRun').mockRejectedValue(
        new Error('post-commit readback failed'),
      );
      return result;
    });
    service.onMessagesSynced(() => {
      throw new Error('consumer failure');
    });
    service.onMessagesSynced(async (event) => {
      try {
        const detail = await service.getMessage(
          { actorId: 'owner' },
          event.accountId,
          event.messageIds[0]!,
        );
        expect(detail?.providerMessageId).toBe('remote');
        await store.getSyncRun(event.syncRunId);
      } finally {
        read.resolve();
      }
    });
    service.onMessagesSynced(() => new Promise<void>(() => {}));
    service.onMessagesSynced((event) => {
      received.push(event);
    });
    await operation.execute({
      syncRunId: testId('run'),
      expectedPhase: 'incremental',
      expectedRevision: 1,
    });
    await read.promise;
    await Promise.resolve();
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      accountId: testId('account'),
      ownerId: 'owner',
      syncRunId: testId('run'),
      phase: 'incremental',
      messageIds: [expect.any(String)],
    });
    expect(received[0]!.messageIds).not.toContain('remote');
    expect(
      await service.listMessageSyncEvents(
        { actorId: 'owner' },
        { accountId: testId('account') },
      ),
    ).toMatchObject({ items: received });
    expect(release).not.toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(2);
    vi.mocked(store.getSyncRun).mockRestore();
    expect(await store.getSyncRun(testId('run'))).toMatchObject({
      phase: 'completed',
      status: 'completed',
      revision: 2,
      processedMessages: 1,
    });
    await operation.execute({
      syncRunId: testId('run'),
      expectedPhase: 'incremental',
      expectedRevision: 1,
    });
    expect(received).toHaveLength(1);
  });

  it('notifies before inspecting the returned run or logging progress', async () => {
    const received = vi.fn();
    service.onMessagesSynced(received);
    const commit = store.commitSyncStep.bind(store);
    vi.spyOn(store, 'commitSyncStep').mockImplementationOnce(
      async (input): Promise<MailSyncStepResult> => {
        const result = await commit(input);
        // Simulate an error in the first post-commit run inspection (not in the transaction).
        return new Proxy(result, {
          get(target, property, receiver) {
            if (property === 'status') {
              expect(received).toHaveBeenCalledOnce();
              throw new Error('post-commit inspection failed');
            }
            return Reflect.get(target, property, receiver);
          },
        });
      },
    );
    await expect(
      operation.execute({
        syncRunId: testId('run'),
        expectedPhase: 'incremental',
        expectedRevision: 1,
      }),
    ).rejects.toThrow();
    expect(received).toHaveBeenCalledOnce();
    expect(
      (await store.listMessageSyncEvents({ accountId: testId('account') }))
        .items,
    ).toHaveLength(1);
  });

  it('never dispatches a failed commit or its rolled-back candidate insertions', async () => {
    const received = vi.fn();
    service.onMessagesSynced(received);
    const commit = store.commitSyncStep.bind(store);
    vi.spyOn(store, 'commitSyncStep').mockImplementationOnce((input) =>
      commit({ ...input, run: { ...input.run, leaseToken: 'lost-lease' } }),
    );
    await operation.execute({
      syncRunId: testId('run'),
      expectedPhase: 'incremental',
      expectedRevision: 1,
    });
    expect(received).not.toHaveBeenCalled();
    expect(
      (await store.listMessageSyncEvents({ accountId: testId('account') }))
        .items,
    ).toEqual([]);
    expect(
      (
        await service.listMessages(
          { actorId: 'owner' },
          { accountIds: [testId('account')] },
        )
      ).items,
    ).toEqual([]);
  });

  it('publishes a history page before the run finishes, and retains it across an empty page and later failure', async () => {
    await store.cancelSyncRun(testId('run'));
    const created = await store.createSyncRun({
      id: testId('history-run'),
      accountId: testId('account'),
      requestedBy: 'owner',
      mode: 'initial',
      policy: { batchSize: 10, receivedAfter: '2000-01-01T00:00:00.000Z' },
    });
    const claimed = await store.claimSyncRun(
      created.id,
      0,
      'preparing',
      'prepare-history',
      new Date(Date.now() + 60_000).toISOString(),
    );
    if (!claimed) throw new Error('Missing initial-sync lease.');
    await store.commitSyncStep({
      run: claimed,
      messages: [],
      phase: 'history',
      status: 'running',
      createNextTask: false,
    });
    let pages = 0;
    const resolver: MailProviderAdapterResolver = {
      async resolve() {
        const adapter = await adapters.resolve({
          id: testId('account'),
          address: 'owner@example.com',
          provider: { name: 'fixture', type: 'fixture' },
          credentialReference: 'secret',
          userId: 'owner',
          scopes: [],
          status: 'active',
        });
        return {
          ...adapter,
          async listMessages() {
            pages++;
            return {
              ok: true,
              value: {
                messages:
                  pages === 1
                    ? [
                        {
                          providerMessageId: 'historic',
                          subject: 'Historic message',
                          providerFolderIds: [],
                          to: [],
                          cc: [],
                          bcc: [],
                          replyTo: [],
                          references: [],
                          read: false,
                          starred: false,
                          draft: false,
                          attachments: [],
                          contentStatus: 'complete',
                          text: 'Historic body',
                        },
                      ]
                    : [],
                ...(pages === 1
                  ? { nextCursor: 'second', historyReady: false }
                  : {}),
              },
            };
          },
          async listChanges() {
            return {
              ok: false,
              error: {
                code: 'FIXTURE_FAILURE',
                message: 'Later page failed.',
                category: 'configuration',
                retryable: false,
              },
            };
          },
        };
      },
    };
    const realtime = { notify: vi.fn() };
    const historyOperation = new SyncMailboxOperation({
      store,
      adapters: resolver,
      messageSyncNotifier: notifier,
      messageChangeNotifier: realtime,
    });
    const received: MailMessagesSyncedEvent[] = [];
    service.onMessagesSynced((event) => {
      received.push(event);
    });
    await historyOperation.execute({
      syncRunId: created.id,
      expectedPhase: 'history',
      expectedRevision: 1,
    });
    expect(received).toHaveLength(1);
    expect(received[0].phase).toBe('history');
    expect(await store.getSyncRun(created.id)).toMatchObject({
      status: 'running',
      phase: 'history',
      revision: 2,
    });
    expect(
      await service.getMessage(
        { actorId: 'owner' },
        testId('account'),
        received[0].messageIds[0],
      ),
    ).toMatchObject({ text: 'Historic body', contentStatus: 'complete' });
    expect(realtime.notify).toHaveBeenCalledExactlyOnceWith('owner');
    await historyOperation.execute({
      syncRunId: created.id,
      expectedPhase: 'history',
      expectedRevision: 2,
    });
    expect(await store.getSyncRun(created.id)).toMatchObject({
      status: 'running',
      phase: 'catchUp',
      revision: 3,
    });
    expect(received).toHaveLength(1);
    await historyOperation.execute({
      syncRunId: created.id,
      expectedPhase: 'catchUp',
      expectedRevision: 3,
    });
    expect(await store.getSyncRun(created.id)).toMatchObject({
      status: 'failed',
    });
    expect(received).toHaveLength(1);
    expect(realtime.notify).toHaveBeenCalledTimes(1);
    expect(
      (
        await service.listMessageSyncEvents(
          { actorId: 'owner' },
          { accountId: testId('account') },
        )
      ).items,
    ).toEqual(received);
  });
});
