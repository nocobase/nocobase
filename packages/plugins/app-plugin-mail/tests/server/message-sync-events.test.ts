import type { DatabaseManager } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabaseMailStore,
  type DatabaseMailStore,
} from '../../server/store.js';
import { MailSyncStore } from '../../server/store/sync.js';
import type { MailSyncStepCommit } from '../../server/contracts/persistence.js';
import type { NormalizedMailMessage } from '../../server/contracts/provider.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const accountId = randomUUID();
const secondAccountId = randomUUID();

describe('durable message sync events', () => {
  let database: DatabaseManager;
  let store: DatabaseMailStore;
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    for (const id of [accountId, secondAccountId]) {
      await store.saveAccount({
        id,
        userId: 'owner',
        provider: { type: 'test', name: 'test' },
        address: `${id}@example.test`,
        credentialReference: 'test',
        scopes: [],
        status: 'active',
      });
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyMailTestDatabase(database);
  });

  async function step(
    messages: readonly NormalizedMailMessage[],
    overrides: Partial<MailSyncStepCommit> = {},
    targetAccountId: string = accountId,
  ) {
    const created = await store.createSyncRun({
      id: randomUUID(),
      accountId: targetAccountId,
      requestedBy: 'owner',
      mode: 'incremental',
      policy: { batchSize: 20 },
    });
    const claimed = await store.claimSyncRun(
      created.id,
      0,
      'preparing',
      randomUUID(),
      new Date(Date.now() + 60_000).toISOString(),
    );
    if (!claimed) throw new Error('Expected claimed run.');
    return {
      run: claimed,
      messages,
      phase: 'incremental' as const,
      status: 'completed' as const,
      createNextTask: false,
      ...overrides,
    };
  }

  it.each(['history', 'catchUp', 'incremental'] as const)(
    'records actual surviving inserts from %s with local IDs and transaction snapshot',
    async (phase) => {
      await store.saveMessage(accountId, message('existing'));
      const input = await step([
        message('existing'),
        message('new'),
        message('new'),
        message('deleted'),
      ]);
      const committed = await store.commitSyncStep({
        ...input,
        run: { ...input.run, phase },
        deletedProviderMessageIds: ['deleted'],
      });
      expect(committed.messageSyncEvents).toHaveLength(1);
      const event = committed.messageSyncEvents[0];
      expect(event).toMatchObject({
        accountId,
        ownerId: 'owner',
        syncRunId: input.run.id,
        phase,
      });
      expect(event?.messageIds).toHaveLength(1);
      expect(event?.messageIds[0]).not.toBe('new');
      expect(
        await store.getMessageForAccount(accountId, event!.messageIds[0]!),
      ).toMatchObject({ providerMessageId: 'new', folderIds: ['inbox'] });
      expect((await store.listMessageSyncEvents({ accountId })).items).toEqual(
        committed.messageSyncEvents,
      );
      expect(committed.revision).toBe(1);
    },
  );

  it('does not emit for legacy batches, updates, folder-only removals, pure deletes, empty pages, or inserts deleted in the same step', async () => {
    await store.commitSyncBatch({
      accountId,
      folders: [],
      messages: [message('legacy')],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor' },
    });
    for (const messages of [[], [message('legacy')], [message('gone')]]) {
      const result = await store.commitSyncStep(
        await step(messages, { deletedProviderMessageIds: ['gone'] }),
      );
      expect(result.messageSyncEvents).toEqual([]);
    }
    const legacy = (await store.listAllMessages({})).items[0];
    if (!legacy) throw new Error('Missing legacy message fixture.');
    const folderOnly = await store.commitSyncStep(
      await step([], {
        removedFromFolders: [
          { providerMessageId: 'legacy', providerFolderId: 'inbox' },
        ],
      }),
    );
    expect(folderOnly.messageSyncEvents).toEqual([]);
    expect(
      await store.getMessageForAccount(accountId, legacy.id),
    ).toMatchObject({
      folderIds: [],
    });
    const deleteOnly = await store.commitSyncStep(
      await step([], { deletedProviderMessageIds: ['legacy'] }),
    );
    expect(deleteOnly.messageSyncEvents).toEqual([]);
    expect(
      await store.getMessageForAccount(accountId, legacy.id),
    ).toBeUndefined();
    expect(await store.listMessageSyncEvents({ accountId })).toMatchObject({
      items: [],
      checkpoint: expect.any(String),
    });
  });

  it.each(['lease', 'outbox'] as const)(
    'rolls back messages, event rows and sequence after %s failure',
    async (failure) => {
      const input = await step([message('new')]);
      if (failure === 'outbox') {
        const now = new Date().toISOString();
        await database
          .query()
          .insertInto('mailOutbox')
          .values({
            id: randomUUID(),
            type: 'syncMailbox',
            aggregateId: input.run.id,
            deduplicationKey: `sync:${input.run.id}:1:incremental`,
            payload: '{}',
            status: 'pending',
            attempts: 0,
            availableAt: now,
            createdAt: now,
          })
          .execute();
      }
      await expect(
        store.commitSyncStep({
          ...input,
          run: {
            ...input.run,
            leaseToken: failure === 'lease' ? 'lost' : input.run.leaseToken,
          },
          createNextTask: failure === 'outbox',
        }),
      ).rejects.toThrow();
      expect((await store.listAllMessages({})).items).toEqual([]);
      expect((await store.listMessageSyncEvents({ accountId })).items).toEqual(
        [],
      );
      expect(
        await database
          .query()
          .selectFrom('mailMessageSyncEventStates')
          .selectAll()
          .execute(),
      ).toEqual([]);
      await store.commitSyncStep(input);
      const rows = await database
        .query()
        .selectFrom('mailMessageSyncEvents')
        .select('sequence')
        .execute<{ sequence: number | string }>();
      expect(Number(rows[0]?.sequence)).toBe(1);
      await expect(store.commitSyncStep(input)).rejects.toThrow();
      expect(
        (await store.listMessageSyncEvents({ accountId })).items,
      ).toHaveLength(1);
    },
  );

  it('does not perform a fallible post-transaction sync run readback', async () => {
    const input = await step([message('new')]);
    const sync = new MailSyncStore(database, store);
    vi.spyOn(sync, 'getSyncRun').mockRejectedValue(
      new Error('readback unavailable'),
    );
    const result = await sync.commitSyncStep(input);
    expect(result.messageSyncEvents).toHaveLength(1);
    expect(result.status).toBe('completed');
  });

  it('chunks IDs into bounded events and allocates contiguous sequences', async () => {
    const result = await store.commitSyncStep(
      await step(
        Array.from({ length: 205 }, (_, index) => message(`m${index}`)),
      ),
    );
    expect(
      result.messageSyncEvents.map((event) => event.messageIds.length),
    ).toEqual([100, 100, 5]);
    const ids = result.messageSyncEvents.flatMap((event) => event.messageIds);
    expect(new Set(ids).size).toBe(205);
    const page = await store.listMessageSyncEvents({ accountId });
    expect(page.items).toEqual(result.messageSyncEvents);
  });

  it('fixes pagination upper bounds and returns a checkpoint only on the last page', async () => {
    for (let i = 0; i < 3; i++)
      await store.commitSyncStep(await step([message(`m${i}`)]));
    const first = await store.listMessageSyncEvents({ accountId, pageSize: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.checkpoint).toBeUndefined();
    expect(first.nextPageToken).toBeTypeOf('string');
    await store.commitSyncStep(await step([message('later')]));
    const second = await store.listMessageSyncEvents({
      accountId,
      pageToken: first.nextPageToken,
      pageSize: 1,
    });
    const last = await store.listMessageSyncEvents({
      accountId,
      pageToken: second.nextPageToken,
      pageSize: 1,
    });
    expect(last.items).toHaveLength(1);
    expect(last.nextPageToken).toBeUndefined();
    const next = await store.listMessageSyncEvents({
      accountId,
      after: last.checkpoint,
    });
    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.messageIds).not.toEqual(last.items[0]?.messageIds);
    expect(
      await store.listMessageSyncEvents({ accountId, after: next.checkpoint }),
    ).toMatchObject({ items: [], checkpoint: expect.any(String) });
  });

  it('uses monotonic local time and inclusive time boundaries independently of provider time and cursor reset', async () => {
    const future = '2090-01-01T00:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(future);
    const one = await store.commitSyncStep(
      await step([message('old-provider-date')]),
    );
    vi.restoreAllMocks();
    await store.clearSyncCursor(accountId);
    const two = await store.commitSyncStep(
      await step([message('clock-backwards')]),
    );
    expect(two.messageSyncEvents[0]?.syncedAt).toBe(future);
    expect(
      (await store.listMessageSyncEvents({ accountId, syncedSince: future }))
        .items,
    ).toEqual([...one.messageSyncEvents, ...two.messageSyncEvents]);
    expect(
      (
        await store.listMessageSyncEvents({
          accountId,
          syncedSince: '2091-01-01T00:00:00Z',
        })
      ).items,
    ).toEqual([]);
  });

  it('rejects unsafe inputs and cross-account, malformed or out-of-range tokens', async () => {
    const empty = await store.listMessageSyncEvents({ accountId });
    for (const input of [
      { syncedSince: 'not-a-date' },
      { syncedSince: '2026-02-30T00:00:00Z' },
      { syncedSince: '2026-01-01' },
      { pageSize: 0 },
      { pageSize: 201 },
      { pageSize: 1.5 },
      { after: '' },
      { after: '***' },
      { syncedSince: '2026-01-01T00:00:00Z', after: empty.checkpoint },
      { pageToken: empty.checkpoint },
      {
        after: encode({
          version: 2,
          kind: 'checkpoint',
          accountId,
          sequence: 0,
        }),
      },
      {
        after: encode({
          version: 1,
          kind: 'checkpoint',
          accountId,
          sequence: 1,
        }),
      },
      {
        after: encode({
          version: 1,
          kind: 'checkpoint',
          accountId,
          sequence: -1,
        }),
      },
      {
        after: encode({
          version: 1,
          kind: 'checkpoint',
          accountId,
          sequence: Number.MAX_SAFE_INTEGER + 1,
        }),
      },
      {
        after: encode({
          version: 1,
          kind: 'checkpoint',
          accountId,
          sequence: 0,
          extra: true,
        }),
      },
    ])
      await expect(
        store.listMessageSyncEvents({ accountId, ...input }),
      ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({
        accountId: secondAccountId,
        after: empty.checkpoint,
      }),
    ).rejects.toThrow();
    await store.commitSyncStep(await step([message('m1')]));
    await store.commitSyncStep(await step([message('m2')]));
    const first = await store.listMessageSyncEvents({ accountId, pageSize: 1 });
    await expect(
      store.listMessageSyncEvents({
        accountId,
        pageToken: first.nextPageToken,
        after: empty.checkpoint,
      }),
    ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({
        accountId,
        pageToken: first.nextPageToken,
        syncedSince: '2026-01-01T00:00:00Z',
      }),
    ).rejects.toThrow();
  });

  it('rejects forged paging ranges, noncanonical tokens, filter combinations and token kinds', async () => {
    for (let i = 0; i < 3; i++)
      await store.commitSyncStep(await step([message(`m${i}`)]));
    const first = await store.listMessageSyncEvents({ accountId, pageSize: 1 });
    const token = JSON.parse(
      Buffer.from(first.nextPageToken!, 'base64url').toString(),
    ) as Record<string, unknown>;
    for (const patch of [
      { version: 2 },
      { kind: 'checkpoint' },
      { accountId: secondAccountId },
      { upperSequence: 4 },
      { upperSequence: 0 },
      { sequence: 0 },
      { sequence: 3 },
      { sequence: -1 },
      { afterSequence: 2 },
      { upperSequence: 1.5 },
      { syncedSince: 'not-a-date' },
      { syncedSince: '2026-01-01T01:00:00+01:00' },
      { syncedSince: '2026-01-01T00:00:00.000Z', afterSequence: 1 },
      { syncedSince: '9999-01-01T00:00:00.000Z' },
      { extra: true },
    ])
      await expect(
        store.listMessageSyncEvents({
          accountId,
          pageToken: encode({ ...token, ...patch }),
        }),
      ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({ accountId, after: first.nextPageToken }),
    ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({
        accountId,
        pageToken: `${first.nextPageToken}=`,
      }),
    ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({
        accountId,
        pageToken: Buffer.from('{"version":1,"version":1}').toString(
          'base64url',
        ),
      }),
    ).rejects.toThrow();
    await expect(
      store.listMessageSyncEvents({ accountId, after: 'a'.repeat(4097) }),
    ).rejects.toThrow();
  });

  it('serializes concurrent account commits and rejects replay without consuming another sequence', async () => {
    const first = await step([message('one')]);
    // Model independent leased runs: the account lock, not an active-run hint,
    // must serialize the event-state writes.
    await database
      .query()
      .updateTable('mailSyncRuns')
      .set({ activeKey: null })
      .where('id', '=', first.run.id)
      .execute();
    const second = await step([message('two')]);
    const results = await Promise.all([
      store.commitSyncStep(first),
      store.commitSyncStep(second),
    ]);
    expect(results.flatMap((run) => run.messageSyncEvents)).toHaveLength(2);
    const rows = await database
      .query()
      .selectFrom('mailMessageSyncEvents')
      .select('sequence')
      .orderBy('sequence')
      .execute<{ sequence: number | string }>();
    expect(rows.map((row) => Number(row.sequence))).toEqual([1, 2]);
    await expect(store.commitSyncStep(first)).rejects.toThrow();
    expect(
      (await store.listMessageSyncEvents({ accountId })).items,
    ).toHaveLength(2);
    const other = await store.commitSyncStep(
      await step([message('one')], {}, secondAccountId),
    );
    expect(other.messageSyncEvents[0]?.accountId).toBe(secondAccountId);
    const otherRows = await database
      .query()
      .selectFrom('mailMessageSyncEvents')
      .select('sequence')
      .where('accountId', '=', secondAccountId)
      .execute<{ sequence: number | string }>();
    expect(Number(otherRows[0]?.sequence)).toBe(1);
  });

  it('preserves bigint precision and atomically rejects sequence overflow', async () => {
    await database
      .query()
      .insertInto('mailMessageSyncEventStates')
      .values({
        accountId,
        lastSequence: Number.MAX_SAFE_INTEGER - 1,
        lastSyncedAt: '2000-01-01T00:00:00.000Z',
      })
      .execute();
    const result = await store.commitSyncStep(await step([message('last')]));
    const page = await store.listMessageSyncEvents({ accountId });
    expect(page.items).toEqual(result.messageSyncEvents);
    const row = await database
      .query()
      .selectFrom('mailMessageSyncEvents')
      .select('sequence')
      .executeTakeFirst<{ sequence: number | string }>();
    expect(Number(row?.sequence)).toBe(Number.MAX_SAFE_INTEGER);
    await expect(
      store.commitSyncStep(await step([message('overflow')])),
    ).rejects.toThrow('sequence was exhausted');
    expect((await store.listAllMessages({})).items).toHaveLength(1);
    expect(
      (await store.listMessageSyncEvents({ accountId, after: page.checkpoint }))
        .items,
    ).toEqual([]);
  });

  it('suppresses accepted and closed drafts and preserves complete content and newer history writes', async () => {
    await store.createSubmission(
      {
        id: randomUUID(),
        accountId,
        status: 'accepted',
        providerMessageId: 'accepted',
      },
      'accepted',
      'fingerprint',
    );
    await store.closeDraft(accountId, undefined, 'closed');
    const existing = await store.saveMessage(accountId, message('protected'));
    const input = await step(
      [
        { ...message('accepted'), draft: true },
        { ...message('local-draft:closed'), draft: true },
        {
          ...message('protected'),
          subject: 'must not overwrite',
          contentStatus: 'deferred',
        },
        { ...message('deferred-new'), contentStatus: 'deferred' },
      ],
      { historyPage: true },
    );
    const result = await store.commitSyncStep({
      ...input,
      run: {
        ...input.run,
        phase: 'history',
        historyStartedAt: existing.updatedAt,
      },
    });
    expect(result.messageSyncEvents).toHaveLength(1);
    expect(result.messageSyncEvents[0]?.messageIds).toHaveLength(1);
    expect(
      await store.getMessageForAccount(accountId, existing.id),
    ).toMatchObject({ subject: 'protected', contentStatus: 'complete' });
    const removed = await store.commitSyncStep(
      await step([], {
        removedFromFolders: [
          { providerMessageId: 'protected', providerFolderId: 'inbox' },
        ],
        deletedProviderMessageIds: ['protected'],
      }),
    );
    expect(removed.messageSyncEvents).toEqual([]);
  });

  it('normalizes RFC 3339 offsets and honors sub-millisecond lower bounds', async () => {
    const result = await store.commitSyncStep(await step([message('new')]));
    const time = result.messageSyncEvents[0]!.syncedAt;
    const offsetTime = new Date(Date.parse(time) + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('Z', '+08:00');
    expect(
      (
        await store.listMessageSyncEvents({
          accountId,
          syncedSince: offsetTime,
        })
      ).items,
    ).toEqual(result.messageSyncEvents);
    expect(
      (
        await store.listMessageSyncEvents({
          accountId,
          syncedSince: time.replace('Z', '1Z'),
        })
      ).items,
    ).toEqual([]);
  });

  it('cleans the event log in bounded account-removal batches', async () => {
    const now = new Date().toISOString();
    await database
      .query()
      .insertInto('mailMessageSyncEventStates')
      .values({ accountId, lastSequence: 501, lastSyncedAt: now })
      .execute();
    for (let offset = 0; offset < 501; offset += 25) {
      await database
        .query()
        .insertInto('mailMessageSyncEvents')
        .values(
          Array.from({ length: Math.min(25, 501 - offset) }, (_, index) => ({
            id: randomUUID(),
            accountId,
            sequence: offset + index + 1,
            ownerId: 'owner',
            syncRunId: randomUUID(),
            phase: 'incremental',
            syncedAt: now,
            messageIds: '[]',
          })),
        )
        .execute();
    }
    await store.markAccountRemoving(accountId, 'owner');
    const task = await store.claimAccountRemoval();
    if (!task) throw new Error('Expected removal task.');
    expect(await store.deleteAccountBatch(task)).toBe(false);
    expect(
      await database
        .query()
        .selectFrom('mailMessageSyncEvents')
        .select('id')
        .execute(),
    ).toHaveLength(1);
    expect(await store.deleteAccountBatch(task)).toBe(false);
    expect(await store.deleteAccountBatch(task)).toBe(true);
    expect(await store.finishAccountRemoval(task)).toBe(true);
    expect(
      await database
        .query()
        .selectFrom('mailMessageSyncEventStates')
        .selectAll()
        .execute(),
    ).toEqual([]);
  });

  it('retains historical IDs after message/run deletion and cascades at final account deletion', async () => {
    const result = await store.commitSyncStep(await step([message('new')]));
    const event = result.messageSyncEvents[0]!;
    await store.deleteMessage(accountId, event.messageIds[0]!);
    await database
      .query()
      .deleteFrom('mailSyncRuns')
      .where('id', '=', result.id)
      .execute();
    expect((await store.listMessageSyncEvents({ accountId })).items).toEqual([
      event,
    ]);
    await database
      .query()
      .deleteFrom('mailAccounts')
      .where('id', '=', accountId)
      .execute();
    expect(
      await database
        .query()
        .selectFrom('mailMessageSyncEvents')
        .selectAll()
        .execute(),
    ).toEqual([]);
    expect(
      await database
        .query()
        .selectFrom('mailMessageSyncEventStates')
        .selectAll()
        .execute(),
    ).toEqual([]);
  });
});

function message(providerMessageId: string): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: ['inbox'],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: providerMessageId,
    receivedAt: '2000-01-01T00:00:00.000Z',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}
function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
