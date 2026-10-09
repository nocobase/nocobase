import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { type DatabaseManager } from '@nocobase/db';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import { DefaultMailService } from '../../server/service.js';
import { SyncMailboxOperation } from '../../server/operations/sync-mailbox.js';
import type {
  MailStore,
  MailProviderAdapter,
  NormalizedMailMessage,
} from '../../server/types.js';

let database: DatabaseManager;
let store: MailStore;
const epoch = new Date('2026-09-17T00:00:00Z');
beforeEach(async () => {
  vi.useFakeTimers({ now: epoch, toFake: ['Date'] });
  database = await createMailTestDatabase();
  store = createDatabaseMailStore(database);
  await store.saveAccount({
    id: 'account',
    userId: 'owner',
    address: 'owner@example.com',
    status: 'active',
    provider: { type: 'test', name: 'test' },
    credentialReference: 'credential',
    scopes: [],
    initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
  });
});
afterEach(async () => {
  vi.useRealTimers();
  await destroyMailTestDatabase(database);
});

function message(id: string, subject = id): NormalizedMailMessage {
  return {
    providerMessageId: id,
    subject,
    providerFolderIds: ['inbox'],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}
function adapter(
  overrides: Partial<MailProviderAdapter> = {},
): MailProviderAdapter {
  return {
    identity: { type: 'test', name: 'test' },
    capabilities: {
      receive: true,
      send: false,
      incrementalSync: true,
      pushNotifications: false,
      folders: false,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    },
    getCurrentSyncCursor: async () => ({
      ok: true,
      value: { value: 'baseline' },
    }),
    listMessages: async () => ({ ok: true, value: { messages: [] } }),
    listChanges: async () => ({
      ok: true,
      value: {
        messages: [],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'current' },
        hasMore: false,
      },
    }),
    ...overrides,
  };
}
function service(provider: MailProviderAdapter): DefaultMailService {
  return new DefaultMailService({
    store,
    adapters: { resolve: async () => provider },
    outbox: { kick: vi.fn() },
    syncBatchSize: 100,
  });
}
async function step(provider: MailProviderAdapter): Promise<void> {
  const tasks = await store.claimOutbox(
    new Date().toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    100,
  );
  expect(tasks).toHaveLength(1);
  const task = tasks[0];
  if (task.type !== 'syncMailbox') throw new Error('Expected synchronization');
  await store.markOutboxPublished(
    task.id,
    task.leaseToken!,
    new Date().toISOString(),
  );
  await new SyncMailboxOperation({
    store,
    adapters: { resolve: async () => provider },
  }).execute(task.payload);
}

it('continues beyond the former total limit with bounded pages and durable restart checkpoints', async () => {
  const listMessages = vi
    .fn<NonNullable<MailProviderAdapter['listMessages']>>()
    .mockResolvedValueOnce({
      ok: true,
      value: { messages: [message('first')], nextCursor: 'page-2' },
    })
    .mockResolvedValueOnce({
      ok: true,
      value: { messages: [message('second')] },
    });
  const provider = adapter({ listMessages });
  const run = await service(provider).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  await step(provider);
  await database
    .query()
    .updateTable('mailSyncRuns')
    .set({ processedMessages: 10_000 })
    .where('id', '=', run.id)
    .execute();
  await step(provider);
  store = createDatabaseMailStore(database);
  await step(provider);
  await step(provider);
  await step(provider);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    status: 'completed',
    historyComplete: true,
    processedMessages: 10_002,
  });
  expect(listMessages).toHaveBeenLastCalledWith(
    expect.objectContaining({
      cursor: 'page-2',
      limit: 100,
      receivedAfter: '2026-01-01T00:00:00.000Z',
    }),
  );
});

it('imports new arrivals between history pages and prevents stale history from overwriting them', async () => {
  const provider = adapter({
    listMessages: vi
      .fn<NonNullable<MailProviderAdapter['listMessages']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [message('old')], nextCursor: 'second' },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [message('new', 'stale history')] },
      }),
    listChanges: vi
      .fn<NonNullable<MailProviderAdapter['listChanges']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: {
          messages: [{ ...message('new', 'current'), read: true }],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'live-1' },
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: {
          messages: [],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'live-2' },
          hasMore: false,
        },
      }),
  });
  await service(provider).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  await step(provider);
  await step(provider);
  vi.setSystemTime(new Date(Date.now() + 1_000));
  await step(provider);
  expect((await store.listMessages('owner', {})).items).toHaveLength(2);
  await step(provider);
  await step(provider);
  expect(
    (await store.listMessages('owner', {})).items.find(
      (item) => item.providerMessageId === 'new',
    ),
  ).toMatchObject({ subject: 'current', read: true });
  expect(provider.listChanges).toHaveBeenLastCalledWith(
    expect.objectContaining({ cursor: { value: 'live-1' } }),
  );
});

it('rescans the configured range after expiry and catches arrivals during the recovery scan', async () => {
  const provider = adapter({
    listMessages: vi
      .fn<NonNullable<MailProviderAdapter['listMessages']>>()
      .mockResolvedValueOnce({ ok: true, value: { messages: [] } })
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [message('missed')] },
      }),
    listChanges: vi
      .fn<NonNullable<MailProviderAdapter['listChanges']>>()
      .mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'TEST_SYNC_CURSOR_INVALID',
          category: 'provider',
          message: 'Expired',
          retryable: false,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: {
          messages: [message('during-recovery')],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'recovered' },
          hasMore: false,
        },
      }),
  });
  const run = await service(provider).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  await step(provider);
  await step(provider);
  await step(provider);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    phase: 'preparing',
    recovering: true,
    historyComplete: false,
  });
  expect(provider.listChanges).toHaveBeenCalledTimes(1);
  await step(provider);
  await step(provider);
  await step(provider);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    status: 'completed',
    recovering: false,
  });
  expect(
    (await store.listMessages('owner', {})).items
      .map((item) => item.providerMessageId)
      .sort(),
  ).toEqual(['during-recovery', 'missed']);
  expect(provider.listMessages).toHaveBeenLastCalledWith(
    expect.objectContaining({
      receivedAfter: '2026-01-01T00:00:00.000Z',
      cursor: undefined,
    }),
  );
});

it('recovers expired workers and fences their late commits without reviving cancelled runs', async () => {
  const provider = adapter();
  const run = await service(provider).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  const [task] = await store.claimOutbox(
    epoch.toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    1,
  );
  await store.markOutboxPublished(task.id, 'publisher', epoch.toISOString());
  const old = await store.claimSyncRun(
    run.id,
    0,
    'preparing',
    'dead-worker',
    new Date(Date.now() + 60_000).toISOString(),
  );
  expect(await store.recoverSyncRuns(epoch.toISOString())).toBe(0);
  vi.setSystemTime(new Date(Date.now() + 61_000));
  store = createDatabaseMailStore(database);
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(1);
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(0);
  await expect(
    store.commitSyncStep({
      run: old!,
      messages: [message('late')],
      phase: 'completed',
      status: 'completed',
      createNextTask: false,
    }),
  ).rejects.toThrow('lease');
  expect((await store.listMessages('owner', {})).items).toHaveLength(0);
  await step(provider);
  await store.cancelSyncRun(run.id);
  vi.setSystemTime(new Date(Date.now() + 180_000));
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(0);
});

it('recovers a published delivery lost before the worker claims it, but honors a durable delayed retry', async () => {
  const run = await service(adapter()).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  vi.setSystemTime(new Date(Date.now() + 180_000));
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(0);
  const [task] = await store.claimOutbox(
    new Date().toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    1,
  );
  await store.markOutboxPublished(
    task.id,
    'publisher',
    new Date().toISOString(),
  );
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(1);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    revision: 1,
    status: 'pending',
  });
  await step(adapter());
  await step(adapter());
  await step(adapter());
  expect(await store.getSyncRun(run.id)).toMatchObject({ status: 'completed' });
});

it('persists incomplete mail before advancing and retries content without overwriting local state', async () => {
  const provider = adapter({
    listMessages: async () => ({
      ok: true,
      value: {
        messages: [
          { ...message('large'), contentStatus: 'deferred', size: 20_000_000 },
          {
            ...message('bad'),
            contentStatus: 'failed',
            contentError: 'PARSE_FAILED',
          },
          message('normal'),
        ],
      },
    }),
    getMessage: async (id) => ({
      ok: true,
      value: { ...message(id), text: 'Loaded', read: false },
    }),
  });
  const mail = service(provider);
  const run = await mail.startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  await step(provider);
  await step(provider);
  await step(provider);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    status: 'partial',
    pendingMessages: 2,
  });
  const large = (await store.listMessages('owner', {})).items.find(
    (item) => item.providerMessageId === 'large',
  )!;
  await store.updateMessageState('account', large.id, {
    read: true,
    note: 'Keep me',
  });
  await expect(
    mail.retryMessageContent({ actorId: 'other' }, 'account', large.id),
  ).rejects.toThrow();
  expect(
    await mail.retryMessageContent({ actorId: 'owner' }, 'account', large.id),
  ).toMatchObject({
    contentStatus: 'complete',
    text: 'Loaded',
    read: true,
    note: 'Keep me',
  });
});

it('does not resurrect messages deleted by an interleaved change page', async () => {
  const provider = adapter({
    listMessages: vi
      .fn<NonNullable<MailProviderAdapter['listMessages']>>()
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [], nextCursor: 'stale-page' },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { messages: [message('deleted')] },
      }),
    listChanges: async () => ({
      ok: true,
      value: {
        messages: [],
        deletedProviderMessageIds: ['deleted'],
        nextCursor: { value: 'after-delete' },
        hasMore: false,
      },
    }),
  });
  await service(provider).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  for (let index = 0; index < 5; index += 1) await step(provider);
  expect((await store.listMessages('owner', {})).items).toHaveLength(0);
  expect(
    await database
      .query()
      .selectFrom('mailSyncTombstones')
      .selectAll()
      .execute(),
  ).toHaveLength(0);
});

it('allows only one of two runtimes to recreate a missing delivery', async () => {
  await service(adapter()).startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  const [task] = await store.claimOutbox(
    epoch.toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    1,
  );
  await store.markOutboxPublished(task.id, 'publisher', epoch.toISOString());
  vi.setSystemTime(new Date(Date.now() + 180_000));
  const peerStore = createDatabaseMailStore(database);
  const recovered = await Promise.all([
    store.recoverSyncRuns(new Date().toISOString()),
    peerStore.recoverSyncRuns(new Date().toISOString()),
  ]);
  expect(recovered.reduce((sum, count) => sum + count, 0)).toBe(1);
  await step(adapter());
});

it('recovers lost deliveries even when more than a full batch of older runs are still queued', async () => {
  const account = (await store.getAccount('account'))!;
  const mail = service(adapter());
  for (let index = 0; index < 100; index++) {
    const id = `queued-${index}`;
    await store.saveAccount({ ...account, id, address: `${id}@example.com` });
    await mail.startSync({ actorId: 'owner' }, { accountId: id });
  }
  vi.setSystemTime(new Date(Date.now() + 1_000));
  const lost = await mail.startSync(
    { actorId: 'owner' },
    { accountId: 'account' },
  );
  await database
    .query()
    .updateTable('mailOutbox')
    .set({ status: 'published' })
    .where('aggregateId', '=', lost.id)
    .execute();
  vi.setSystemTime(new Date(Date.now() + 180_000));
  expect(await store.recoverSyncRuns(new Date().toISOString())).toBe(1);
  expect(await store.getSyncRun(lost.id)).toMatchObject({
    revision: 1,
    status: 'pending',
  });
});
