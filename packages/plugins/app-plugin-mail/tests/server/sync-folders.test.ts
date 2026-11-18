import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { type DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import { DefaultMailService } from '../../server/service.js';
import { SyncMailboxOperation } from '../../server/operations/sync-mailbox.js';
import type {
  MailProviderAdapter,
  MailStore,
  NormalizedMailMessage,
} from '../../server/types.js';

const accountId = '10000000-0000-4000-8000-000000000001';
const owner = { actorId: 'owner' };
let database: DatabaseManager;
let store: MailStore;

/**
 * A Provider mailbox shaped like Gmail (labels; history lists every label and changes report all labels of a
 * message) or Microsoft 365 (folders; history and deltas are read folder by folder).
 */
class FakeMailbox {
  public readonly folders = ['inbox', 'archive', 'spam'];
  public readonly messages = new Map<string, string[]>();
  public changed = new Set<string>();
  public deleted = new Set<string>();
  public readonly historyFolders: (readonly string[] | undefined)[] = [];
  public readonly deltaFolders: (readonly string[])[] = [];
  public constructor(public readonly kind: 'gmail' | 'microsoft') {}

  public put(id: string, folders: string[]): void {
    this.messages.set(id, folders);
    this.changed.add(id);
  }

  public adapter(): MailProviderAdapter {
    const labels = this.kind === 'gmail';
    return {
      identity: { type: this.kind, name: this.kind },
      capabilities: {
        receive: true,
        send: false,
        incrementalSync: true,
        pushNotifications: false,
        folders: !labels,
        labels,
        drafts: false,
        moveMessage: false,
        aliases: false,
      },
      listFolders: async () => ({
        ok: true,
        value: {
          folders: this.folders.map((id) => ({
            providerFolderId: id,
            name: id,
            type: id === 'inbox' ? 'inbox' : id === 'spam' ? 'spam' : 'custom',
            kind: labels ? 'label' : 'folder',
          })),
          completeProviderFolderIds: this.folders,
        },
      }),
      getCurrentSyncCursor: async () => {
        // Changes before the baseline are part of history.
        this.changed.clear();
        this.deleted.clear();
        return { ok: true, value: { value: 'baseline' } };
      },
      listMessages: async (input) => {
        this.historyFolders.push(input.providerFolderIds);
        const wanted = new Set(input.providerFolderIds ?? this.folders);
        return {
          ok: true,
          value: {
            messages: [...this.messages]
              .filter(
                // Gmail lists the whole mailbox; Microsoft reads each requested folder.
                ([, folders]) => labels || folders.some((id) => wanted.has(id)),
              )
              .map(([id, folders]) => ({
                ...message(id, labels ? folders : folders),
                ...(labels
                  ? {}
                  : {
                      providerFolderIds: folders.filter((id) => wanted.has(id)),
                    }),
              })),
          },
        };
      },
      ...(labels
        ? {}
        : {
            reconcileSyncCursor: (cursor, providerFolderIds) => {
              this.deltaFolders.push(providerFolderIds);
              return {
                ok: true,
                value: cursor ?? { value: 'baseline' },
              };
            },
          }),
      listChanges: async () => {
        const scope = new Set(this.deltaFolders.at(-1) ?? this.folders);
        const changed = [...this.changed].filter((id) => this.messages.has(id));
        const page = {
          messages: changed
            .filter(
              (id) =>
                labels || this.messages.get(id)!.some((f) => scope.has(f)),
            )
            .map((id) => message(id, this.messages.get(id)!)),
          deletedProviderMessageIds: [...this.deleted],
          // A Microsoft delta of a selected folder reports a message leaving it as removed.
          ...(labels
            ? {}
            : {
                deletedProviderMessageIds: [
                  ...this.deleted,
                  ...changed.filter(
                    (id) => !this.messages.get(id)!.some((f) => scope.has(f)),
                  ),
                ],
              }),
          nextCursor: { value: 'current' },
          hasMore: false,
        };
        this.changed.clear();
        this.deleted.clear();
        return { ok: true, value: page };
      },
    };
  }
}

function message(id: string, folders: string[]): NormalizedMailMessage {
  return {
    providerMessageId: id,
    subject: id,
    providerFolderIds: folders,
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    read: false,
    starred: false,
    draft: false,
    receivedAt: '2026-03-01T00:00:00.000Z',
    attachments: [],
  };
}

beforeEach(async () => {
  vi.useFakeTimers({
    now: new Date('2026-09-17T00:00:00Z'),
    toFake: ['Date'],
  });
  database = await createMailTestDatabase();
  store = createDatabaseMailStore(database);
});
afterEach(async () => {
  vi.useRealTimers();
  await destroyMailTestDatabase(database);
});

describe.each(['gmail', 'microsoft'] as const)(
  '%s synchronized folders',
  (kind) => {
    let mailbox: FakeMailbox;
    beforeEach(async () => {
      mailbox = new FakeMailbox(kind);
      await store.saveAccount({
        id: accountId,
        userId: 'owner',
        address: 'owner@example.com',
        status: 'active',
        provider: { type: kind, name: kind },
        credentialReference: 'credential',
        scopes: [],
        initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      });
    });

    function service(): DefaultMailService {
      return new DefaultMailService({
        store,
        adapters: { resolve: async () => mailbox.adapter() },
        outbox: { kick: vi.fn() },
        syncBatchSize: 100,
      });
    }
    async function settle(): Promise<void> {
      for (let index = 0; index < 50; index += 1) {
        // History must not mistake earlier local writes for changes made during the run.
        vi.setSystemTime(Date.now() + 1_000);
        const tasks = await store.claimOutbox(
          new Date().toISOString(),
          'publisher',
          new Date(Date.now() + 30_000).toISOString(),
          1,
        );
        const task = tasks[0];
        if (!task) break;
        if (task.type !== 'syncMailbox')
          throw new Error('Expected synchronization');
        await store.markOutboxPublished(
          task.id,
          task.leaseToken!,
          new Date().toISOString(),
        );
        await new SyncMailboxOperation({
          store,
          adapters: { resolve: async () => mailbox.adapter() },
        }).execute(task.payload);
      }
      expect(await store.findActiveSyncRun(accountId)).toBeUndefined();
    }
    async function sync(): Promise<void> {
      const run = await service().startSync(owner, { accountId });
      await settle();
      expect(await store.getSyncRun(run.id)).toMatchObject({
        status: 'completed',
      });
    }
    async function choose(syncFolderIds: readonly string[] | null) {
      await service().updateAccount(owner, { accountId, syncFolderIds });
      await settle();
    }
    async function local(): Promise<Record<string, string[]>> {
      const rows = await database
        .query()
        .selectFrom('mailMessages')
        .select(['id', 'providerMessageId'])
        .where('accountId', '=', accountId)
        .execute<{ id: string; providerMessageId: string }>();
      const result: Record<string, string[]> = {};
      for (const row of rows)
        result[row.providerMessageId] = (
          await database
            .query()
            .selectFrom('mailMessageFolders')
            .select('providerFolderId')
            .where('messageId', '=', row.id)
            .orderBy('providerFolderId')
            .execute<{ providerFolderId: string }>()
        ).map((item) => item.providerFolderId);
      return result;
    }
    async function localIds(): Promise<Record<string, string>> {
      return Object.fromEntries(
        (
          await database
            .query()
            .selectFrom('mailMessages')
            .select(['id', 'providerMessageId'])
            .execute<{ id: string; providerMessageId: string }>()
        ).map((row) => [row.providerMessageId, row.id]),
      );
    }

    it('lists folders first, then imports and follows only the chosen folders', async () => {
      mailbox.put('both', ['inbox', 'spam']);
      mailbox.put('spam-only', ['spam']);
      mailbox.put('archived', ['archive']);
      await store.updateAccountSyncFolders(accountId, []);

      await sync();
      expect(
        (await store.listFolders(accountId)).map((f) => f.providerFolderId),
      ).toHaveLength(3);
      expect(await local()).toEqual({});
      expect(mailbox.historyFolders).toEqual([]);
      // Automatic and push synchronization wait for the selection as well.
      expect(await store.findActiveSyncRun(accountId)).toBeUndefined();

      await choose(['inbox', 'archive']);
      expect(await local()).toEqual({
        both: ['inbox'],
        archived: ['archive'],
      });
      if (kind === 'microsoft') {
        expect([...mailbox.historyFolders.at(-1)!].sort()).toEqual([
          'archive',
          'inbox',
        ]);
        expect([...mailbox.deltaFolders.at(-1)!].sort()).toEqual([
          'archive',
          'inbox',
        ]);
      }
      expect(
        (await service().listFolders(owner, accountId)).map(
          (f) => f.providerFolderId,
        ),
      ).toEqual(expect.not.arrayContaining(['spam']));
      expect(
        await service().listFolders(owner, accountId, {
          includeUnsynced: true,
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ providerFolderId: 'spam', synced: false }),
          expect.objectContaining({ providerFolderId: 'inbox', synced: true }),
        ]),
      );

      // Incremental changes never import mail outside the chosen folders.
      mailbox.put('new-spam', ['spam']);
      mailbox.put('new-inbox', ['inbox']);
      await sync();
      expect(await local()).toEqual({
        both: ['inbox'],
        archived: ['archive'],
        'new-inbox': ['inbox'],
      });

      // A message moved into an unselected folder leaves on the next run.
      mailbox.put('archived', ['spam']);
      await sync();
      expect(await local()).toEqual({
        both: ['inbox'],
        'new-inbox': ['inbox'],
      });
    });

    it('narrows after confirming the count and widens without duplicates', async () => {
      mailbox.put('both', ['inbox', 'archive']);
      mailbox.put('archived', ['archive']);
      mailbox.put('spam', ['spam']);
      await sync();
      // An account that never chose folders synchronizes every folder, as before.
      expect(await local()).toEqual({
        both: ['archive', 'inbox'],
        archived: ['archive'],
        spam: ['spam'],
      });
      const ids = await localIds();

      expect(
        await service().previewSyncFolders(owner, accountId, ['inbox']),
      ).toEqual({ removedMessageCount: 2 });
      await choose(['inbox']);
      // Mail still in a chosen folder survives; the Provider mailbox is untouched.
      expect(await local()).toEqual({ both: ['inbox'] });
      expect(mailbox.messages.size).toBe(3);
      expect((await localIds()).both).toBe(ids.both);

      await choose(['inbox', 'archive']);
      expect(await local()).toEqual({
        both: ['archive', 'inbox'],
        archived: ['archive'],
      });
      expect((await localIds()).both).toBe(ids.both);
      const rows = await database
        .query()
        .selectFrom('mailMessages')
        .selectAll()
        .execute();
      expect(rows).toHaveLength(2);

      await choose(null);
      expect(Object.keys(await local()).sort()).toEqual([
        'archived',
        'both',
        'spam',
      ]);
      expect(
        (await store.getAccount(accountId))?.syncFolderIds,
      ).toBeUndefined();
    });

    it('rejects an empty or unknown selection without changing the account', async () => {
      await sync();
      await expect(
        service().updateAccount(owner, { accountId, syncFolderIds: [] }),
      ).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' });
      await expect(
        service().previewSyncFolders(owner, accountId, ['missing']),
      ).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' });
      expect(
        (await store.getAccount(accountId))?.syncFolderIds,
      ).toBeUndefined();
    });
  },
);
