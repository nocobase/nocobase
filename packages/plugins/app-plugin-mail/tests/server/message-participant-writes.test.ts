import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';
import * as participantWrites from '../../server/store/message-participants.js';
import { upsertMessages } from '../../server/store/message-writes.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const fixtureIds = {
  account: '10000000-0000-4000-8000-000000000001',
  otherAccount: '10000000-0000-4000-8000-000000000002',
  submission: '10000000-0000-4000-8000-000000000003',
};

const account = {
  id: fixtureIds.account,
  userId: 'owner',
  provider: { type: 'test', name: 'test' },
  address: 'owner@example.com',
  credentialReference: 'secret',
  scopes: [],
  status: 'active' as const,
};

function message(
  providerMessageId: string,
  overrides: Partial<NormalizedMailMessage> = {},
): NormalizedMailMessage {
  return {
    providerMessageId,
    providerFolderIds: ['inbox'],
    from: { address: 'Sender@Example.com' },
    to: [{ address: 'target@example.com' }],
    cc: [],
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

describe('transactional Mail participant writes and lifecycle', () => {
  let database: DatabaseManager;
  let store: MailStore;
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount(account);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyMailTestDatabase(database);
  });

  async function participants(messageId?: string) {
    let selection = database
      .query()
      .selectFrom('mailMessageParticipants')
      .selectAll();
    if (messageId) selection = selection.where('messageId', '=', messageId);
    return selection
      .orderBy('role')
      .orderBy('address')
      .execute<participantWrites.MailMessageParticipantRow>();
  }
  async function sync(
    messages: readonly NormalizedMailMessage[],
    deletedProviderMessageIds: readonly string[] = [],
    removedFromFolders: readonly {
      providerMessageId: string;
      providerFolderId: string;
    }[] = [],
  ) {
    await store.commitSyncBatch({
      accountId: account.id,
      folders: [],
      messages,
      deletedProviderMessageIds,
      removedFromFolders,
      nextCursor: { value: 'cursor' },
    });
  }

  it('inserts only From/To/Cc, replaces addresses and removes empty roles on the same message ID', async () => {
    const saved = await store.saveMessage(
      account.id,
      message('remote', {
        to: [
          { address: ' target@EXAMPLE.com ' },
          { address: 'target@example.com' },
        ],
        cc: [{ address: 'target@example.com' }],
      }),
    );
    expect(
      (await participants(saved.id)).map(({ role, address }) => ({
        role,
        address,
      })),
    ).toEqual([
      { role: 'cc', address: 'target@example.com' },
      { role: 'from', address: 'sender@example.com' },
      { role: 'to', address: 'target@example.com' },
    ]);
    const updated = await store.saveMessage(
      account.id,
      message('remote', {
        from: undefined,
        to: [],
        cc: [{ address: 'new@other.example.com' }],
      }),
    );
    expect(updated.id).toBe(saved.id);
    expect(await participants(saved.id)).toEqual([
      {
        messageId: saved.id,
        accountId: account.id,
        role: 'cc',
        address: 'new@other.example.com',
        domain: 'other.example.com',
      },
    ]);
    await store.saveMessage(
      account.id,
      message('remote', { from: undefined, to: [], cc: [] }),
    );
    expect(await participants(saved.id)).toEqual([]);
  });

  it('indexes only the final accepted copy of duplicate provider input', async () => {
    await sync([
      message('remote'),
      message('remote', { to: [{ address: 'last@example.com' }] }),
    ]);
    expect((await participants()).map((row) => row.address)).toEqual([
      'sender@example.com',
      'last@example.com',
    ]);
  });

  it.each([
    'locally updated',
    'complete content',
    'closed draft',
    'accepted draft',
  ] as const)(
    'does not replace indexes for skipped %s results while indexing accepted rows',
    async (reason) => {
      const draft = reason.endsWith('draft');
      const saved = await store.saveMessage(
        account.id,
        message('remote', { draft }),
      );
      const before = await participants(saved.id);
      if (reason === 'closed draft') {
        await database
          .query()
          .updateTable('mailDraftStates')
          .set({ closed: true })
          .where('accountId', '=', account.id)
          .where('providerMessageId', '=', 'remote')
          .execute();
      }
      if (reason === 'accepted draft') {
        await store.createSubmission(
          {
            id: fixtureIds.submission,
            accountId: account.id,
            status: 'accepted',
            providerMessageId: 'remote',
          },
          'once',
          'fingerprint',
        );
      }
      await database.transaction(async ({ query }) => {
        await upsertMessages(
          query,
          account.id,
          [
            message('remote', {
              draft,
              from: { address: 'stale@example.com' },
              to: [],
              contentStatus:
                reason === 'complete content' ? 'deferred' : 'complete',
            }),
            message('new'),
          ],
          reason === 'locally updated' ? saved.updatedAt : undefined,
        );
      });
      expect(await participants(saved.id)).toEqual(before);
      expect(
        (await store.getMessageForAccount(account.id, saved.id))?.from?.address,
      ).toBe('Sender@Example.com');
      expect(await participants()).toHaveLength(4);
    },
  );

  it('rejects outdated draft revisions without changing either address source or index', async () => {
    const saved = await store.saveMessage(
      account.id,
      message('local-draft:one', { draft: true, draftRevision: 2 }),
    );
    const before = await participants(saved.id);
    await expect(
      store.saveMessage(
        account.id,
        message('local-draft:one', {
          draft: true,
          draftRevision: 1,
          to: [{ address: 'stale@example.com' }],
        }),
      ),
    ).rejects.toThrow('revision is outdated');
    expect(await participants(saved.id)).toEqual(before);
  });

  it.each(['new', 'existing'] as const)(
    'rolls back message and index after a participant replacement failure (%s)',
    async (kind) => {
      const saved =
        kind === 'existing'
          ? await store.saveMessage(account.id, message('remote'))
          : undefined;
      const before = await participants();
      const replace = participantWrites.replaceMessageParticipants;
      vi.spyOn(
        participantWrites,
        'replaceMessageParticipants',
      ).mockImplementationOnce(async (query, rows) => {
        await replace(query, rows);
        throw new Error('injected participant failure');
      });
      await expect(
        store.saveMessage(
          account.id,
          message('remote', {
            subject: 'Changed',
            to: [{ address: 'new@example.com' }],
          }),
        ),
      ).rejects.toThrow('injected participant failure');
      expect(await participants()).toEqual(before);
      if (saved)
        expect(
          (await store.getMessageForAccount(account.id, saved.id))?.subject,
        ).toBe('Original');
      else expect((await store.listAllMessages({})).items).toEqual([]);
    },
  );

  it('does not rebuild for content, flags, labels, provider IDs, or folder-only removals', async () => {
    const saved = await store.saveMessage(
      account.id,
      message('remote', { draft: true }),
    );
    const before = await participants(saved.id);
    const replace = vi.spyOn(participantWrites, 'replaceMessageParticipants');
    await store.saveMessageContent(
      account.id,
      saved.id,
      message('remote', {
        to: [{ address: 'ignored@example.com' }],
        text: 'Loaded body',
      }),
    );
    await store.updateMessageState(account.id, saved.id, {
      read: true,
      starred: true,
      note: 'note',
    });
    await store.updateMessageLabels(account.id, saved.id, [], []);
    await store.localizeDraft(account.id, saved.id);
    await store.moveMessage(
      account.id,
      saved.id,
      'moved-provider-id',
      'archive',
    );
    await sync(
      [],
      [],
      [
        {
          providerMessageId: `local-draft:${saved.id}`,
          providerFolderId: 'archive',
        },
      ],
    );
    expect(replace).not.toHaveBeenCalled();
    expect(await participants(saved.id)).toEqual(before);
    expect(
      await store.getMessageForAccount(account.id, saved.id),
    ).toBeDefined();
  });

  it('skips invalid provider addresses with only observable aggregate statistics', async () => {
    const warning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => {});
    const saved = await store.saveMessage(
      account.id,
      message('remote', {
        from: { address: 'Secret <secret@example.com>' },
        to: [
          { address: 'valid@example.com' },
          { address: 'bad@@example.com' },
          { address: `${'x'.repeat(321)}@example.com` },
        ],
      }),
    );
    expect((await participants(saved.id)).map((row) => row.address)).toEqual([
      'valid@example.com',
    ]);
    expect(warning).toHaveBeenCalledExactlyOnceWith(
      'Mail participant indexing skipped values: malformedValues=0, invalidAddresses=3.',
      { code: 'MAIL_PARTICIPANT_INDEX_SKIPPED' },
    );
    expect(saved.from?.address).toBe('Secret <secret@example.com>');
  });

  it.each(['sync', 'manual', 'draft close', 'draft delete'] as const)(
    'cleans indexes on %s deletion and safe repeated cleanup',
    async (path) => {
      const saved = await store.saveMessage(
        account.id,
        message('remote', { draft: path.startsWith('draft') }),
      );
      const other = await store.saveMessage(account.id, message('other'));
      for (let retry = 0; retry < 2; retry++) {
        if (path === 'sync') await sync([], ['remote']);
        else if (path === 'draft close')
          await store.closeDraft(account.id, saved.id);
        else await store.deleteMessage(account.id, saved.id);
        expect(await participants(saved.id)).toEqual([]);
        expect(
          await store.getMessageForAccount(account.id, saved.id),
        ).toBeUndefined();
      }
      expect(await participants(other.id)).toHaveLength(2);
    },
  );

  it('preserves index when a conditional draft deletion is refused or another account targets its ID', async () => {
    const saved = await store.saveMessage(
      account.id,
      message('remote', { draft: true }),
    );
    const before = await participants(saved.id);
    expect(
      await store.deleteMessage(account.id, saved.id, 'wrong-timestamp'),
    ).toBe(false);
    await store.saveAccount({
      ...account,
      id: fixtureIds.otherAccount,
      address: 'other@example.com',
    });
    expect(await store.deleteMessage(fixtureIds.otherAccount, saved.id)).toBe(
      false,
    );
    expect(await participants(saved.id)).toEqual(before);
  });

  it('rolls back index deletion with the message transaction, then retries successfully', async () => {
    const saved = await store.saveMessage(account.id, message('remote'));
    const before = await participants(saved.id);
    const transaction = database.transaction.bind(database);
    vi.spyOn(database, 'transaction').mockImplementationOnce((callback) =>
      transaction(async (context) => {
        await callback(context);
        throw new Error('injected deletion failure');
      }),
    );
    await expect(store.deleteMessage(account.id, saved.id)).rejects.toThrow(
      'injected deletion failure',
    );
    expect(await participants(saved.id)).toEqual(before);
    expect(
      await store.getMessageForAccount(account.id, saved.id),
    ).toBeDefined();
    expect(await store.deleteMessage(account.id, saved.id)).toBe(true);
    expect(await participants(saved.id)).toEqual([]);
  });

  it('bounds mass-recipient inserts to 500 binds and sync deletions to 100 message IDs', async () => {
    const client = await database.connection().client<{
      on(
        event: 'query',
        listener: (query: { sql: string; bindings: unknown[] }) => void,
      ): void;
      off(
        event: 'query',
        listener: (query: { sql: string; bindings: unknown[] }) => void,
      ): void;
    }>();
    const captured: { sql: string; bindings: unknown[] }[] = [];
    const capture = (query: { sql: string; bindings: unknown[] }) => {
      if (
        query.sql.includes('mail_message_participants') &&
        /^(insert|delete)/i.test(query.sql)
      )
        captured.push(query);
    };
    client.on('query', capture);
    try {
      const saved = await store.saveMessage(
        account.id,
        message('huge', {
          from: undefined,
          to: Array.from({ length: 1251 }, (_, index) => ({
            address: `person${index}@example.com`,
          })),
        }),
      );
      expect(await participants(saved.id)).toHaveLength(1251);
      expect(
        captured.filter((query) => /^insert/i.test(query.sql)),
      ).toHaveLength(13);
      expect(captured.every((query) => query.bindings.length <= 500)).toBe(
        true,
      );
      const messages = Array.from({ length: 205 }, (_, index) =>
        message(`batch-${index}`, {
          from: undefined,
          to: [{ address: 'single@example.com' }],
          providerFolderIds: [],
        }),
      );
      captured.length = 0;
      await sync(messages);
      expect(
        captured.filter((query) => /^insert/i.test(query.sql)),
      ).toHaveLength(3);
      expect(captured.every((query) => query.bindings.length <= 500)).toBe(
        true,
      );
      expect(
        captured
          .filter((query) => /^delete/i.test(query.sql))
          .every((query) => query.bindings.length <= 100),
      ).toBe(true);
      captured.length = 0;
      await sync([], ['huge', ...messages.map((row) => row.providerMessageId)]);
      expect(await participants()).toEqual([]);
      expect(captured.length).toBeGreaterThanOrEqual(3);
      expect(captured.every((query) => query.bindings.length <= 101)).toBe(
        true,
      );
    } finally {
      client.off('query', capture);
    }
  });

  it('bounds account cleanup by participant rows, rolls back failures and resumes with fenced retries', async () => {
    const saved = await store.saveMessage(
      account.id,
      message('huge', {
        from: undefined,
        providerFolderIds: [],
        to: Array.from({ length: 1201 }, (_, index) => ({
          address: `person${index}@example.com`,
        })),
      }),
    );
    await store.saveAccount({
      ...account,
      id: fixtureIds.otherAccount,
      address: 'other@example.com',
    });
    const other = await store.saveMessage(
      fixtureIds.otherAccount,
      message('other'),
    );
    await store.markAccountRemoving(account.id, account.userId);
    const task = (await store.claimAccountRemoval())!;
    const transaction = database.transaction.bind(database);
    const failure = vi
      .spyOn(database, 'transaction')
      .mockImplementationOnce((callback) =>
        transaction(async (context) => {
          await callback(context);
          throw new Error('injected batch failure');
        }),
      );
    await expect(store.deleteAccountBatch(task)).rejects.toThrow(
      'injected batch failure',
    );
    expect(await participants(saved.id)).toHaveLength(1201);
    failure.mockRestore();
    expect(
      await store.deleteAccountBatch({ ...task, leaseToken: 'stale' }),
    ).toBe(false);
    for (const remaining of [701, 201, 0]) {
      expect(await store.deleteAccountBatch(task)).toBe(false);
      expect(await participants(saved.id)).toHaveLength(remaining);
      expect(
        await store.getMessageForAccount(account.id, saved.id),
      ).toBeDefined();
    }
    // A restarted store can continue the same committed task without index orphans.
    store = createDatabaseMailStore(database);
    let done = false;
    for (let retry = 0; retry < 20 && !done; retry++)
      done = await store.deleteAccountBatch(task);
    expect(done).toBe(true);
    expect(await store.finishAccountRemoval(task)).toBe(true);
    expect(await store.getAccount(account.id)).toBeUndefined();
    expect(await participants(other.id)).toHaveLength(2);
    expect(await participants()).toHaveLength(2);
  });
});
