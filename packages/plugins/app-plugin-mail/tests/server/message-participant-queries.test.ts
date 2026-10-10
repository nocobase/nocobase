import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

const TARGET = 'alice@example.com';
const DATE = '2026-09-20T00:00:00.000Z';

function message(
  id: string,
  changes: Partial<NormalizedMailMessage> = {},
): NormalizedMailMessage {
  return {
    providerMessageId: id,
    providerFolderIds: ['inbox'],
    from: { address: 'sender@elsewhere.com' },
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Project update',
    preview: 'Summary',
    text: 'Body',
    receivedAt: DATE,
    read: false,
    starred: false,
    draft: false,
    attachments: [],
    ...changes,
  };
}

const ids = (items: readonly { providerMessageId: string }[]): string[] =>
  items.map((item) => item.providerMessageId).sort();

describe('Mail participant list queries', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let accountId: string;
  let otherAccountId: string;

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    accountId = randomUUID();
    otherAccountId = randomUUID();
    for (const [id, userId] of [
      [accountId, 'owner'],
      [otherAccountId, 'other'],
    ]) {
      await store.saveAccount({
        id,
        authorizationSubject: id,
        userId,
        address: `${userId}@elsewhere.com`,
        status: 'active',
        provider: { type: 'test', name: 'test' },
        credentialReference: 'unused',
        scopes: [],
      });
      await store.saveFolder(id, {
        providerFolderId: 'inbox',
        name: 'Inbox',
        type: 'inbox',
        kind: 'folder',
      });
    }
  });

  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  it('matches only From, To and Cc addresses, not other headers, names or content', async () => {
    for (const input of [
      message('from', { from: { address: TARGET } }),
      message('to', { from: undefined, to: [{ address: TARGET }] }),
      message('cc', { cc: [{ address: TARGET }] }),
      message('bcc', { bcc: [{ address: TARGET }] }),
      message('reply-to', { replyTo: [{ address: TARGET }] }),
      message('sender-name', {
        from: { address: 'sender@elsewhere.com', name: TARGET },
      }),
      message('recipient-name', {
        to: [{ address: 'recipient@elsewhere.com', name: TARGET }],
      }),
      message('subject', { subject: TARGET }),
      message('preview', { preview: TARGET }),
      message('body', { text: TARGET, html: `<p>${TARGET}</p>` }),
      message('empty', { from: undefined }),
    ])
      await store.saveMessage(accountId, input);

    const filtered = await store.listMessages('owner', {
      participant: ' ALICE@EXAMPLE.COM ',
      withTotal: true,
    });
    expect(ids(filtered.items)).toEqual(['cc', 'from', 'to']);
    expect(filtered.total).toBe(3);
    expect(
      (
        await store.listMessages('owner', {
          participant: ' ALICE@EXAMPLE.COM ',
          withTotal: true,
        })
      ).total,
    ).toBe(3);
    const originalSearch = await store.listMessages('owner', {
      query: TARGET,
      withTotal: true,
    });
    expect(ids(originalSearch.items)).toEqual([
      'bcc',
      'cc',
      'from',
      'preview',
      'recipient-name',
      'sender-name',
      'subject',
      'to',
    ]);
    expect(originalSearch.total).toBe(8);
    const intersection = await store.listMessages('owner', {
      participant: TARGET,
      query: TARGET,
      withTotal: true,
    });
    expect(ids(intersection.items)).toEqual(['cc', 'from', 'to']);
    expect(intersection.total).toBe(3);
  });

  it('uses exact mailbox and domain equality without alias or subdomain folding', async () => {
    for (const [id, address] of [
      ['exact', TARGET],
      ['domain-peer', 'bob@example.com'],
      ['prefix', 'xalice@example.com'],
      ['plus-tag', 'alice+crm@example.com'],
      ['suffix-local', 'alicex@example.com'],
      ['subdomain', 'alice@sub.example.com'],
      ['similar-domain', 'alice@notexample.com'],
      ['suffix-domain', 'alice@example.com.evil'],
    ])
      await store.saveMessage(accountId, message(id, { to: [{ address }] }));

    expect(
      ids((await store.listMessages('owner', { participant: TARGET })).items),
    ).toEqual(['exact']);
    const domain = await store.listMessages('owner', {
      participant: ' @EXAMPLE.COM ',
      withTotal: true,
    });
    expect(ids(domain.items)).toEqual([
      'domain-peer',
      'exact',
      'plus-tag',
      'prefix',
      'suffix-local',
    ]);
    expect(domain.total).toBe(5);
  });

  it('intersects participant with every existing filter and preserves draft visibility', async () => {
    const label = await store.createLabel('owner', 'Selected', 'blue');
    const base: Partial<NormalizedMailMessage> = {
      to: [{ address: TARGET }],
      subject: 'needle',
      providerConversationId: 'thread',
      starred: true,
    };
    for (const [id, changes] of [
      ['matching', {}],
      ['wrong-participant', { to: [{ address: 'bob@elsewhere.com' }] }],
      ['wrong-folder', { providerFolderIds: ['archive'] }],
      ['wrong-query', { subject: 'Other' }],
      ['wrong-conversation', { providerConversationId: 'other-thread' }],
      ['read', { read: true }],
      ['unstarred', { starred: false }],
      ['draft', { draft: true }],
      ['no-label', {}],
    ] as const) {
      const saved = await store.saveMessage(
        accountId,
        message(id, { ...base, ...changes }),
      );
      if (id !== 'no-label')
        await store.updateMessageLabels(accountId, saved.id, [label.id], []);
    }
    await store.saveMessage(otherAccountId, message('other-owner', base));
    const input = {
      participant: TARGET,
      accountIds: [accountId],
      folderIds: ['inbox'],
      labelIds: [label.id],
      conversationId: 'thread',
      query: 'needle',
      unread: true,
      starred: true,
      withTotal: true,
    };
    const filtered = await store.listMessages('owner', input);
    expect(ids(filtered.items)).toEqual(['matching']);
    expect(filtered.total).toBe(1);
    expect(ids((await store.listAllMessages(input)).items)).toEqual([
      'draft',
      'matching',
    ]);
    expect((await store.listMessages('other', input)).total).toBe(0);
  });

  it('keeps owner isolation and suspended/removing account visibility unchanged', async () => {
    await store.saveMessage(
      accountId,
      message('owned', { to: [{ address: TARGET }] }),
    );
    await store.saveMessage(
      otherAccountId,
      message('other', { to: [{ address: TARGET }] }),
    );
    const input = { participant: TARGET, withTotal: true };
    expect(ids((await store.listMessages('owner', input)).items)).toEqual([
      'owned',
    ]);
    expect(
      (
        await store.listMessages('owner', {
          ...input,
          accountIds: [otherAccountId],
        })
      ).total,
    ).toBe(0);
    expect((await store.listMessages('outsider', input)).total).toBe(0);
    expect((await store.listAllMessages(input)).total).toBe(2);
    for (const status of ['suspended', 'removing'] as const) {
      await database
        .query()
        .updateTable('mailAccounts')
        .set({ status })
        .where('id', '=', accountId)
        .execute();
      expect((await store.listMessages('owner', input)).total).toBe(0);
      expect((await store.listAllMessages(input)).total).toBe(2);
    }
  });

  it('correlates both the message ID and redundant account ID', async () => {
    const saved = await store.saveMessage(
      accountId,
      message('owned', { to: [{ address: TARGET }] }),
    );
    await store.saveMessage(accountId, message('not-matching'));
    await database
      .query()
      .updateTable('mailMessageParticipants')
      .set({ accountId: otherAccountId })
      .where('messageId', '=', saved.id)
      .execute();
    expect(
      (
        await store.listMessages('owner', {
          participant: TARGET,
          withTotal: true,
        })
      ).total,
    ).toBe(0);
    expect(
      (await store.listAllMessages({ participant: TARGET, withTotal: true }))
        .total,
    ).toBe(0);
    expect((await store.listMessages('owner', { withTotal: true })).total).toBe(
      2,
    );
  });

  it.each([TARGET, '@example.com'])(
    'keeps counts and cursor/offset pages stable for ties and repeated roles (%s)',
    async (participant) => {
      for (let index = 0; index < 5; index++) {
        await store.saveMessage(
          accountId,
          message(`matched-${index}`, {
            from: { address: TARGET },
            to: [
              { address: TARGET },
              { address: TARGET },
              { address: 'bob@example.com' },
            ],
            cc: [{ address: TARGET }, { address: 'carol@example.com' }],
          }),
        );
        await store.saveMessage(accountId, message(`excluded-${index}`));
      }
      const input = { participant, withTotal: true, limit: 2 };
      const all = await store.listMessages('owner', { ...input, limit: 100 });
      expect(all.total).toBe(5);
      const sorted = all.items.map((item) => item.id);
      // UUID order is dialect-native (SQL Server uniqueidentifier is not lexicographic).
      const expectedOrder = await database
        .query()
        .selectFrom('mailMessages')
        .select('id')
        .where('accountId', '=', accountId)
        .where('providerMessageId', 'like', 'matched-%')
        .orderBy('sortAt', 'desc')
        .orderBy('id', 'desc')
        .execute<{ id: string }>();
      expect(sorted).toEqual(expectedOrder.map((row) => row.id));
      const seen: string[] = [];
      let cursor: string | undefined;
      for (let offset = 0; offset < 5; offset += 2) {
        const page = await store.listMessages('owner', { ...input, cursor });
        const numbered = await store.listAllMessages({ ...input, offset });
        expect(page.total).toBe(5);
        expect(numbered.total).toBe(5);
        expect(page.items.map((item) => item.id)).toEqual(
          sorted.slice(offset, offset + 2),
        );
        expect(numbered.items.map((item) => item.id)).toEqual(
          page.items.map((item) => item.id),
        );
        seen.push(...page.items.map((item) => item.id));
        cursor = page.nextCursor;
        expect(cursor === undefined).toBe(offset === 4);
      }
      expect(seen).toEqual(sorted);
      expect(new Set(seen).size).toBe(5);
      expect(
        (await store.listAllMessages({ ...input, offset: 5 })).items,
      ).toEqual([]);
    },
  );

  it('filters the list without trimming full conversations or conversation counts', async () => {
    const matching = await store.saveMessage(
      accountId,
      message('matching', {
        to: [{ address: TARGET }],
        providerConversationId: 'thread',
      }),
    );
    await store.saveMessage(
      accountId,
      message('different-participants', { providerConversationId: 'thread' }),
    );
    await store.saveMessage(
      accountId,
      message('draft', {
        providerConversationId: 'thread',
        to: [{ address: TARGET }],
        providerFolderIds: ['__nocobase_local_drafts__'],
        draft: true,
      }),
    );
    const list = await store.listMessages('owner', {
      participant: TARGET,
      withTotal: true,
    });
    expect(list.total).toBe(1);
    expect(list.items).toEqual([
      expect.objectContaining({ id: matching.id, subjectCount: 2 }),
    ]);
    const thread = await store.listConversationMessages(
      'owner',
      accountId,
      'thread',
    );
    expect(ids(thread.items)).toEqual(['different-participants', 'matching']);
    expect(thread.items.every((item) => item.text === 'Body')).toBe(true);
  });

  it('retains distinct local IMAP folder copies with the same RFC Message-ID', async () => {
    for (const folder of ['inbox', 'archive'])
      await store.saveMessage(
        accountId,
        message(`imap:${folder}:1`, {
          internetMessageId: '<same@example.com>',
          providerFolderIds: [folder],
          to: [{ address: TARGET }],
        }),
      );
    const page = await store.listMessages('owner', {
      participant: TARGET,
      withTotal: true,
    });
    expect(page.total).toBe(2);
    expect(ids(page.items)).toEqual(['imap:archive:1', 'imap:inbox:1']);
    expect(new Set(page.items.map((item) => item.id)).size).toBe(2);
    expect(
      (
        await store.listMessages('owner', {
          participant: TARGET,
          folderIds: ['inbox'],
        })
      ).items,
    ).toHaveLength(1);
  });

  it.each([
    '',
    '@',
    'bad',
    'alice@@example.com',
    '@bad_domain.com',
    'x'.repeat(321),
  ])(
    'rejects explicitly invalid service filters even with no accessible accounts (%s)',
    async (participant) => {
      for (const user of ['owner', 'outsider'])
        await expect(
          store.listMessages(user, { participant }),
        ).rejects.toMatchObject({
          status: 'INVALID_ARGUMENT',
          field: 'participant',
        });
      await expect(
        store.listAllMessages({ participant }),
      ).rejects.toMatchObject({
        status: 'INVALID_ARGUMENT',
        field: 'participant',
      });
    },
  );
});
