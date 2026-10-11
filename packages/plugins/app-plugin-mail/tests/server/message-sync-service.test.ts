import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailMessageSyncNotifier } from '../../server/message-sync-notifier.js';
import { DefaultMailService } from '../../server/service.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailMessagesSyncedEvent } from '../../server/index.js';
import type { MailStore } from '../../server/contracts/persistence.js';
import type { MailProviderAdapterResolver } from '../../server/contracts/provider.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import {
  createMailTestQueue,
  mailQueueBackends,
  type MailTestQueue,
} from '../helpers/queue.js';
import { testId } from '../helpers/test-id.js';

const accountId = testId('account');
const adapters: MailProviderAdapterResolver = {
  resolve: async () => ({
    identity: { type: 'fixture', name: 'fixture' },
    capabilities: { receive: true },
    setRead: async () => ({ ok: true, value: undefined }),
    setStarred: async () => ({ ok: true, value: undefined }),
    deleteMessage: async () => ({ ok: true, value: undefined }),
    getMessage: async () => ({
      ok: true,
      value: { ...message, text: 'Recovered body', contentStatus: 'complete' },
    }),
  }),
};
const message = {
  providerMessageId: 'remote',
  providerFolderIds: [],
  subject: 'Message',
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

describe.each(mailQueueBackends)(
  'Mail public queue subscriptions (%s)',
  (backend) => {
    let database: DatabaseManager;
    let store: MailStore;
    let queue: MailTestQueue;
    let notifier: MailMessageSyncNotifier;
    let service: DefaultMailService;

    beforeEach(async () => {
      database = await createMailTestDatabase();
      store = createDatabaseMailStore(database);
      await store.saveAccount({
        id: accountId,
        userId: 'owner',
        provider: { type: 'fixture', name: 'fixture' },
        address: 'owner@example.test',
        credentialReference: 'fixture',
        scopes: [],
        status: 'active',
      });
      queue = await createMailTestQueue(backend);
      notifier = new MailMessageSyncNotifier(queue.hostQueue);
      service = new DefaultMailService({
        store,
        adapters,
        outbox: { kick() {} },
        messageSyncNotifier: notifier,
      });
      await queue.setup();
    });

    afterEach(async () => {
      try {
        await notifier.close();
      } finally {
        await queue.close();
        await destroyMailTestDatabase(database);
        vi.restoreAllMocks();
      }
    });

    async function commit(): Promise<readonly MailMessagesSyncedEvent[]> {
      const created = await store.createSyncRun({
        id: testId('run'),
        accountId,
        requestedBy: 'owner',
        mode: 'incremental',
        policy: { batchSize: 10 },
      });
      const prepared = await store.claimSyncRun(
        created.id,
        0,
        'preparing',
        'prepare',
        new Date(Date.now() + 60000).toISOString(),
      );
      if (!prepared) throw new Error('Missing preparation lease.');
      await store.commitSyncStep({
        run: prepared,
        messages: [],
        phase: 'incremental',
        status: 'running',
        createNextTask: false,
      });
      const claimed = await store.claimSyncRun(
        created.id,
        1,
        'incremental',
        'import',
        new Date(Date.now() + 60000).toISOString(),
      );
      if (!claimed) throw new Error('Missing import lease.');
      const result = await store.commitSyncStep({
        run: claimed,
        messages: [message],
        phase: 'completed',
        status: 'completed',
        createNextTask: false,
      });
      return result.messageSyncEvents;
    }

    it('delivers committed snapshots through the supplied host queue and awaits idempotent unsubscription', async () => {
      const received: MailMessagesSyncedEvent[] = [];
      const listener = vi.fn(
        async (event: MailMessagesSyncedEvent, signal: AbortSignal) => {
          received.push(event);
          expect(signal).toBeInstanceOf(AbortSignal);
          expect(signal.aborted).toBe(false);
          expect(
            await service.getMessage(
              { actorId: 'owner' },
              event.accountId,
              event.messageIds[0]!,
            ),
          ).toMatchObject({ providerMessageId: 'remote' });
        },
      );
      const cancel = service.onMessagesSynced(listener);
      const events = await commit();
      await notifier.publish(events);
      await vi.waitFor(() => expect(listener).toHaveBeenCalledOnce());
      expect(received).toEqual(events);
      await cancel();
      await cancel();
      await notifier.publish([{ ...events[0]!, eventId: 'after-cancel' }]);
      await notifier.close();
      expect(listener).toHaveBeenCalledOnce();
      // The plugin's cleanup never owns the shared queue service.
      await expect(
        queue.hostQueue.producer('unrelated').publish('test', {}),
      ).resolves.toMatchObject({ jobId: expect.any(String) });
    });

    it('does not turn legacy batches, draft or sent writes, body recovery, flag edits or deletions into sync events', async () => {
      const listener = vi.fn();
      service.onMessagesSynced(listener);
      const publish = vi.spyOn(queue.hostQueue, 'producer');
      await store.commitSyncBatch({
        accountId,
        folders: [],
        messages: [{ ...message, contentStatus: 'deferred' }],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'legacy' },
      });
      const detail = (
        await service.listMessages(
          { actorId: 'owner' },
          { accountIds: [accountId] },
        )
      ).items[0]!;
      await service.updateMessage(
        { actorId: 'owner' },
        { accountId, messageId: detail.id, read: true, starred: true },
      );
      expect(
        await service.retryMessageContent(
          { actorId: 'owner' },
          accountId,
          detail.id,
        ),
      ).toMatchObject({ text: 'Recovered body', contentStatus: 'complete' });
      await store.saveMessage(accountId, {
        ...message,
        providerMessageId: 'remote-draft',
        draft: true,
      });
      await store.saveMessage(accountId, {
        ...message,
        providerMessageId: 'sent-confirmation',
      });
      await service.deleteMessage(
        { actorId: 'owner' },
        { accountId, messageId: detail.id, permanently: true },
      );
      expect(
        await service.getMessage({ actorId: 'owner' }, accountId, detail.id),
      ).toBeUndefined();
      await notifier.close();
      expect(publish).not.toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();
    });

    it('fails actionably when a standalone service has no host-backed event notifier', () => {
      const standalone = new DefaultMailService({
        store,
        adapters,
        outbox: { kick() {} },
      });
      expect(() => standalone.onMessagesSynced(() => {})).toThrow(
        expect.objectContaining({ reason: 'MAIL_EVENTS_UNAVAILABLE' }),
      );
    });
  },
);
