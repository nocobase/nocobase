import { expectCollection } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabaseMailStore,
  type DatabaseMailStore,
} from '../../server/store.js';
import { MailSyncStore } from '../../server/store/sync.js';
import type {
  MailSyncStepCommit,
  MailSyncStepResult,
} from '../../server/contracts/persistence.js';
import type { NormalizedMailMessage } from '../../server/contracts/provider.js';
import type { MailMessageSummary, MailSyncRun } from '../../shared/mail.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { testId } from '../helpers/test-id.js';

const accountId = testId('snapshot-account');
const secondAccountId = testId('snapshot-second-account');
const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('transient message sync insertion snapshots', () => {
  let database: DatabaseManager;
  let store: DatabaseMailStore;
  let fixtureSequence: number;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    fixtureSequence = 0;
    for (const id of [accountId, secondAccountId]) {
      await store.saveAccount({
        id,
        userId: id === accountId ? 'owner' : 'second-owner',
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
    mode: 'initial' | 'incremental' = 'incremental',
  ): Promise<MailSyncStepCommit> {
    const created = await store.createSyncRun({
      id: testId(`snapshot-run-${++fixtureSequence}`),
      accountId: targetAccountId,
      requestedBy: 'sync-operator',
      mode,
      policy: { batchSize: 20 },
    });
    return {
      run: await claim(created),
      messages,
      phase: 'incremental',
      status: 'completed',
      createNextTask: false,
      ...overrides,
    };
  }

  async function claim(run: MailSyncRun): Promise<MailSyncRun> {
    const claimed = await store.claimSyncRun(
      run.id,
      run.revision,
      run.phase,
      testId(`snapshot-lease-${++fixtureSequence}`),
      new Date(Date.now() + 60_000).toISOString(),
    );
    if (!claimed) throw new Error('Expected claimed run.');
    return claimed;
  }

  async function continueStep(
    run: MailSyncRun,
    messages: readonly NormalizedMailMessage[],
    overrides: Partial<MailSyncStepCommit> = {},
  ): Promise<MailSyncStepCommit> {
    return {
      run: await claim(run),
      messages,
      phase: run.phase,
      status: 'completed',
      createNextTask: false,
      ...overrides,
    };
  }

  async function mailbox(
    targetAccountId: string = accountId,
  ): Promise<readonly MailMessageSummary[]> {
    const items: MailMessageSummary[] = [];
    let cursor: string | undefined;
    do {
      const page = await store.listAllMessages({
        accountIds: [targetAccountId],
        limit: 200,
        cursor,
      });
      items.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return items;
  }

  function snapshotIds(result: MailSyncStepResult): readonly string[] {
    return result.messageSyncEvents.flatMap((event) => event.messageIds);
  }

  it('migrates ordinary mail collections without event journal tables or a journal read method', async () => {
    const connection = database.connection();
    await expectCollection(connection, 'mailMessages').toExist();
    await expectCollection(connection, 'mailSyncRuns').toExist();
    for (const name of [
      'mailMessageSyncEvents',
      'mailMessageSyncEventStates',
    ]) {
      expect(await connection.collections.get(name)).toBeUndefined();
      await expectCollection(connection, name).not.toExist();
    }
    expect(store).not.toHaveProperty('listMessageSyncEvents');
    expect(new MailSyncStore(database, store)).not.toHaveProperty(
      'listMessageSyncEvents',
    );
  });

  it.each(['history', 'catchUp', 'incremental'] as const)(
    'returns only surviving inserts from %s, not updates or duplicate provider IDs',
    async (phase) => {
      const existing = await store.saveMessage(accountId, message('existing'));
      const preparation = await store.commitSyncStep(
        await step([], { phase, status: 'running' }),
      );
      const input = await continueStep(
        preparation,
        [
          { ...message('existing'), subject: 'Updated subject' },
          { ...message('new'), subject: 'First duplicate' },
          { ...message('new'), subject: 'Last duplicate' },
          message('deleted'),
        ],
        {
          phase: 'completed',
          deletedProviderMessageIds: ['deleted'],
          changeCursor: { value: `${phase}-cursor` },
        },
      );
      const before = Date.now();
      const committed = await store.commitSyncStep(input);
      const after = Date.now();
      expect(committed.messageSyncEvents).toHaveLength(1);
      const event = committed.messageSyncEvents[0]!;
      expect(event).toEqual({
        eventId: expect.stringMatching(uuidV4),
        accountId,
        ownerId: 'owner',
        syncRunId: input.run.id,
        phase,
        syncedAt: expect.any(String),
        messageIds: [expect.stringMatching(uuidV4)],
      });
      expect(Date.parse(event.syncedAt)).toBeGreaterThanOrEqual(before);
      expect(Date.parse(event.syncedAt)).toBeLessThanOrEqual(after);
      expect(new Date(event.syncedAt).toISOString()).toBe(event.syncedAt);
      expect(event.syncedAt).not.toBe(message('new').receivedAt);
      expect(Object.isFrozen(event)).toBe(true);
      expect(Object.isFrozen(event.messageIds)).toBe(true);
      expect(event.messageIds).not.toContain(existing.id);
      expect(
        await store.getMessageForAccount(accountId, event.messageIds[0]!),
      ).toMatchObject({
        providerMessageId: 'new',
        subject: 'Last duplicate',
        folderIds: ['inbox'],
      });
      expect(
        await store.getMessageForAccount(accountId, existing.id),
      ).toMatchObject({ subject: 'Updated subject' });
      expect(
        (await mailbox()).map((row) => row.providerMessageId).sort(),
      ).toEqual(['existing', 'new']);
      expect(committed).toMatchObject({
        revision: 2,
        phase: 'completed',
        status: 'completed',
        processedMessages: 4,
        processedPages: 2,
      });
      expect(await store.getSyncRun(input.run.id)).toEqual(
        expect.objectContaining({
          revision: 2,
          status: 'completed',
          processedMessages: 4,
          processedPages: 2,
        }),
      );
      expect(await store.getSyncCursor(accountId)).toEqual({
        value: `${phase}-cursor`,
      });
    },
  );

  it('returns empty snapshots for legacy batches, updates, empty pages, folder-only removals and pure deletes', async () => {
    expect(
      await store.commitSyncBatch({
        accountId,
        folders: [],
        messages: [message('legacy')],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'legacy-cursor' },
      }),
    ).toBeUndefined();
    const legacy = (await mailbox())[0]!;
    for (const messages of [
      [],
      [{ ...message('legacy'), subject: 'Updated legacy' }],
      [message('gone')],
    ]) {
      const input = await step(messages, {
        deletedProviderMessageIds: ['gone'],
      });
      const result = await store.commitSyncStep(input);
      expect(result.messageSyncEvents).toEqual([]);
      expect(await store.getSyncRun(input.run.id)).toMatchObject({
        revision: 1,
        status: 'completed',
      });
      expect(await mailbox()).toHaveLength(1);
    }
    expect(
      await store.getMessageForAccount(accountId, legacy.id),
    ).toMatchObject({ subject: 'Updated legacy' });
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
    ).toMatchObject({ folderIds: [] });
    const deleteOnly = await store.commitSyncStep(
      await step([], { deletedProviderMessageIds: ['legacy'] }),
    );
    expect(deleteOnly.messageSyncEvents).toEqual([]);
    expect(await mailbox()).toEqual([]);
    expect(await store.getSyncCursor(accountId)).toEqual({
      value: 'legacy-cursor',
    });
  });

  it('includes a new message surviving folder removal but excludes every same-page deletion', async () => {
    const result = await store.commitSyncStep(
      await step(
        [message('survivor'), message('deleted'), message('deleted')],
        {
          removedFromFolders: [
            { providerMessageId: 'survivor', providerFolderId: 'inbox' },
          ],
          deletedProviderMessageIds: ['deleted', 'deleted'],
        },
      ),
    );
    const rows = await mailbox();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      providerMessageId: 'survivor',
      folderIds: [],
    });
    expect(snapshotIds(result)).toEqual([rows[0]!.id]);
  });

  it.each([101, 205])(
    'chunks %i inserted IDs into independent snapshots of at most 100',
    async (count) => {
      const result = await store.commitSyncStep(
        await step(
          Array.from({ length: count }, (_, index) => message(`m${index}`)),
        ),
      );
      expect(
        result.messageSyncEvents.map((event) => event.messageIds.length),
      ).toEqual(count === 101 ? [100, 1] : [100, 100, 5]);
      const ids = snapshotIds(result);
      expect(ids).toHaveLength(count);
      expect(new Set(ids).size).toBe(count);
      expect([...ids].sort()).toEqual(
        (await mailbox()).map((row) => row.id).sort(),
      );
      const events = result.messageSyncEvents;
      expect(new Set(events.map((event) => event.eventId)).size).toBe(
        events.length,
      );
      expect(new Set(events.map((event) => event.syncedAt)).size).toBe(1);
      for (const event of events) {
        expect(event.eventId).toMatch(uuidV4);
        expect(event).toMatchObject({
          accountId,
          ownerId: 'owner',
          syncRunId: result.id,
          phase: 'incremental',
        });
        expect(event).not.toHaveProperty('sequence');
        expect(Object.isFrozen(event.messageIds)).toBe(true);
      }
      expect(result).toMatchObject({
        processedMessages: count,
        processedPages: 1,
        status: 'completed',
      });
    },
  );

  it.each(['lease', 'account', 'revision', 'outbox'] as const)(
    'rolls back messages, folders, cursor and run state after a %s failure',
    async (failure) => {
      await store.commitSyncBatch({
        accountId,
        folders: [],
        messages: [message('existing')],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'original-cursor' },
      });
      const original = (await mailbox())[0]!;
      let input = await step(
        [{ ...message('existing'), subject: 'Must roll back' }, message('new')],
        {
          folders: [
            {
              providerFolderId: 'new-folder',
              name: 'New folder',
              type: 'inbox',
              kind: 'folder',
            },
          ],
          changeCursor: { value: 'next-cursor' },
          createNextTask: true,
        },
      );
      if (failure === 'lease') {
        input = {
          ...input,
          run: { ...input.run, leaseToken: testId('lost-lease') },
        };
      } else if (failure === 'account') {
        await database
          .query()
          .updateTable('mailAccounts')
          .set({ status: 'removing' })
          .where('id', '=', accountId)
          .execute();
      } else if (failure === 'revision') {
        await store.cancelSyncRun(input.run.id);
        expect(
          await store.claimSyncRun(
            input.run.id,
            input.run.revision,
            input.run.phase,
            testId('stale-revision-lease'),
            new Date(Date.now() + 60_000).toISOString(),
          ),
        ).toBeUndefined();
      } else {
        const now = new Date().toISOString();
        await database
          .query()
          .insertInto('mailOutbox')
          .values({
            id: testId('conflicting-outbox'),
            type: 'syncMailbox',
            aggregateId: input.run.id,
            deduplicationKey: `sync:${input.run.id}:1:incremental`,
            payload: JSON.stringify({
              version: 1,
              syncRunId: input.run.id,
              expectedRevision: 1,
              expectedPhase: 'incremental',
            }),
            status: 'pending',
            attempts: 0,
            availableAt: now,
            createdAt: now,
          })
          .execute();
      }
      const runBefore = await store.getSyncRun(input.run.id);
      const outboxBefore = await database
        .query()
        .selectFrom('mailOutbox')
        .selectAll()
        .orderBy('id')
        .execute();
      await expect(store.commitSyncStep(input)).rejects.toThrow();
      expect(await mailbox()).toEqual([original]);
      expect(await store.listFolders(accountId)).toEqual([]);
      expect(await store.getSyncCursor(accountId)).toEqual({
        value: 'original-cursor',
      });
      expect(await store.getSyncRun(input.run.id)).toEqual(runBefore);
      expect(
        await database
          .query()
          .selectFrom('mailOutbox')
          .selectAll()
          .orderBy('id')
          .execute(),
      ).toEqual(outboxBefore);

      // A failed transaction must not suppress the insert on the next valid step.
      if (failure === 'account') {
        await database
          .query()
          .updateTable('mailAccounts')
          .set({ status: 'active' })
          .where('id', '=', accountId)
          .execute();
      }
      if (failure === 'outbox') {
        await database
          .query()
          .deleteFrom('mailOutbox')
          .where('id', '=', testId('conflicting-outbox'))
          .execute();
      }
      const retry =
        failure === 'revision'
          ? await step(input.messages, { changeCursor: input.changeCursor })
          : { ...input, run: runBefore! };
      const committed = await store.commitSyncStep(retry);
      expect(committed.messageSyncEvents).toHaveLength(1);
      const inserted = await store.getMessageForAccount(
        accountId,
        snapshotIds(committed)[0]!,
      );
      expect(inserted).toMatchObject({ providerMessageId: 'new' });
      expect(await mailbox()).toHaveLength(2);
      expect(await store.getSyncCursor(accountId)).toEqual({
        value: 'next-cursor',
      });
      await expect(store.commitSyncStep(retry)).rejects.toThrow();
      expect(await mailbox()).toHaveLength(2);
    },
  );

  it('captures the result within the transaction without a fallible post-commit run readback', async () => {
    const input = await step([message('new')], {
      changeCursor: { value: 'committed-cursor' },
    });
    const sync = new MailSyncStore(database, store);
    vi.spyOn(sync, 'getSyncRun').mockRejectedValue(
      new Error('readback unavailable'),
    );
    const result = await sync.commitSyncStep(input);
    expect(result.messageSyncEvents).toHaveLength(1);
    expect(result.status).toBe('completed');
    expect(
      await store.getMessageForAccount(accountId, snapshotIds(result)[0]!),
    ).toMatchObject({ providerMessageId: 'new' });
    expect(await store.getSyncRun(result.id)).toMatchObject({
      status: 'completed',
      revision: 1,
    });
    expect(await store.getSyncCursor(accountId)).toEqual({
      value: 'committed-cursor',
    });
  });

  it('suppresses accepted and closed drafts, preserving complete content and newer history writes', async () => {
    await store.createSubmission(
      {
        id: testId('accepted-submission'),
        accountId,
        status: 'accepted',
        providerMessageId: 'accepted',
      },
      'accepted',
      'fingerprint',
    );
    await store.closeDraft(accountId, undefined, 'closed');
    const protectedMessage = await store.saveMessage(accountId, {
      ...message('protected'),
      text: 'Complete protected body',
      contentStatus: 'complete',
    });
    const complete = await store.saveMessage(accountId, {
      ...message('complete'),
      text: 'Complete body',
      contentStatus: 'complete',
    });
    const input = await step(
      [
        { ...message('accepted'), draft: true },
        { ...message('local-draft:closed'), draft: true },
        {
          ...message('protected'),
          subject: 'Must not overwrite',
          contentStatus: 'complete',
        },
        {
          ...message('complete'),
          subject: 'Must not defer',
          contentStatus: 'deferred',
        },
        { ...message('deferred-new'), contentStatus: 'deferred' },
      ],
      { phase: 'history', historyPage: true },
    );
    const result = await store.commitSyncStep({
      ...input,
      run: { ...input.run, historyStartedAt: protectedMessage.updatedAt },
    });
    expect(snapshotIds(result)).toHaveLength(1);
    expect(
      await store.getMessageForAccount(accountId, snapshotIds(result)[0]!),
    ).toMatchObject({
      providerMessageId: 'deferred-new',
      contentStatus: 'deferred',
    });
    expect(
      await store.getMessageForAccount(accountId, protectedMessage.id),
    ).toMatchObject({
      subject: 'protected',
      text: 'Complete protected body',
      contentStatus: 'complete',
    });
    expect(
      await store.getMessageForAccount(accountId, complete.id),
    ).toMatchObject({
      subject: 'complete',
      text: 'Complete body',
      contentStatus: 'complete',
    });
    expect(
      (await mailbox()).map((row) => row.providerMessageId).sort(),
    ).toEqual(['complete', 'deferred-new', 'protected']);
    expect(result).toMatchObject({ status: 'partial', pendingMessages: 1 });
    const deferredUpdate = await store.commitSyncStep(
      await step([
        {
          ...message('complete'),
          subject: 'Must not defer',
          contentStatus: 'deferred',
        },
      ]),
    );
    expect(deferredUpdate.messageSyncEvents).toEqual([]);
    expect(
      await store.getMessageForAccount(accountId, complete.id),
    ).toMatchObject({
      subject: 'complete',
      text: 'Complete body',
      contentStatus: 'complete',
    });
  });

  it('does not resurrect deleted initial-sync messages or emit again on history replay', async () => {
    const first = await store.commitSyncStep(
      await step(
        [message('survivor'), message('deleted')],
        {
          phase: 'catchUp',
          status: 'running',
          deletedProviderMessageIds: ['deleted'],
        },
        accountId,
        'initial',
      ),
    );
    expect(snapshotIds(first)).toHaveLength(1);
    const replay = await store.commitSyncStep(
      await continueStep(first, [], {
        phase: 'history',
        status: 'running',
      }),
    );
    expect(replay.messageSyncEvents).toEqual([]);
    const history = await store.commitSyncStep(
      await continueStep(
        replay,
        [
          { ...message('survivor'), subject: 'Stale replay' },
          message('deleted'),
        ],
        { historyPage: true },
      ),
    );
    expect(history.messageSyncEvents).toEqual([]);
    expect(await mailbox()).toHaveLength(1);
    expect(
      await store.getMessageForAccount(accountId, snapshotIds(first)[0]!),
    ).toMatchObject({ providerMessageId: 'survivor', subject: 'survivor' });
    expect(await store.getSyncRun(first.id)).toMatchObject({
      status: 'completed',
      revision: 3,
      processedPages: 3,
    });
    expect(
      await database
        .query()
        .selectFrom('mailSyncTombstones')
        .selectAll()
        .where('runId', '=', first.id)
        .execute(),
    ).toEqual([]);
  });

  it('keeps a first-page snapshot and committed mail across an empty page and later failure', async () => {
    await store.commitSyncBatch({
      accountId,
      folders: [],
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'previous-cursor' },
    });
    const first = await store.commitSyncStep(
      await step(
        [message('historic')],
        {
          phase: 'history',
          status: 'running',
          historyPage: true,
          historyCursor: 'second-page',
          createNextTask: true,
        },
        accountId,
        'initial',
      ),
    );
    expect(first.messageSyncEvents).toHaveLength(1);
    const savedSnapshot = structuredClone(first.messageSyncEvents[0]!);
    expect(await store.getSyncRun(first.id)).toMatchObject({
      phase: 'history',
      status: 'running',
      revision: 1,
      historyCursor: 'second-page',
      processedMessages: 1,
    });
    const empty = await store.commitSyncStep(
      await continueStep(first, [], {
        phase: 'catchUp',
        status: 'running',
        historyComplete: true,
      }),
    );
    expect(empty.messageSyncEvents).toEqual([]);
    const failed = await store.failSyncRun(await claim(empty), {
      code: 'LATER_PAGE_FAILED',
      message: 'Later page failed.',
      category: 'configuration',
      retryable: false,
    });
    expect(failed).toMatchObject({
      status: 'failed',
      phase: 'catchUp',
      revision: 2,
      processedMessages: 1,
      processedPages: 2,
      historyComplete: true,
    });
    expect(await store.getSyncRun(first.id)).toEqual(failed);
    expect(await store.getSyncCursor(accountId)).toEqual({
      value: 'previous-cursor',
    });
    expect(await mailbox()).toHaveLength(1);
    expect(
      await store.getMessageForAccount(accountId, savedSnapshot.messageIds[0]!),
    ).toMatchObject({ providerMessageId: 'historic', subject: 'historic' });
    expect(first.messageSyncEvents).toEqual([savedSnapshot]);
  });

  it('allows only one competing commit of a leased page to return insertion snapshots', async () => {
    const input = await step([message('one')], {
      changeCursor: { value: 'winner-cursor' },
    });
    const outcomes = await Promise.allSettled([
      store.commitSyncStep(input),
      store.commitSyncStep(input),
    ]);
    const fulfilled = outcomes.filter(
      (outcome) => outcome.status === 'fulfilled',
    );
    expect(fulfilled).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === 'rejected'),
    ).toHaveLength(1);
    const result = fulfilled[0]!.value;
    expect(snapshotIds(result)).toHaveLength(1);
    expect((await mailbox()).map((row) => row.id)).toEqual(snapshotIds(result));
    expect(await store.getSyncRun(input.run.id)).toMatchObject({
      status: 'completed',
      revision: 1,
      processedPages: 1,
      processedMessages: 1,
    });
    expect(await store.getSyncCursor(accountId)).toEqual({
      value: 'winner-cursor',
    });
    await expect(store.commitSyncStep(input)).rejects.toThrow();
    const repeated = await store.commitSyncStep(await step([message('one')]));
    expect(repeated.messageSyncEvents).toEqual([]);
    expect(await mailbox()).toHaveLength(1);
  });

  it('serializes independent account runs so the same provider ID is snapshotted only once per account', async () => {
    const first = await step([message('shared')]);
    // Independent leased runs exercise the account write lock, not the active-run hint.
    await database
      .query()
      .updateTable('mailSyncRuns')
      .set({ activeKey: null })
      .where('id', '=', first.run.id)
      .execute();
    const second = await step([message('shared')]);
    const results = await Promise.all([
      store.commitSyncStep(first),
      store.commitSyncStep(second),
    ]);
    expect(results.map((result) => snapshotIds(result).length).sort()).toEqual([
      0, 1,
    ]);
    expect(results.flatMap((result) => snapshotIds(result))).toEqual(
      (await mailbox()).map((row) => row.id),
    );
    for (const input of [first, second]) {
      expect(await store.getSyncRun(input.run.id)).toMatchObject({
        revision: 1,
        status: 'completed',
        processedPages: 1,
      });
    }
    const other = await store.commitSyncStep(
      await step([message('shared')], {}, secondAccountId),
    );
    expect(other.messageSyncEvents).toHaveLength(1);
    expect(other.messageSyncEvents[0]).toMatchObject({
      accountId: secondAccountId,
      ownerId: 'second-owner',
      syncRunId: other.id,
    });
    expect(snapshotIds(other)[0]).not.toBe(
      results.flatMap((result) => snapshotIds(result))[0],
    );
    expect(await mailbox(secondAccountId)).toHaveLength(1);
  });

  it('keeps returned insertion DTOs unchanged when later mail and run state are deleted', async () => {
    const result = await store.commitSyncStep(await step([message('new')]));
    const snapshot = structuredClone(result.messageSyncEvents[0]!);
    await store.deleteMessage(accountId, snapshot.messageIds[0]!);
    await database
      .query()
      .deleteFrom('mailSyncRuns')
      .where('id', '=', result.id)
      .execute();
    expect(await mailbox()).toEqual([]);
    expect(await store.getSyncRun(result.id)).toBeUndefined();
    expect(result.messageSyncEvents).toEqual([snapshot]);
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
