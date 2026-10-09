import {
  assertDraftEditable,
  assertDraftDeletable,
} from './scheduled-drafts.js';
import { acceptDraftWrite, closeDrafts } from './draft-states.js';
import { lockWritableAccount } from './account-guard.js';
import { type DatabaseManager } from '@nocobase/db';
import {
  MAIL_LOCAL_DRAFT_FOLDER_ID,
  MAIL_VIRTUAL_FOLDER_IDS,
  type MailAccount,
  type MailFolder,
  type MailListConversationMessagesInput,
  type MailListMessagesInput,
  type MailMessage,
  type MailMessageSummary,
  type MailPage,
} from '../../shared/mail.js';
import { type MailStore } from '../contracts/persistence.js';
import { type NormalizedMailMessage } from '../contracts/provider.js';
import { mailInvalidArgument } from '../services/errors.js';
import { encodeMessageCursor, parseMessageCursor } from './message-cursor.js';
import {
  conversationGroupKey,
  countMessageConversations,
  loadMailMessages,
  loadMailMessageSummaries,
} from './message-queries.js';
import { upsertMessages } from './message-writes.js';
import {
  type MessageFolderRow,
  type MessageLabelRow,
  type MessageRow,
} from './rows.js';

const SYNTHETIC_FOLDER_TYPES: Readonly<Record<string, MailFolder['type']>> = {
  [MAIL_VIRTUAL_FOLDER_IDS.inbox]: 'inbox',
  [MAIL_VIRTUAL_FOLDER_IDS.sent]: 'sent',
  [MAIL_VIRTUAL_FOLDER_IDS.drafts]: 'drafts',
  [MAIL_VIRTUAL_FOLDER_IDS.trash]: 'trash',
  [MAIL_VIRTUAL_FOLDER_IDS.junk]: 'junk',
  [MAIL_VIRTUAL_FOLDER_IDS.archive]: 'archive',
};

export class MailMessagesStore {
  public async saveMessageContent(
    accountId: string,
    messageId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage> {
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, accountId);
      await query
        .updateTable<MessageRow>('mailMessages')
        .set({
          text: message.text ?? null,
          html: message.html ?? null,
          attachments: JSON.stringify(message.attachments),
          contentStatus: message.contentStatus ?? 'complete',
          contentError: message.contentError ?? null,
          size: message.size ?? null,
        })
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .where('providerMessageId', '=', message.providerMessageId)
        .execute();
    });
    const saved = await this.getMessageForAccount(accountId, messageId);
    if (!saved)
      throw new Error('Mail message was removed while loading content.');
    return saved;
  }
  public constructor(
    private readonly database: DatabaseManager,
    private readonly accounts: Pick<
      MailStore,
      'listAccounts' | 'listAllAccounts' | 'getAccount'
    >,
  ) {}

  /** Detach an editable draft from provider message IDs that can change on save. */
  public async localizeDraft(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage> {
    await this.database.transaction(async (connection) => {
      await lockWritableAccount(connection.query, accountId);
      const row = await connection.query
        .selectFrom<MessageRow>('mailMessages')
        .selectAll()
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .where('draft', '=', true)
        .executeTakeFirst<MessageRow>();
      if (!row) throw new Error('Mail draft was not found.');
      await assertDraftEditable(connection.query, accountId, messageId);
      if (row.providerMessageId.startsWith('local-draft:')) return;
      // The imported copy owns editing; later provider synchronization cannot
      // introduce a competing draft or overwrite it.
      await acceptDraftWrite(
        connection.query,
        accountId,
        row.providerMessageId,
      );
      await connection.query
        .updateTable('mailDraftStates')
        .set({ closed: true })
        .where('accountId', '=', accountId)
        .where('providerMessageId', '=', row.providerMessageId)
        .execute();
      await connection.query
        .updateTable<MessageRow>('mailMessages')
        .set({
          providerMessageId: `local-draft:${messageId}`,
          providerDraftMessageId:
            row.providerDraftMessageId ?? row.providerMessageId,
        })
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .execute();
    });
    const draft = await this.getMessageForAccount(accountId, messageId);
    if (!draft) throw new Error('Mail draft was not found.');
    return draft;
  }

  public async closeDraft(
    accountId: string,
    messageId?: string,
    draftKey?: string,
  ): Promise<void> {
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, accountId);
      await closeDrafts(query, accountId, messageId, draftKey);
    });
  }

  public async saveMessage(
    accountId: string,
    message: NormalizedMailMessage,
  ): Promise<MailMessage> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, accountId);
      await upsertMessages(connection.query, accountId, [message]);
    });
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('providerMessageId', '=', message.providerMessageId)
      .executeTakeFirst<MessageRow>();
    if (!row) throw new Error('Saved mail message was not found.');
    return (await loadMailMessages(this.database.query(), [row]))[0];
  }

  public async listImapProviderMessageIds(
    accountId: string,
  ): Promise<readonly string[]> {
    const rows = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .select('providerMessageId')
      .where('accountId', '=', accountId)
      .where('providerMessageId', 'like', 'imap:%')
      .execute<Pick<MessageRow, 'providerMessageId'>>();
    return rows.map((row) => row.providerMessageId);
  }

  public async listMessages(
    userId: string,
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    const owned = (await this.accounts.listAccounts(userId)).filter(
      (account) => !['suspended', 'removing'].includes(account.status),
    );
    const requested = input.accountIds
      ? owned.filter((account) => input.accountIds?.includes(account.id))
      : owned;
    return this.listMessagesForAccounts(requested, input, true);
  }

  public async listAllMessages(
    input: MailListMessagesInput,
  ): Promise<MailPage<MailMessageSummary>> {
    const accounts = await this.accounts.listAllAccounts();
    const requested = input.accountIds
      ? accounts.filter((account) => input.accountIds?.includes(account.id))
      : accounts;
    return this.listMessagesForAccounts(requested, input);
  }

  private async listMessagesForAccounts(
    requested: readonly MailAccount[],
    input: MailListMessagesInput,
    draftsOnlyInDraftFolders = false,
  ): Promise<MailPage<MailMessageSummary>> {
    if (
      input.offset !== undefined &&
      (!Number.isSafeInteger(input.offset) || input.offset < 0)
    )
      throw mailInvalidArgument(
        'Mail message offset must be a nonnegative integer.',
      );
    if (input.offset !== undefined && input.cursor !== undefined)
      throw mailInvalidArgument(
        'Mail message offset and cursor cannot be combined.',
      );
    if (requested.length === 0)
      return { items: [], ...(input.withTotal ? { total: 0 } : {}) };
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const cursor = parseMessageCursor(input.cursor);
    let query = this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .select([
        'mailMessages.id',
        'mailMessages.scheduledSubmissionId',
        'mailMessages.accountId',
        'mailMessages.providerMessageId',
        'mailMessages.providerDraftId',
        'mailMessages.providerDraftMessageId',
        'mailMessages.internetMessageId',
        'mailMessages.providerConversationId',
        'mailMessages.sender',
        'mailMessages.recipients',
        'mailMessages.subject',
        'mailMessages.preview',
        'mailMessages.receivedAt',
        'mailMessages.sentAt',
        'mailMessages.sortAt',
        'mailMessages.read',
        'mailMessages.starred',
        'mailMessages.draft',
        'mailMessages.attachments',
        'mailMessages.note',
        'mailMessages.todo',
      ])
      .where(
        'mailMessages.accountId',
        'in',
        requested.map((account) => account.id),
      );
    const requestedFolderId =
      input.folderIds?.length === 1 ? input.folderIds[0] : undefined;
    const syntheticFolderType = requestedFolderId
      ? SYNTHETIC_FOLDER_TYPES[requestedFolderId]
      : undefined;
    if (requestedFolderId === MAIL_LOCAL_DRAFT_FOLDER_ID) {
      query = query.where('mailMessages.draft', '=', true);
    } else if (syntheticFolderType === 'drafts') {
      query = query.where((builder) =>
        builder.or([
          builder.exists(
            builder
              .selectFrom('mailMessageFolders')
              .select('messageId')
              .whereRef('mailMessageFolders.messageId', '=', 'mailMessages.id')
              .whereRef(
                'mailMessageFolders.accountId',
                '=',
                'mailMessages.accountId',
              )
              .where(
                'mailMessageFolders.providerFolderId',
                '=',
                MAIL_LOCAL_DRAFT_FOLDER_ID,
              ),
          ),
          builder.exists(
            builder
              .selectFrom('mailMessageFolders')
              .select('messageId')
              .where((folder) =>
                folder.exists(
                  folder
                    .selectFrom('mailFolders')
                    .select('id')
                    .whereRef(
                      'mailFolders.accountId',
                      '=',
                      'mailMessageFolders.accountId',
                    )
                    .whereRef(
                      'mailFolders.providerFolderId',
                      '=',
                      'mailMessageFolders.providerFolderId',
                    )
                    .where('mailFolders.type', '=', 'drafts'),
                ),
              )
              .whereRef('mailMessageFolders.messageId', '=', 'mailMessages.id')
              .whereRef(
                'mailMessageFolders.accountId',
                '=',
                'mailMessages.accountId',
              ),
          ),
        ]),
      );
    } else if (syntheticFolderType) {
      query = query.where((builder) =>
        builder.exists(
          builder
            .selectFrom('mailMessageFolders')
            .select('messageId')
            .where((folder) =>
              folder.exists(
                folder
                  .selectFrom('mailFolders')
                  .select('id')
                  .whereRef(
                    'mailFolders.accountId',
                    '=',
                    'mailMessageFolders.accountId',
                  )
                  .whereRef(
                    'mailFolders.providerFolderId',
                    '=',
                    'mailMessageFolders.providerFolderId',
                  )
                  .where('mailFolders.type', '=', syntheticFolderType),
              ),
            )
            .whereRef('mailMessageFolders.messageId', '=', 'mailMessages.id')
            .whereRef(
              'mailMessageFolders.accountId',
              '=',
              'mailMessages.accountId',
            ),
        ),
      );
      if (draftsOnlyInDraftFolders)
        query = query.where('mailMessages.draft', '=', false);
    } else if (input.folderIds?.length) {
      query = query.where((builder) => {
        let folders = builder
          .selectFrom('mailMessageFolders')
          .select('messageId')
          .whereRef('mailMessageFolders.messageId', '=', 'mailMessages.id')
          .whereRef(
            'mailMessageFolders.accountId',
            '=',
            'mailMessages.accountId',
          )
          .where((filter) =>
            filter.or([
              filter(
                'mailMessageFolders.providerFolderId',
                'in',
                input.folderIds!,
              ),
              filter.and([
                filter(
                  'mailMessageFolders.providerFolderId',
                  '=',
                  MAIL_LOCAL_DRAFT_FOLDER_ID,
                ),
                filter.exists(
                  filter
                    .selectFrom('mailFolders')
                    .select('id')
                    .whereRef(
                      'mailFolders.accountId',
                      '=',
                      'mailMessages.accountId',
                    )
                    .where(
                      'mailFolders.providerFolderId',
                      'in',
                      input.folderIds!,
                    )
                    .where('mailFolders.type', '=', 'drafts'),
                ),
              ]),
            ]),
          );
        if (draftsOnlyInDraftFolders)
          folders = folders.where((filter) =>
            filter.or([
              filter('mailMessages.draft', '=', false),
              filter(
                'mailMessageFolders.providerFolderId',
                '=',
                MAIL_LOCAL_DRAFT_FOLDER_ID,
              ),
              filter.exists(
                filter
                  .selectFrom('mailFolders')
                  .select('id')
                  .whereRef(
                    'mailFolders.accountId',
                    '=',
                    'mailMessages.accountId',
                  )
                  .whereRef(
                    'mailFolders.providerFolderId',
                    '=',
                    'mailMessageFolders.providerFolderId',
                  )
                  .where('mailFolders.type', '=', 'drafts'),
              ),
            ]),
          );
        return builder.exists(folders);
      });
    } else if (draftsOnlyInDraftFolders) {
      query = query.where('mailMessages.draft', '=', false);
    }
    // Keep the editable local draft visible without also listing its synced copy.
    query = query.where((builder) =>
      builder.or([
        builder('mailMessages.draft', '=', false),
        builder.not(
          builder.exists(
            builder
              .selectFrom('mailMessages as localDraft')
              .select('localDraft.id')
              .whereRef('localDraft.accountId', '=', 'mailMessages.accountId')
              .whereRef(
                'localDraft.providerDraftMessageId',
                '=',
                'mailMessages.providerMessageId',
              )
              .where('localDraft.providerMessageId', 'like', 'local-draft:%')
              .where('localDraft.draft', '=', true),
          ),
        ),
      ]),
    );
    if (input.labelIds?.length) {
      query = query.where((builder) =>
        builder.exists(
          builder
            .selectFrom('mailMessageLabels')
            .select('messageId')
            .whereRef('mailMessageLabels.messageId', '=', 'mailMessages.id')
            .where('mailMessageLabels.labelId', 'in', input.labelIds!),
        ),
      );
    }
    if (input.conversationId)
      query = query.where(
        'mailMessages.providerConversationId',
        '=',
        input.conversationId,
      );
    if (input.unread !== undefined)
      query = query.where('mailMessages.read', '=', !input.unread);
    if (input.starred !== undefined)
      query = query.where('mailMessages.starred', '=', input.starred);
    if (input.query)
      query = query.where((builder) =>
        builder.eb.or([
          builder.eb('mailMessages.subject', 'like', `%${input.query}%`),
          builder.eb('mailMessages.preview', 'like', `%${input.query}%`),
          builder.eb('mailMessages.senderSearch', 'like', `%${input.query}%`),
          builder.eb(
            'mailMessages.recipientsSearch',
            'like',
            `%${input.query}%`,
          ),
        ]),
      );
    const count = input.withTotal
      ? await query
          .clearSelect()
          .select(({ fn }) => [
            fn.count('mailMessages.id').distinct().as('count'),
          ])
          .executeTakeFirst<{ readonly count: number | string }>()
      : undefined;
    const total = input.withTotal ? Number(count?.count ?? 0) : undefined;
    if (cursor) {
      query = query.where((builder) =>
        builder.eb.or([
          builder.eb('mailMessages.sortAt', '<', cursor.sortAt),
          builder.eb.and([
            builder.eb('mailMessages.sortAt', '=', cursor.sortAt),
            builder.eb('mailMessages.id', '<', cursor.id),
          ]),
        ]),
      );
    }
    if (input.offset !== undefined) query = query.offset(input.offset);
    const rows = await query
      .orderBy('mailMessages.sortAt', 'desc')
      .orderBy('mailMessages.id', 'desc')
      .limit(limit + 1)
      .execute<MessageRow>();
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const lastItem = items.at(-1);
    const loaded = await loadMailMessageSummaries(this.database.query(), items);
    const conversationCounts = await countMessageConversations(
      this.database.query(),
      requested.map((account) => account.id),
      items,
    );
    return {
      ...(total === undefined ? {} : { total }),
      items: loaded.map((message) => ({
        ...message,
        ...(message.conversationId
          ? {
              subjectCount:
                conversationCounts.get(
                  conversationGroupKey(
                    message.accountId,
                    message.conversationId,
                  ),
                ) ?? 1,
            }
          : {}),
      })),
      nextCursor:
        hasMore && lastItem ? encodeMessageCursor(lastItem) : undefined,
    };
  }

  public async getMessage(
    userId: string,
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    const account = await this.accounts.getAccount(accountId);
    if (!account || account.userId !== userId) return undefined;
    return this.getMessageForAccount(accountId, messageId);
  }

  public async getMessageForAccount(
    accountId: string,
    messageId: string,
  ): Promise<MailMessage | undefined> {
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('id', '=', messageId)
      .where('accountId', '=', accountId)
      .executeTakeFirst<MessageRow>();
    return row
      ? (await loadMailMessages(this.database.query(), [row]))[0]
      : undefined;
  }

  public async listConversationMessages(
    userId: string,
    accountId: string,
    conversationId: string,
    input: MailListConversationMessagesInput = {},
  ): Promise<MailPage<MailMessage>> {
    const account = await this.accounts.getAccount(accountId);
    if (!account || account.userId !== userId) return { items: [] };
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const cursor = parseMessageCursor(input.cursor);
    let query = this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('providerConversationId', '=', conversationId)
      .where('draft', '=', false);
    if (cursor) {
      query = query.where((builder) =>
        builder.eb.or([
          builder.eb('sortAt', '<', cursor.sortAt),
          builder.eb.and([
            builder.eb('sortAt', '=', cursor.sortAt),
            builder.eb('id', '<', cursor.id),
          ]),
        ]),
      );
    }
    const rows = await query
      .orderBy('sortAt', 'desc')
      .orderBy('id', 'desc')
      .limit(limit + 1)
      .execute<MessageRow>();
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const lastItem = items.at(-1);
    return {
      items: await loadMailMessages(
        this.database.query(),
        [...items].reverse(),
      ),
      nextCursor:
        hasMore && lastItem ? encodeMessageCursor(lastItem) : undefined,
    };
  }

  public async updateMessageState(
    accountId: string,
    messageId: string,
    state: {
      readonly read?: boolean;
      readonly starred?: boolean;
      readonly note?: string | null;
      readonly todo?: boolean;
    },
  ): Promise<MailMessage | undefined> {
    const values: Partial<MessageRow> = {
      ...(state.read === undefined ? {} : { read: state.read }),
      ...(state.starred === undefined ? {} : { starred: state.starred }),
      ...(state.note === undefined ? {} : { note: state.note }),
      ...(state.todo === undefined ? {} : { todo: state.todo }),
      updatedAt: new Date().toISOString(),
    };
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, accountId);
      await query
        .updateTable<MessageRow>('mailMessages')
        .set(values)
        .where('id', '=', messageId)
        .where('accountId', '=', accountId)
        .execute();
    });
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('id', '=', messageId)
      .where('accountId', '=', accountId)
      .executeTakeFirst<MessageRow>();
    return row
      ? (await loadMailMessages(this.database.query(), [row]))[0]
      : undefined;
  }

  public async updateMessageLabels(
    accountId: string,
    messageId: string,
    addLabelIds: readonly string[],
    removeLabelIds: readonly string[],
  ): Promise<MailMessage | undefined> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, accountId);
      const row = await connection.query
        .selectFrom<MessageRow>('mailMessages')
        .select('id')
        .where('id', '=', messageId)
        .where('accountId', '=', accountId)
        .executeTakeFirst<Pick<MessageRow, 'id'>>();
      if (!row) return;
      await connection.query
        .updateTable<MessageRow>('mailMessages')
        .set({ updatedAt: new Date().toISOString() })
        .where('id', '=', messageId)
        .execute();
      if (removeLabelIds.length > 0) {
        await connection.query
          .deleteFrom<MessageLabelRow>('mailMessageLabels')
          .where('messageId', '=', messageId)
          .where('labelId', 'in', removeLabelIds)
          .execute();
      }
      for (const labelId of addLabelIds) {
        const exists = await connection.query
          .selectFrom<MessageLabelRow>('mailMessageLabels')
          .select('messageId')
          .where('messageId', '=', messageId)
          .where('labelId', '=', labelId)
          .executeTakeFirst();
        if (!exists) {
          await connection.query
            .insertInto<MessageLabelRow>('mailMessageLabels')
            .values({
              messageId,
              labelId,
            })
            .execute();
        }
      }
    });
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('id', '=', messageId)
      .where('accountId', '=', accountId)
      .executeTakeFirst<MessageRow>();
    return row
      ? (await loadMailMessages(this.database.query(), [row]))[0]
      : undefined;
  }

  public async countUnreadMessages(userId: string): Promise<number> {
    const accounts = (await this.accounts.listAccounts(userId)).filter(
      (account) => !['suspended', 'removing'].includes(account.status),
    );
    if (accounts.length === 0) return 0;
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .select((builder) => [builder.fn.countAll<number>().as('count')])
      .where(
        'accountId',
        'in',
        accounts.map((account) => account.id),
      )
      .where('read', '=', false)
      .executeTakeFirst<{ readonly count: number | string }>();
    return Number(row?.count ?? 0);
  }

  public async moveMessage(
    accountId: string,
    messageId: string,
    providerMessageId: string,
    providerFolderId: string,
  ): Promise<MailMessage | undefined> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, accountId);
      const existing = await connection.query
        .selectFrom<MessageRow>('mailMessages')
        .select(['providerMessageId', 'draft'])
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .executeTakeFirst<MessageRow>();
      if (!existing) return;
      await assertDraftEditable(connection.query, accountId, messageId);
      const updated = await connection.query
        .updateTable<MessageRow>('mailMessages')
        .set({
          ...(existing.draft &&
          existing.providerMessageId.startsWith('local-draft:')
            ? { providerDraftMessageId: providerMessageId }
            : { providerMessageId }),
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', messageId)
        .where('accountId', '=', accountId)
        .execute();
      if (updated.updatedCount !== 1) return;
      await connection.query
        .deleteFrom<MessageFolderRow>('mailMessageFolders')
        .where('accountId', '=', accountId)
        .where('messageId', '=', messageId)
        .execute();
      await connection.query
        .insertInto<MessageFolderRow>('mailMessageFolders')
        .values({
          accountId,
          messageId,
          providerFolderId,
        })
        .execute();
    });
    const row = await this.database
      .query()
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('id', '=', messageId)
      .where('accountId', '=', accountId)
      .executeTakeFirst<MessageRow>();
    return row
      ? (await loadMailMessages(this.database.query(), [row]))[0]
      : undefined;
  }

  public async deleteMessage(
    accountId: string,
    messageId: string,
    expectedUpdatedAt?: string,
    acceptedSubmissionId?: string,
  ): Promise<boolean> {
    return this.database.transaction(async (connection): Promise<boolean> => {
      await lockWritableAccount(connection.query, accountId);
      await assertDraftDeletable(
        connection.query,
        accountId,
        messageId,
        acceptedSubmissionId,
      );
      if (expectedUpdatedAt !== undefined) {
        await lockWritableAccount(connection.query, accountId);
        const current = await connection.query
          .selectFrom<MessageRow>('mailMessages')
          .selectAll()
          .where('accountId', '=', accountId)
          .where('id', '=', messageId)
          .executeTakeFirst<MessageRow>();
        if (!current?.draft || current.updatedAt !== expectedUpdatedAt)
          return false;
      }
      const draft = await connection.query
        .selectFrom<MessageRow>('mailMessages')
        .select('id')
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .where('draft', '=', true)
        .executeTakeFirst();
      if (draft) {
        await closeDrafts(connection.query, accountId, messageId);
        return true;
      }
      await connection.query
        .deleteFrom<MessageFolderRow>('mailMessageFolders')
        .where('accountId', '=', accountId)
        .where('messageId', '=', messageId)
        .execute();
      await connection.query
        .deleteFrom<MessageLabelRow>('mailMessageLabels')
        .where('messageId', '=', messageId)
        .execute();
      const deleted = await connection.query
        .deleteFrom<MessageRow>('mailMessages')
        .where('accountId', '=', accountId)
        .where('id', '=', messageId)
        .execute();
      return deleted.deletedCount === 1;
    });
  }
}
