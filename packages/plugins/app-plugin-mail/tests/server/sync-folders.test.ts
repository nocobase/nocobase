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
  /** Replaces the one-page folder list, e.g. with Microsoft 365 pages of child folders. */
  public listFolders?: MailProviderAdapter['listFolders'];
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
      listFolders:
        this.listFolders ??
        (async () => ({
          ok: true,
          value: {
            folders: this.folders.map((id) => ({
              providerFolderId: id,
              name: id,
              type:
                id === 'inbox' ? 'inbox' : id === 'spam' ? 'spam' : 'custom',
              kind: labels ? 'label' : 'folder',
            })),
            completeProviderFolderIds: this.folders,
          },
        })),
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
    /** Run the next synchronization step; false when none is queued. */
    async function step(): Promise<boolean> {
      // History must not mistake earlier local writes for changes made during the run.
      vi.setSystemTime(Date.now() + 1_000);
      const tasks = await store.claimOutbox(
        new Date().toISOString(),
        'publisher',
        new Date(Date.now() + 30_000).toISOString(),
        1,
      );
      const task = tasks[0];
      if (!task) return false;
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
      return true;
    }
    async function settle(): Promise<void> {
      for (let index = 0; index < 50; index += 1) if (!(await step())) break;
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
      const initialSyncCompleted = async () =>
        (await service().listFolderChoices(owner, accountId))
          .initialSyncCompleted;
      expect(await initialSyncCompleted()).toBe(false);

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
      // A sync that keeps this selection now runs incrementally, which the scope dialog tells the owner.
      expect(await initialSyncCompleted()).toBe(true);
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

    it('saves nothing when queuing the initial run fails, so the same choice can be retried', async () => {
      mailbox.put('inboxed', ['inbox']);
      mailbox.put('archived', ['archive']);
      await sync();
      await choose(['inbox']);
      expect(await local()).toEqual({ inboxed: ['inbox'] });
      // An active run that a failed save must not cancel.
      const active = await service().startSync(owner, { accountId });
      // Reusing that run's id makes the insert of the new run fail inside the transaction.
      const failing: MailStore = Object.assign(Object.create(store), {
        replaceSyncFolders: (
          ids: readonly string[] | undefined,
          run: Parameters<MailStore['replaceSyncFolders']>[1],
        ) => store.replaceSyncFolders(ids, { ...run, id: active.id }),
      });
      await expect(
        new DefaultMailService({
          store: failing,
          adapters: { resolve: async () => mailbox.adapter() },
          outbox: { kick: vi.fn() },
          syncBatchSize: 100,
        }).updateAccount(owner, {
          accountId,
          syncFolderIds: ['inbox', 'archive'],
        }),
      ).rejects.toThrow();
      expect((await store.getAccount(accountId))?.syncFolderIds).toEqual([
        'inbox',
      ]);
      expect(await store.findActiveSyncRun(accountId)).toMatchObject({
        id: active.id,
        status: 'pending',
      });
      await settle();

      // The account still has its cursor; the retry runs an initial sync and imports the newly chosen folder.
      await choose(['inbox', 'archive']);
      expect(await local()).toEqual({
        inboxed: ['inbox'],
        archived: ['archive'],
      });
    });

    it('reuses the active run for an unchanged scope and replaces it once for a changed one', async () => {
      mailbox.put('inboxed', ['inbox']);
      mailbox.put('archived', ['archive']);
      await sync();
      await choose(['inbox', 'archive']);
      const active = await service().startSync(owner, { accountId });
      // Confirming the same scope again follows the run in progress.
      expect(await service().startSync(owner, { accountId })).toMatchObject({
        id: active.id,
      });
      // An unchanged scope schedules nothing, so it answers no run.
      const unchanged = await service().updateAccount(owner, {
        accountId,
        syncFolderIds: ['inbox', 'archive'],
      });
      expect(unchanged).not.toHaveProperty('syncRun');
      expect(await store.findActiveSyncRun(accountId)).toMatchObject({
        id: active.id,
      });

      const changed = await service().updateAccount(owner, {
        accountId,
        syncFolderIds: ['inbox'],
      });
      expect(await store.getSyncRun(active.id)).toMatchObject({
        status: 'cancelled',
      });
      const runs = (await store.listSyncRuns('owner', 0, 100)).filter(
        (run) => run.status === 'pending' || run.status === 'running',
      );
      expect(runs).toHaveLength(1);
      expect(runs[0]).toMatchObject({
        mode: 'initial',
        policy: { syncFolderIds: ['inbox'] },
      });
      // The answer names that run, so a client can follow it without starting another.
      expect(changed).toMatchObject({
        syncFolderIds: ['inbox'],
        syncRun: { id: runs[0].id, mode: 'initial', status: 'pending' },
      });
      expect(changed.syncRun).not.toHaveProperty('leaseToken');
      await settle();
      expect(await local()).toEqual({ inboxed: ['inbox'] });
    });

    it('lets the later of two interleaved saves own the selection and the active run', async () => {
      mailbox.put('inboxed', ['inbox']);
      mailbox.put('archived', ['archive']);
      await sync();
      // The earlier request has read the account but commits only after the later one finished.
      let release!: () => void;
      const released = new Promise<void>((resolve) => (release = resolve));
      const delayed: MailStore = Object.assign(Object.create(store), {
        replaceSyncFolders: async (
          ...args: Parameters<MailStore['replaceSyncFolders']>
        ) => {
          await released;
          return store.replaceSyncFolders(...args);
        },
      });
      const earlier = new DefaultMailService({
        store: delayed,
        adapters: { resolve: async () => mailbox.adapter() },
        outbox: { kick: vi.fn() },
        syncBatchSize: 100,
      }).updateAccount(owner, { accountId, syncFolderIds: ['archive'] });
      await service().updateAccount(owner, {
        accountId,
        syncFolderIds: ['inbox'],
      });
      const later = await store.findActiveSyncRun(accountId);
      release();
      await earlier;

      const account = await store.getAccount(accountId);
      const active = await store.findActiveSyncRun(accountId);
      // Whichever save commits last, the account and its only active run agree.
      expect(account?.syncFolderIds).toEqual(['archive']);
      expect(active?.policy.syncFolderIds).toEqual(['archive']);
      expect(await store.getSyncRun(later!.id)).toMatchObject({
        status: 'cancelled',
      });
      await settle();
      expect(await local()).toEqual({ archived: ['archive'] });
    });

    it('leaves the rest of the account alone during an incremental run with no changes', async () => {
      mailbox.put('inboxed', ['inbox']);
      await sync();
      await choose(['inbox']);
      const ids = await localIds();
      // A link only a whole-account prune would remove.
      await database
        .query()
        .insertInto('mailMessageFolders')
        .values({
          accountId,
          messageId: ids.inboxed,
          providerFolderId: 'spam',
        })
        .execute();

      await sync();
      expect(await local()).toEqual({ inboxed: ['inbox', 'spam'] });

      // The next initial run, which follows every change of selection, prunes it.
      await choose(['inbox', 'archive']);
      expect(await local()).toEqual({ inboxed: ['inbox'] });
    });

    it('deletes local mail of an unselected folder in batches', async () => {
      mailbox.put('inboxed', ['inbox']);
      for (let index = 0; index < 1001; index += 1)
        mailbox.put(`archived-${index}`, ['archive']);
      await sync();
      expect(
        await service().previewSyncFolders(owner, accountId, ['inbox']),
      ).toEqual({ removedMessageCount: 1001 });
      await choose(['inbox']);
      expect(await local()).toEqual({ inboxed: ['inbox'] });
    });

    it('deletes local mail of a selected folder deleted on the server, keeping mail still in another selected folder', async () => {
      mailbox.put('archived', ['archive']);
      mailbox.put('both', ['inbox', 'archive']);
      mailbox.put('inboxed', ['inbox']);
      await sync();
      await choose(['inbox', 'archive']);
      expect(await local()).toEqual({
        archived: ['archive'],
        both: ['archive', 'inbox'],
        inboxed: ['inbox'],
      });

      // The folder disappears from the folder list; no change ever reports its messages again.
      mailbox.folders.splice(mailbox.folders.indexOf('archive'), 1);
      mailbox.messages.delete('archived');
      mailbox.messages.set('both', ['inbox']);
      await sync();
      expect(await local()).toEqual({ both: ['inbox'], inboxed: ['inbox'] });
      if (kind === 'microsoft')
        expect(mailbox.deltaFolders.at(-1)).toEqual(['inbox']);
      expect(
        (await store.listFolders(accountId)).map((f) => f.providerFolderId),
      ).not.toContain('archive');
    });

    describe('folder list for a selection', () => {
      const folder = (id: string) => ({
        providerFolderId: id,
        name: id,
        type: 'custom' as const,
        kind: kind === 'gmail' ? ('label' as const) : ('folder' as const),
      });
      let secondPage: 'ok' | 'fail';
      beforeEach(async () => {
        secondPage = 'ok';
        // The first page holds a parent folder; its child folder and the rest arrive on the next page.
        mailbox.listFolders = async (input) =>
          input.cursor === undefined
            ? {
                ok: true,
                value: { folders: [folder('inbox')], nextCursor: 'page-2' },
              }
            : secondPage === 'fail'
              ? {
                  ok: false,
                  error: {
                    code: 'PROVIDER_UNAVAILABLE',
                    message: 'The folder list could not be read.',
                    category: 'provider',
                    retryable: false,
                  },
                }
              : {
                  ok: true,
                  value: {
                    folders: [folder('inbox/child'), folder('archive')],
                    completeProviderFolderIds: [
                      'inbox',
                      'inbox/child',
                      'archive',
                    ],
                  },
                };
        await store.updateAccountSyncFolders(accountId, []);
        await service().startSync(owner, { accountId });
      });
      const choices = () => service().listFolderChoices(owner, accountId);
      const ids = async () =>
        (await choices()).folders.map((f) => f.providerFolderId).sort();

      it('is incomplete after the first page and complete with the last one', async () => {
        await step();
        expect(await choices()).toMatchObject({
          complete: false,
          failed: false,
        });
        expect(await ids()).toEqual(['inbox']);
        await step();
        expect(await choices()).toMatchObject({
          complete: true,
          failed: false,
        });
        expect(await ids()).toEqual(['archive', 'inbox', 'inbox/child']);
      });

      it('reads the runs before the folders in one transaction', async () => {
        await step();
        // Folders read before the runs could miss the last page committed in between yet be reported complete.
        const reads: string[] = [];
        const transaction = database.transaction.bind(database);
        vi.spyOn(database, 'transaction').mockImplementationOnce(
          (callback: Parameters<DatabaseManager['transaction']>[0]) =>
            transaction((connection) =>
              callback(
                new Proxy(connection, {
                  get: (target, key) =>
                    key === 'query'
                      ? new Proxy(target.query, {
                          get: (query, name) =>
                            name === 'selectFrom'
                              ? (table: string) => {
                                  reads.push(table);
                                  return query.selectFrom(table);
                                }
                              : Reflect.get(query, name),
                        })
                      : Reflect.get(target, key),
                }),
              ),
            ),
        );
        expect(await choices()).toMatchObject({ complete: false });
        expect(reads.at(-1)).toBe('mailFolders');
        expect(
          reads
            .slice(0, -1)
            .every((t) => t === 'mailSyncRuns' || t === 'mailSyncStates'),
        ).toBe(true);
        expect(reads.length).toBeGreaterThan(1);
      });

      it('reports a listing that failed after its first page, and completes it on retry', async () => {
        secondPage = 'fail';
        await settle();
        expect(await choices()).toMatchObject({
          complete: false,
          failed: true,
        });
        expect(await ids()).toEqual(['inbox']);

        secondPage = 'ok';
        await service().startSync(owner, { accountId });
        expect(await choices()).toMatchObject({
          complete: false,
          failed: false,
        });
        await settle();
        expect(await choices()).toMatchObject({
          complete: true,
          failed: false,
        });
        expect(await ids()).toEqual(['archive', 'inbox', 'inbox/child']);
        // The selection is still to be made, so nothing was imported.
        expect(await local()).toEqual({});
      });
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
