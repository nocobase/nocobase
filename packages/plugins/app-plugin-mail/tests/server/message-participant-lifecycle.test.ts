import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../shared/mail.js';
import type { MailComposeInput, MailSyncRun } from '../../shared/mail.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailMessageParticipantRow } from '../../server/store/message-participants.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const ids = {
  account: '20000000-0000-4000-8000-000000000001',
  otherAccount: '20000000-0000-4000-8000-000000000002',
  owner: '20000000-0000-4000-8000-000000000003',
  identity: '20000000-0000-4000-8000-000000000004',
  submission: '20000000-0000-4000-8000-000000000005',
  run: '20000000-0000-4000-8000-000000000006',
  draftKey: '20000000-0000-4000-8000-000000000007',
};
const epoch = new Date('2026-10-10T00:00:00.000Z');
const scheduledAt = '2099-01-01T10:00:00.000Z';
const compose: MailComposeInput = {
  accountId: ids.account,
  identityId: ids.identity,
  idempotencyKey: 'lifecycle-send',
  to: [{ address: 'compose@example.com' }],
  subject: 'Scheduled snapshot',
  scheduledAt,
};

function message(
  providerMessageId: string,
  overrides: Partial<NormalizedMailMessage> = {},
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: ['inbox'],
    from: { address: 'Sender@Example.com' },
    to: [{ address: 'old@example.com' }],
    cc: [{ address: 'copy@example.com' }],
    bcc: [{ address: 'hidden@example.com' }],
    replyTo: [{ address: 'reply@example.com' }],
    references: [],
    subject: 'Original',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
    ...overrides,
  };
}

function snapshot(): NormalizedMailMessage {
  return message(`local-draft:${ids.draftKey}`, {
    providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
    from: { address: ' Latest@Example.com ' },
    to: [{ address: ' Snapshot@Other.Example.com ' }],
    cc: [],
    draft: true,
    subject: compose.subject,
  });
}

function row(
  messageId: string,
  role: MailMessageParticipantRow['role'],
  address: string,
  accountId = ids.account,
): MailMessageParticipantRow {
  return {
    messageId,
    accountId,
    role,
    address,
    domain: address.slice(address.lastIndexOf('@') + 1),
  };
}

function snapshotRows(messageId: string): MailMessageParticipantRow[] {
  return [
    row(messageId, 'from', 'latest@example.com'),
    row(messageId, 'to', 'snapshot@other.example.com'),
  ];
}

describe('Mail participant index lifecycle transactions', () => {
  let database: DatabaseManager;
  let store: MailStore;

  beforeEach(async () => {
    vi.useFakeTimers({ now: epoch, toFake: ['Date'] });
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    for (const id of [ids.account, ids.otherAccount]) {
      await store.saveAccount({
        id,
        userId: ids.owner,
        provider: { type: 'test', name: 'test' },
        address: `${id}@example.com`,
        credentialReference: 'test',
        scopes: [],
        status: 'active',
      });
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await destroyMailTestDatabase(database);
  });

  async function participants(messageId?: string) {
    let selection = database
      .query()
      .selectFrom('mailMessageParticipants')
      .selectAll();
    if (messageId) selection = selection.where('messageId', '=', messageId);
    return selection
      .orderBy('accountId')
      .orderBy('messageId')
      .orderBy('role')
      .orderBy('address')
      .execute<MailMessageParticipantRow>();
  }

  async function claim(run: MailSyncRun, token = 'worker') {
    const claimed = await store.claimSyncRun(
      run.id,
      run.revision,
      run.phase,
      token,
      new Date(Date.now() + 60_000).toISOString(),
    );
    if (!claimed) throw new Error('Expected a claimed synchronization run');
    return claimed;
  }

  async function createRun() {
    return claim(
      await store.createSyncRun({
        id: ids.run,
        accountId: ids.account,
        requestedBy: ids.owner,
        mode: 'initial',
        policy: { batchSize: 100 },
      }),
    );
  }

  async function tombstones() {
    return database
      .query()
      .selectFrom('mailSyncTombstones')
      .selectAll()
      .orderBy('providerMessageId')
      .execute();
  }

  it.each(['new', 'existing'] as const)(
    'indexes the %s scheduled snapshot, not compose recipients, and preserves it through refused edits and cancellation',
    async (kind) => {
      const original =
        kind === 'existing'
          ? await store.saveMessage(
              ids.account,
              message('remote-draft', { draft: true }),
            )
          : undefined;
      if (original) expect(await participants(original.id)).toHaveLength(3);
      const input = { ...compose, draftMessageId: original?.id };
      const submission = {
        id: ids.submission,
        accountId: ids.account,
        status: 'pending',
        scheduledAt,
      };
      await store.createScheduledSubmission(
        submission,
        input.idempotencyKey,
        'fingerprint',
        ids.owner,
        input,
        snapshot(),
      );
      const saved = await store.getScheduledSubmission(ids.submission);
      const draftId = saved!.input.draftMessageId!;
      if (original) expect(draftId).toBe(original.id);
      expect(await participants(draftId)).toEqual(snapshotRows(draftId));
      expect(
        await store.getMessageForAccount(ids.account, draftId),
      ).toMatchObject({
        providerMessageId: snapshot().providerMessageId,
        from: snapshot().from,
        to: snapshot().to,
        cc: [],
      });
      // Repeated delivery must neither replace the locked snapshot nor duplicate its index.
      await store.createScheduledSubmission(
        submission,
        input.idempotencyKey,
        'fingerprint',
        ids.owner,
        input,
        { ...snapshot(), to: [{ address: 'duplicate@example.com' }] },
      );
      await expect(
        store.saveMessage(ids.account, {
          ...snapshot(),
          to: [{ address: 'stale@example.com' }],
        }),
      ).rejects.toThrow(/Cancel/);
      expect(await participants(draftId)).toEqual(snapshotRows(draftId));
      await store.transitionSubmission(ids.submission, 'cancel');
      expect(await participants(draftId)).toEqual(snapshotRows(draftId));
      expect((await store.listAllMessages({})).items).toHaveLength(1);
    },
  );

  it.each(['message ID', 'draft key'] as const)(
    'createSubmission closes the draft selected by %s without leaving index rows or touching another account',
    async (selector) => {
      const draft = await store.saveMessage(ids.account, snapshot());
      const other = await store.saveMessage(ids.otherAccount, snapshot());
      const otherRows = await participants(other.id);
      expect(await participants(draft.id)).toEqual(snapshotRows(draft.id));
      const input: MailComposeInput = {
        ...compose,
        scheduledAt: undefined,
        ...(selector === 'message ID'
          ? { draftMessageId: draft.id }
          : { draftKey: ids.draftKey }),
      };
      const submission = {
        id: ids.submission,
        accountId: ids.account,
        status: 'pending',
      };
      await store.createSubmission(
        submission,
        input.idempotencyKey,
        'fingerprint',
        ids.owner,
        input,
      );
      expect(await participants(draft.id)).toEqual([]);
      expect(
        await store.getMessageForAccount(ids.account, draft.id),
      ).toBeUndefined();
      expect(await participants(other.id)).toEqual(otherRows);
      // Idempotency and a late provider draft must not recreate the closed index.
      await store.createSubmission(
        submission,
        input.idempotencyKey,
        'fingerprint',
        ids.owner,
        input,
      );
      await store.commitSyncBatch({
        accountId: ids.account,
        folders: [],
        messages: [snapshot()],
        deletedProviderMessageIds: [],
        nextCursor: { value: 'after-close' },
      });
      expect(await participants()).toEqual(otherRows);
    },
  );

  it('finishSubmission consumes an accepted scheduled draft only for the owning lease and leaves the sent index intact', async () => {
    await store.createScheduledSubmission(
      {
        id: ids.submission,
        accountId: ids.account,
        status: 'pending',
        scheduledAt,
      },
      compose.idempotencyKey,
      'fingerprint',
      ids.owner,
      compose,
      snapshot(),
    );
    const draftId = (await store.getScheduledSubmission(ids.submission))!.input
      .draftMessageId!;
    const sent = await store.saveMessage(ids.account, message('sent-copy'));
    const sentRows = await participants(sent.id);
    expect(await participants(draftId)).toEqual(snapshotRows(draftId));
    expect(
      await store.claimSubmission(ids.submission, 'sender', scheduledAt),
    ).toBe(true);
    const accepted = {
      id: ids.submission,
      accountId: ids.account,
      status: 'accepted',
      providerMessageId: 'sent-copy',
    };
    expect(
      await store.finishSubmission(accepted, 'stale-sender'),
    ).toMatchObject({
      status: 'submitting',
    });
    expect(await participants(draftId)).toEqual(snapshotRows(draftId));
    expect(await store.finishSubmission(accepted, 'sender')).toMatchObject({
      status: 'accepted',
    });
    expect(await participants(draftId)).toEqual([]);
    expect(
      await store.getMessageForAccount(ids.account, draftId),
    ).toBeUndefined();
    await store.finishSubmission(accepted, 'sender');
    expect(await participants()).toEqual(sentRows);
    expect(
      await store.getMessageForAccount(ids.account, sent.id),
    ).toBeDefined();
    expect(
      await database
        .query()
        .selectFrom('mailOutbox')
        .selectAll()
        .where('type', '=', 'requestMailboxSync')
        .execute(),
    ).toHaveLength(3);
  });

  it('commitSyncStep replaces accepted participant rows on the same ID, inserts new rows and removes emptied roles', async () => {
    const original = await store.saveMessage(ids.account, message('updated'));
    const other = await store.saveMessage(ids.otherAccount, message('updated'));
    const otherRows = await participants(other.id);
    expect(await participants(original.id)).toHaveLength(3);
    const run = await createRun();
    await store.commitSyncStep({
      run,
      messages: [
        message('updated', {
          from: undefined,
          to: [],
          cc: [{ address: ' New@Other.Example.com ' }],
        }),
        message('inserted', {
          from: undefined,
          cc: [],
          to: [{ address: 'inserted@example.com' }],
        }),
      ],
      phase: 'changes',
      status: 'running',
      createNextTask: false,
    });
    const saved = (await store.listAllMessages({})).items.find(
      (item) =>
        item.accountId === ids.account && item.providerMessageId === 'updated',
    )!;
    expect(saved.id).toBe(original.id);
    expect(saved).toMatchObject({
      to: [],
      cc: [{ address: ' New@Other.Example.com ' }],
    });
    expect(await participants(original.id)).toEqual([
      row(original.id, 'cc', 'new@other.example.com'),
    ]);
    const inserted = (await store.listAllMessages({})).items.find(
      (item) => item.providerMessageId === 'inserted',
    )!;
    expect(await participants(inserted.id)).toEqual([
      row(inserted.id, 'to', 'inserted@example.com'),
    ]);
    expect(await participants(other.id)).toEqual(otherRows);
  });

  it('commitSyncStep removes tombstoned indexes, ignores stale history, and permits a later live replacement', async () => {
    const deleted = await store.saveMessage(ids.account, message('deleted'));
    const survivor = await store.saveMessage(ids.account, message('survivor'));
    const survivorRows = await participants(survivor.id);
    expect(await participants(deleted.id)).toHaveLength(3);
    let run = await createRun();
    run = await store.commitSyncStep({
      run,
      messages: [],
      deletedProviderMessageIds: ['deleted', 'deleted', 'absent'],
      phase: 'history',
      status: 'running',
      createNextTask: false,
    });
    expect(await participants(deleted.id)).toEqual([]);
    expect(
      await store.getMessageForAccount(ids.account, deleted.id),
    ).toBeUndefined();
    expect(await tombstones()).toEqual([
      { runId: ids.run, providerMessageId: 'absent' },
      { runId: ids.run, providerMessageId: 'deleted' },
    ]);
    run = await store.commitSyncStep({
      run: await claim(run),
      historyPage: true,
      messages: [
        message('deleted', { to: [{ address: 'stale@example.com' }] }),
        message('absent'),
      ],
      phase: 'changes',
      status: 'running',
      createNextTask: false,
    });
    expect(await participants()).toEqual(survivorRows);
    vi.setSystemTime(new Date(Date.now() + 1_000));
    run = await store.commitSyncStep({
      run: await claim(run),
      messages: [
        message('deleted', {
          from: undefined,
          cc: [],
          to: [{ address: 'live@example.com' }],
        }),
      ],
      phase: 'history',
      status: 'running',
      createNextTask: false,
    });
    expect(await tombstones()).toEqual([
      { runId: ids.run, providerMessageId: 'absent' },
    ]);
    const live = (await store.listAllMessages({})).items.find(
      (item) => item.providerMessageId === 'deleted',
    )!;
    expect(live.id).not.toBe(deleted.id);
    const liveRows = [row(live.id, 'to', 'live@example.com')];
    expect(await participants(live.id)).toEqual(liveRows);
    await store.commitSyncStep({
      run: await claim(run),
      historyPage: true,
      messages: [message('deleted'), message('absent')],
      phase: 'completed',
      status: 'completed',
      createNextTask: false,
      changeCursor: { value: 'finished' },
    });
    expect(await participants(live.id)).toEqual(liveRows);
    expect(await participants(survivor.id)).toEqual(survivorRows);
    expect(await participants(deleted.id)).toEqual([]);
    expect(await tombstones()).toEqual([]);
    expect((await store.listAllMessages({})).items).toHaveLength(2);
    expect(await store.getSyncCursor(ids.account)).toEqual({
      value: 'finished',
    });
  });

  it.each(['reclaimed lease', 'cancelled run'] as const)(
    'rolls back participant replacements, inserts and deletions when commitSyncStep loses its %s guard',
    async (guard) => {
      const updated = await store.saveMessage(ids.account, message('updated'));
      const deleted = await store.saveMessage(ids.account, message('deleted'));
      const before = await participants();
      const old = await createRun();
      if (guard === 'reclaimed lease') {
        vi.setSystemTime(new Date(Date.now() + 61_000));
        await claim(old, 'new-worker');
      } else {
        await store.cancelSyncRun(old.id);
      }
      const current = await store.getSyncRun(old.id);
      const tasks = await database
        .query()
        .selectFrom('mailOutbox')
        .selectAll()
        .execute();
      await expect(
        store.commitSyncStep({
          run: old,
          messages: [
            message('updated', { to: [{ address: 'late@example.com' }] }),
            message('late-insert'),
          ],
          deletedProviderMessageIds: ['deleted'],
          phase: 'changes',
          status: 'running',
          createNextTask: true,
          changeCursor: { value: 'late' },
        }),
      ).rejects.toThrow('lease was lost');
      expect(await participants()).toEqual(before);
      expect(
        (await store.getMessageForAccount(ids.account, updated.id))?.to,
      ).toEqual(message('updated').to);
      expect(
        await store.getMessageForAccount(ids.account, deleted.id),
      ).toBeDefined();
      expect((await store.listAllMessages({})).items).toHaveLength(2);
      expect(await tombstones()).toEqual([]);
      expect(await store.getSyncRun(old.id)).toEqual(current);
      expect(await store.getSyncCursor(ids.account)).toBeUndefined();
      expect(
        await database.query().selectFrom('mailOutbox').selectAll().execute(),
      ).toEqual(tasks);
    },
  );
});
