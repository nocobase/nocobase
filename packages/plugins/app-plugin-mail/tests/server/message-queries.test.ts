import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { randomUUID } from 'node:crypto';
import {
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
} from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import backfillConversations from '../../database/migrations/202609200001_backfill_mail_conversations.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';

describe('mail queries', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let metadataStore: InMemoryCollectionMetadataStore;
  const accountId = randomUUID();
  beforeEach(async () => {
    metadataStore = new InMemoryCollectionMetadataStore();
    database = await createMailTestDatabase({ metadataStore });
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: accountId,
      userId: 'owner',
      address: 'owner@example.com',
      status: 'active',
      provider: { type: 'test', name: 'test' },
      credentialReference: 'unused',
      scopes: [],
    });
    await store.commitSyncBatch({
      accountId,
      folders: ['inbox', 'second'].map((id) => ({
        providerFolderId: id,
        name: id,
        type: 'inbox' as const,
        kind: 'folder' as const,
      })),
      messages: [],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'cursor' },
    });
  });
  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });
  const message = (id: string): NormalizedMailMessage => ({
    providerMessageId: id,
    providerFolderIds: ['inbox', 'second'],
    from: { address: 'sender@example.com', name: 'Sender Name' },
    to: [{ address: 'recipient@example.com', name: 'Recipient Name' }],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Subject',
    preview: 'Preview',
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  });

  it('groups SMTP sent mail with a synchronized Gmail reply using RFC message headers', async () => {
    await store.saveMessage(accountId, {
      ...message('smtp-sent'),
      internetMessageId: '<sent@example.com>',
      providerFolderIds: ['sent'],
      subject: 'Project update',
    });
    await store.commitSyncBatch({
      accountId,
      folders: [],
      messages: [
        {
          ...message('imap-reply'),
          internetMessageId: '<reply@gmail.com>',
          inReplyTo: '<sent@example.com>',
          references: ['<sent@example.com>'],
          subject: 'Re: Project update',
        },
      ],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'reply-cursor' },
    });
    const page = await store.listMessages('owner', {});
    expect(page.items).toHaveLength(2);
    expect(page.items.map((item) => item.subjectCount)).toEqual([2, 2]);
    const conversationId = page.items[0].conversationId;
    expect(conversationId).toBeTruthy();
    expect(page.items[1].conversationId).toBe(conversationId);
    const conversation = await store.listConversationMessages(
      'owner',
      accountId,
      conversationId!,
      {},
    );
    expect(
      conversation.items.map((item) => item.providerMessageId).sort(),
    ).toEqual(['imap-reply', 'smtp-sent']);
  });

  it('keeps RFC threads stable across reply-first sync, repeated sync, and identical subjects', async () => {
    const messages = [
      {
        ...message('last'),
        internetMessageId: '<last@gmail.com>',
        inReplyTo: '<reply@gmail.com>',
        references: ['<root@example.com>', '<reply@gmail.com>'],
      },
      {
        ...message('reply'),
        internetMessageId: '<reply@gmail.com>',
        inReplyTo: '<root@example.com>',
      },
      { ...message('root'), internetMessageId: '<root@example.com>' },
    ];
    for (const item of messages) await store.saveMessage(accountId, item);
    for (const item of messages) await store.saveMessage(accountId, item);
    await store.saveMessage(accountId, {
      ...message('unrelated'),
      internetMessageId: '<unrelated@example.com>',
    });
    await store.saveMessage(accountId, {
      ...message('native'),
      internetMessageId: '<native@example.com>',
      providerConversationId: 'native-thread',
    });
    const page = await store.listMessages('owner', {});
    const related = page.items.filter((item) =>
      ['root', 'reply', 'last'].includes(item.providerMessageId),
    );
    expect(related).toHaveLength(3);
    expect(new Set(related.map((item) => item.conversationId)).size).toBe(1);
    expect(related.every((item) => item.subjectCount === 3)).toBe(true);
    expect(
      page.items.find((item) => item.providerMessageId === 'unrelated')
        ?.subjectCount,
    ).toBe(1);
    expect(
      page.items.find((item) => item.providerMessageId === 'native')
        ?.conversationId,
    ).toBe('native-thread');
  });

  it('backfills stored reply chains without changing native conversations', async () => {
    for (const item of [
      { ...message('root'), internetMessageId: '<root@example.com>' },
      {
        ...message('reply'),
        internetMessageId: '<reply@gmail.com>',
        references: ['<root@example.com>'],
      },
      { ...message('native'), providerConversationId: 'native-thread' },
      message('no-headers'),
    ])
      await store.saveMessage(accountId, item);
    await database
      .query()
      .updateTable('mailMessages')
      .set({ providerConversationId: null })
      .where('providerMessageId', 'in', ['root', 'reply'])
      .execute();
    const connection = database.connection();
    await backfillConversations.up({
      builder: connection.builder,
      query: connection.query,
      connection,
    });
    const page = await store.listMessages('owner', {});
    expect(
      page.items
        .filter((item) => ['root', 'reply'].includes(item.providerMessageId))
        .map((item) => item.subjectCount),
    ).toEqual([2, 2]);
    expect(
      page.items.find((item) => item.providerMessageId === 'native')
        ?.conversationId,
    ).toBe('native-thread');
    expect(
      page.items.find((item) => item.providerMessageId === 'no-headers')
        ?.conversationId,
    ).toBeUndefined();
  });

  it('stores missing message dates as NULL when creating and updating mail', async () => {
    const input = message('dates');
    const initial = await store.saveMessage(accountId, input);
    expect(initial.receivedAt).toBeUndefined();
    expect(initial.sentAt).toBeUndefined();
    await store.saveMessage(accountId, {
      ...input,
      receivedAt: '2026-09-17T00:00:00.000Z',
      sentAt: '2026-09-16T23:59:00.000Z',
    });
    const updated = await store.saveMessage(accountId, input);
    expect(updated.id).toBe(initial.id);
    expect(updated.receivedAt).toBeUndefined();
    expect(updated.sentAt).toBeUndefined();
    const row = await database
      .query()
      .selectFrom('mailMessages')
      .select(['receivedAt', 'sentAt', 'sortAt', 'createdAt'])
      .where('id', '=', initial.id)
      .executeTakeFirst<{
        receivedAt: string | null;
        sentAt: string | null;
        sortAt: string;
        createdAt: string;
      }>();
    expect(row).toMatchObject({ receivedAt: null, sentAt: null });
    expect(row?.sortAt).toEqual(row?.createdAt);
  });

  it('filters folders and labels without duplicate rows and keeps totals and cursors consistent', async () => {
    const first = await store.saveMessage(accountId, message('first'));
    const second = await store.saveMessage(accountId, message('second'));
    const labels = await Promise.all(
      ['one', 'two'].map((name) => store.createLabel('owner', name, 'blue')),
    );
    for (const item of [first, second])
      await store.updateMessageLabels(
        accountId,
        item.id,
        labels.map((label) => label.id),
        [],
      );
    for (const folderIds of [
      ['inbox', 'second'],
      ['__nocobase_default_inbox__'],
    ]) {
      const input = {
        folderIds,
        labelIds: labels.map((label) => label.id),
        limit: 1,
        withTotal: true,
      };
      const page = await store.listMessages('owner', input);
      expect(page.total).toBe(2);
      expect(page.items).toHaveLength(1);
      const next = await store.listMessages('owner', {
        ...input,
        cursor: page.nextCursor,
      });
      expect(next.items).toHaveLength(1);
      expect(next.items[0].id).not.toBe(page.items[0].id);
      expect(
        (await store.listAllMessages({ ...input, offset: 1 })).items[0].id,
      ).toBe(next.items[0].id);
    }
    expect((await store.listMessages('outsider', {})).items).toEqual([]);
  });
  it.each([false, true])(
    'counts real attachments but not inline draft images (%s)',
    async (withFile) => {
      const saved = await store.saveMessage(accountId, {
        ...message('local-draft:inline-draft'),
        providerFolderIds: ['__nocobase_local_drafts__'],
        draft: true,
        attachments: [
          {
            providerAttachmentId: 'image',
            fileName: 'logo.png',
            contentType: 'image/png',
            size: 3,
            inline: true,
            contentId: 'logo',
          },
          ...(withFile
            ? [
                {
                  providerAttachmentId: 'document',
                  fileName: 'report.pdf',
                  contentType: 'application/pdf',
                  size: 5,
                  inline: false,
                },
              ]
            : []),
        ],
      });
      expect(saved.hasAttachments).toBe(withFile);
      expect(saved.attachments).toHaveLength(withFile ? 2 : 1);
      const page = await store.listMessages('owner', {
        folderIds: ['__nocobase_local_drafts__'],
      });
      expect(
        page.items.find((item) => item.id === saved.id)?.hasAttachments,
      ).toBe(withFile);
    },
  );

  it('excludes reply drafts from conversation pages and counts while keeping them in Drafts', async () => {
    for (const [id, draft, date] of [
      ['received', false, '2026-09-01'],
      ['sent', false, '2026-09-02'],
      ['remote-draft', true, '2026-09-03'],
      ['local-draft:reply', true, '2026-09-04'],
    ] as const) {
      await store.saveMessage(accountId, {
        ...message(id),
        providerConversationId: 'thread-1',
        draft,
        receivedAt: `${date}T00:00:00.000Z`,
        providerFolderIds: draft ? ['__nocobase_local_drafts__'] : ['inbox'],
      });
    }
    const first = await store.listConversationMessages(
      'owner',
      accountId,
      'thread-1',
      { limit: 1 },
    );
    expect(first.items.map((item) => item.providerMessageId)).toEqual(['sent']);
    expect(first.nextCursor).toBeDefined();
    const second = await store.listConversationMessages(
      'owner',
      accountId,
      'thread-1',
      { limit: 1, cursor: first.nextCursor },
    );
    expect(second.items.map((item) => item.providerMessageId)).toEqual([
      'received',
    ]);
    expect(second.nextCursor).toBeUndefined();
    const all = await store.listMessages('owner', {});
    expect(all.items).toHaveLength(2);
    expect(
      all.items.every((item) => !item.draft && item.subjectCount === 2),
    ).toBe(true);
    const drafts = await store.listMessages('owner', {
      folderIds: ['__nocobase_local_drafts__'],
    });
    expect(drafts.items).toHaveLength(2);
    expect(drafts.items.every((item) => item.draft)).toBe(true);
  });

  it('keeps local drafts visible in the provider draft folder and removes synced duplicates before pagination', async () => {
    await store.saveFolder(accountId, {
      providerFolderId: 'drafts',
      name: 'Drafts',
      type: 'drafts',
      kind: 'folder',
    });
    const remote = {
      ...message('remote-draft'),
      draft: true,
      providerFolderIds: ['inbox', 'drafts'],
    };
    const editable = await store.saveMessage(accountId, remote);
    await store.localizeDraft(accountId, editable.id);
    await store.saveMessage(accountId, {
      ...remote,
      providerMessageId: `local-draft:${editable.id}`,
      providerDraftMessageId: 'remote-draft',
      providerFolderIds: ['__nocobase_local_drafts__'],
    });
    await store.commitSyncBatch({
      accountId,
      folders: [],
      messages: [remote],
      deletedProviderMessageIds: [],
      nextCursor: { value: 'next' },
    });
    for (const folderIds of [['drafts'], ['__nocobase_local_drafts__']]) {
      const page = await store.listMessages('owner', {
        folderIds,
        withTotal: true,
        limit: 1,
      });
      expect(page.total).toBe(1);
      expect(page.items[0]?.id).toBe(editable.id);
      expect(page.nextCursor).toBeUndefined();
    }
    expect(
      (
        await store.listMessages('owner', {
          folderIds: ['inbox'],
          withTotal: true,
        })
      ).total,
    ).toBe(0);
  });

  it('searches address names and values alongside subject and preview after updates', async () => {
    await store.saveMessage(accountId, message('first'));
    for (const query of [
      'sender@example',
      'Sender Name',
      'recipient@example',
      'Recipient Name',
      'Subject',
      'Preview',
    ]) {
      const page = await store.listMessages('owner', {
        query,
        folderIds: ['inbox'],
        withTotal: true,
      });
      expect(page.items).toHaveLength(1);
      expect(page.total).toBe(1);
    }
    await store.saveMessage(accountId, {
      ...message('first'),
      from: { address: 'changed@example.com' },
      to: [],
    });
    expect(
      (await store.listMessages('owner', { query: 'changed@example' })).items,
    ).toHaveLength(1);
    expect(
      (await store.listMessages('owner', { query: 'recipient@example' })).items,
    ).toHaveLength(0);
  });
});
