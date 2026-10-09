import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { type DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { createMailRuntime, type MailRuntime } from '../../server/runtime.js';
import type {
  MailProviderAdapter,
  MailStore,
  NormalizedMailMessage,
} from '../../server/types.js';
import { InlineJobExecutor } from '../helpers/inline-job-executor.js';

describe('post-send mailbox synchronization', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let executor: InlineJobExecutor;
  let runtime: MailRuntime;
  let service: DefaultMailService;
  let adapter: MailProviderAdapter;
  let visible: boolean;
  const notify = vi.fn();
  const input = {
    accountId: 'account-1',
    identityId: 'identity-1',
    to: [{ address: 'recipient@example.com' }],
    subject: 'Sent mail',
    text: 'Body',
    idempotencyKey: 'send-1',
  };
  const sent: NormalizedMailMessage = {
    providerMessageId: 'remote-1',
    providerFolderIds: ['Sent'],
    subject: 'Sent mail',
    text: 'Body',
    to: input.to,
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    read: true,
    starred: false,
    draft: false,
    attachments: [],
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    visible = true;
    notify.mockClear();
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'sender@example.com',
      credentialReference: 'credential-1',
      scopes: [],
      status: 'active',
    });
    await store.replaceIdentities('account-1', [
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    adapter = {
      identity: { type: 'test', name: 'test' },
      capabilities: {
        receive: true,
        send: true,
        incrementalSync: true,
        pushNotifications: false,
        folders: true,
        labels: false,
        drafts: false,
        moveMessage: false,
        aliases: false,
      },
      sendMessage: vi.fn(async () => ({
        status: 'accepted' as const,
        providerMessageId: 'remote-1',
      })),
      listFolders: async () => ({
        ok: true,
        value: {
          folders: [
            {
              providerFolderId: 'Sent',
              name: 'Sent',
              type: 'sent',
              kind: 'folder',
            },
          ],
          completeProviderFolderIds: ['Sent'],
        },
      }),
      getCurrentSyncCursor: async () => ({
        ok: true,
        value: { value: 'baseline' },
      }),
      listMessages: async () => ({
        ok: true,
        value: { messages: visible ? [sent] : [] },
      }),
      listChanges: vi.fn(async () => ({
        ok: true as const,
        value: {
          messages: visible ? [sent] : [],
          deletedProviderMessageIds: [],
          nextCursor: { value: 'next' },
          hasMore: false,
        },
      })),
    };
    const adapters = { resolve: async () => adapter };
    executor = await InlineJobExecutor.ready();
    runtime = createMailRuntime({
      store,
      adapters,
      executor,
      messageChangeNotifier: { notify },
    });
    vi.spyOn(runtime, 'kick').mockImplementation(() => undefined);
    service = new DefaultMailService({ store, adapters, outbox: runtime });
  });

  afterEach(async () => {
    await runtime.close();
    await executor.shutdown();
    await destroyMailTestDatabase(database);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  async function drain(): Promise<void> {
    for (let step = 0; step < 8; step += 1) await runtime.publishPending();
  }

  it('refreshes sent mail and keeps one message across delayed refreshes and repeated sends', async () => {
    await service.sendMessage({ actorId: 'user-1' }, input);
    await drain();
    const first = await service.listMessages(
      { actorId: 'user-1' },
      { folderIds: ['__nocobase_default_sent__'] },
    );
    expect(first.items).toHaveLength(1);
    expect(notify).toHaveBeenCalledWith('user-1');
    vi.setSystemTime(Date.now() + 31_000);
    await service.sendMessage({ actorId: 'user-1' }, input);
    await drain();
    const next = await service.listMessages(
      { actorId: 'user-1' },
      { folderIds: ['Sent'] },
    );
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe(first.items[0].id);
    expect(adapter.sendMessage).toHaveBeenCalledTimes(1);
    const requests = await database
      .query()
      .selectFrom('mailOutbox')
      .selectAll()
      .where('type', '=', 'requestMailboxSync')
      .execute();
    expect(requests).toHaveLength(3);
  });

  it('finds a sent copy that appears after the first refresh', async () => {
    visible = false;
    await service.sendMessage({ actorId: 'user-1' }, input);
    await drain();
    expect(
      (await service.listMessages({ actorId: 'user-1' }, {})).items,
    ).toHaveLength(0);
    visible = true;
    vi.setSystemTime(Date.now() + 6_000);
    await drain();
    expect(
      (
        await service.listMessages(
          { actorId: 'user-1' },
          { folderIds: ['Sent'] },
        )
      ).items,
    ).toHaveLength(1);
    expect(adapter.sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['local-draft:1', 'remote-1'])(
    'shows accepted draft %s in Sent before background sync and does not restore a stale remote draft',
    async (draftProviderId) => {
      await store.commitSyncBatch({
        accountId: 'account-1',
        nextCursor: { value: 'baseline' },
        folders: [
          {
            providerFolderId: 'Sent',
            name: 'Sent',
            type: 'sent',
            kind: 'folder',
          },
        ],
        messages: [],
        deletedProviderMessageIds: [],
      });
      const draft = await store.saveMessage('account-1', {
        ...sent,
        providerMessageId: draftProviderId,
        providerDraftMessageId: 'remote-1',
        providerFolderIds: ['__nocobase_local_drafts__'],
        draft: true,
      });
      const request = { ...input, draftMessageId: draft.id };
      expect(
        await service.sendMessage({ actorId: 'user-1' }, request),
      ).toMatchObject({ status: 'accepted' });
      const first = await service.listMessages(
        { actorId: 'user-1' },
        { folderIds: ['Sent'] },
      );
      expect(first.items).toHaveLength(1);
      expect(first.items[0]).toMatchObject({
        draft: false,
        subject: input.subject,
      });
      await store.commitSyncBatch({
        accountId: 'account-1',
        nextCursor: { value: 'baseline' },
        folders: [],
        deletedProviderMessageIds: [],
        messages: [{ ...sent, draft: true, providerFolderIds: ['Drafts'] }],
      });
      expect(
        (
          await service.listMessages(
            { actorId: 'user-1' },
            { folderIds: ['Sent'] },
          )
        ).items,
      ).toHaveLength(1);
      await drain();
      expect(
        (
          await service.listMessages(
            { actorId: 'user-1' },
            { folderIds: ['Sent'] },
          )
        ).items,
      ).toHaveLength(1);
      expect(adapter.sendMessage).toHaveBeenCalledTimes(1);
    },
  );

  it.each([false, true])(
    'lists a local draft only once when the remote copy already exists: %s',
    async (remoteFirst) => {
      if (remoteFirst)
        await store.saveMessage('account-1', { ...sent, draft: true });
      const draft = await store.saveMessage('account-1', {
        ...sent,
        providerMessageId: 'local-draft:1',
        providerDraftMessageId: 'remote-1',
        draft: true,
        providerFolderIds: ['__nocobase_local_drafts__'],
        subject: 'Local edits',
      });
      await store.commitSyncBatch({
        accountId: 'account-1',
        nextCursor: { value: 'baseline' },
        folders: [
          {
            providerFolderId: 'Drafts',
            name: 'Drafts',
            type: 'drafts',
            kind: 'folder',
          },
        ],
        deletedProviderMessageIds: [],
        messages: [{ ...sent, draft: true, providerFolderIds: ['Drafts'] }],
      });
      const drafts = await service.listMessages(
        { actorId: 'user-1' },
        { folderIds: ['__nocobase_local_drafts__'], withTotal: true },
      );
      expect(drafts.items).toHaveLength(1);
      expect(drafts.items[0]).toMatchObject({
        id: draft.id,
        subject: 'Local edits',
      });
      expect(drafts.total).toBe(1);
      const remoteFolder = await service.listMessages(
        { actorId: 'user-1' },
        { folderIds: ['Drafts'], withTotal: true },
      );
      expect(remoteFolder.items).toHaveLength(1);
      expect(remoteFolder.items[0].id).toBe(draft.id);
      expect(remoteFolder.total).toBe(1);
    },
  );

  it('cleans up the draft and retains accepted delivery when saving the local sent copy fails', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [
        {
          providerFolderId: 'Sent',
          name: 'Sent',
          type: 'sent',
          kind: 'folder',
        },
      ],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'baseline' },
    });
    const draft = await service.saveDraft({ actorId: 'user-1' }, input);
    vi.spyOn(store, 'saveMessage').mockRejectedValueOnce(
      new Error('sent copy failed'),
    );
    expect(
      await service.sendMessage(
        { actorId: 'user-1' },
        { ...input, draftMessageId: draft.id },
      ),
    ).toMatchObject({ status: 'accepted' });
    expect(
      await store.getMessage('user-1', 'account-1', draft.id),
    ).toBeUndefined();
    expect(runtime.kick).toHaveBeenCalled();
    await drain();
    expect(
      (
        await service.listMessages(
          { actorId: 'user-1' },
          { folderIds: ['Sent'] },
        )
      ).items,
    ).toHaveLength(1);
  });

  it('requests another pass when a sync was already in progress', async () => {
    await store.commitSyncBatch({
      accountId: 'account-1',
      folders: [],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'baseline' },
    });
    const active = await store.createSyncRun({
      id: 'active-1',
      accountId: 'account-1',
      requestedBy: 'user-1',
      mode: 'incremental',
      policy: { maxMessages: 100, batchSize: 100 },
    });
    await service.sendMessage({ actorId: 'user-1' }, input);
    await drain();
    expect(adapter.listChanges).toHaveBeenCalledTimes(2);
    expect((await store.getSyncRun(active.id))?.status).toBe('completed');
    expect(await store.listSyncRuns('user-1')).toHaveLength(1);
  });

  it('preserves acceptance when synchronization and draft cleanup fail', async () => {
    const draft = await service.saveDraft({ actorId: 'user-1' }, input);
    vi.spyOn(store, 'deleteMessage').mockRejectedValueOnce(
      new Error('cleanup failed'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    adapter.listFolders = async () => ({
      ok: false,
      error: {
        code: 'SYNC_FAILED',
        category: 'provider',
        message: 'Unavailable',
        retryable: false,
      },
    });
    const request = { ...input, draftMessageId: draft.id };
    expect(
      await service.sendMessage({ actorId: 'user-1' }, request),
    ).toMatchObject({ status: 'accepted' });
    await drain();
    expect(
      await service.sendMessage({ actorId: 'user-1' }, request),
    ).toMatchObject({ status: 'accepted' });
    expect(adapter.sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['failed', 'submission_unknown'] as const)(
    'does not schedule sent refreshes for %s delivery',
    async (status) => {
      adapter.sendMessage = vi.fn(async () => ({
        status,
        error: {
          code: 'SMTP_FAILURE',
          category: 'network',
          message: 'Unavailable',
          retryable: false,
        },
      }));
      await service.sendMessage({ actorId: 'user-1' }, input);
      expect(
        await database.query().selectFrom('mailOutbox').selectAll().execute(),
      ).toHaveLength(0);
    },
  );
});
