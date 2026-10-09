import { acceptDraftWrite } from './draft-states.js';
import { assertDraftEditable } from './scheduled-drafts.js';
import { type QueryAdapter } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../shared/mail.js';
import { type NormalizedMailMessage } from '../contracts/provider.js';
import { toMessageRow } from './mappers.js';
import {
  type FolderRow,
  type MessageFolderRow,
  type MessageLabelRow,
  type MessageRow,
} from './rows.js';
import { chunks } from './serialization.js';

export async function upsertMessages(
  query: QueryAdapter,
  accountId: string,
  messages: readonly NormalizedMailMessage[],
  preserveUpdatedAfter?: string,
): Promise<void> {
  const uniqueMessages = [
    ...new Map(
      messages.map((message) => [message.providerMessageId, message]),
    ).values(),
  ];
  if (uniqueMessages.length === 0) return;
  const now = new Date().toISOString();
  const existingRows = await query
    .selectFrom<MessageRow>('mailMessages')
    .select([
      'id',
      'providerMessageId',
      'createdAt',
      'updatedAt',
      'contentStatus',
      'note',
      'todo',
    ])
    .where('accountId', '=', accountId)
    .where(
      'providerMessageId',
      'in',
      uniqueMessages.map((message) => message.providerMessageId),
    )
    .execute<
      Pick<
        MessageRow,
        | 'id'
        | 'providerMessageId'
        | 'createdAt'
        | 'updatedAt'
        | 'contentStatus'
        | 'note'
        | 'todo'
      >
    >();
  const existingByProviderId = new Map(
    existingRows.map((row) => [row.providerMessageId, row]),
  );
  const rows: MessageRow[] = [];
  const draftIds = uniqueMessages
    .filter((message) => message.draft)
    .map((message) => message.providerMessageId);
  const acceptedDrafts = draftIds.length
    ? await query
        .selectFrom('mailSubmissions')
        .select('providerMessageId')
        .where('accountId', '=', accountId)
        .where('status', '=', 'accepted')
        .where('providerMessageId', 'in', draftIds)
        .execute<{ providerMessageId: string }>()
    : [];
  const acceptedIds = new Set(
    acceptedDrafts.map((row) => row.providerMessageId),
  );
  for (const message of uniqueMessages) {
    // Graph can still return its pre-send draft briefly after accepting delivery.
    if (message.draft && acceptedIds.has(message.providerMessageId)) continue;
    if (
      message.draft &&
      !(await acceptDraftWrite(
        query,
        accountId,
        message.providerMessageId,
        message.draftRevision,
      ))
    )
      continue;
    const existing = existingByProviderId.get(message.providerMessageId);
    if (
      existing &&
      ((preserveUpdatedAfter && existing.updatedAt >= preserveUpdatedAfter) ||
        (existing.contentStatus === 'complete' &&
          message.contentStatus &&
          message.contentStatus !== 'complete'))
    )
      continue;
    const row = toMessageRow(
      accountId,
      message,
      existing?.id ?? randomUUID(),
      existing?.createdAt ?? now,
      now,
      existing,
    );
    rows.push(row);
    if (existing) {
      await assertDraftEditable(query, accountId, existing.id);
      await query
        .updateTable<MessageRow>('mailMessages')
        .set(row)
        .where('id', '=', existing.id)
        .execute();
    }
  }
  const newRows = rows.filter(
    (row) => !existingByProviderId.has(row.providerMessageId),
  );
  for (const batch of chunks(newRows, 25)) {
    await query.insertInto<MessageRow>('mailMessages').values(batch).execute();
  }
  if (rows.length === 0) return;
  const messageIds = rows.map((row) => row.id);
  await query
    .deleteFrom<MessageFolderRow>('mailMessageFolders')
    .where('messageId', 'in', messageIds)
    .execute();
  const foldersByProviderMessageId = new Map(
    uniqueMessages.map((message) => [
      message.providerMessageId,
      message.providerFolderIds,
    ]),
  );
  const folderRows = rows.flatMap((row) =>
    [
      ...new Set(foldersByProviderMessageId.get(row.providerMessageId) ?? []),
    ].map((providerFolderId): MessageFolderRow => ({
      accountId,
      messageId: row.id,
      providerFolderId,
    })),
  );
  for (const batch of chunks(folderRows, 100)) {
    await query
      .insertInto<MessageFolderRow>('mailMessageFolders')
      .values(batch)
      .execute();
  }
}

export async function removeStaleMessageFolders(
  query: QueryAdapter,
  accountId: string,
  completeProviderFolderIds: readonly string[],
): Promise<void> {
  let deleteQuery = query
    .deleteFrom<MessageFolderRow>('mailMessageFolders')
    .where('accountId', '=', accountId)
    .where('providerFolderId', '!=', MAIL_LOCAL_DRAFT_FOLDER_ID);
  if (completeProviderFolderIds.length > 0) {
    deleteQuery = deleteQuery.where(
      'providerFolderId',
      'not in',
      completeProviderFolderIds,
    );
  }
  await deleteQuery.execute();
}

export async function upsertFolders(
  query: QueryAdapter,
  accountId: string,
  folders: readonly import('../contracts/provider.js').NormalizedMailFolder[],
): Promise<void> {
  for (const folder of folders) {
    const existing = await query
      .selectFrom<FolderRow>('mailFolders')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', folder.providerFolderId)
      .executeTakeFirst<Pick<FolderRow, 'id'>>();
    const row: FolderRow = {
      id: existing?.id ?? randomUUID(),
      accountId,
      ...folder,
    };
    if (existing) {
      await assertDraftEditable(query, accountId, existing.id);
      await query
        .updateTable<FolderRow>('mailFolders')
        .set(row)
        .where('id', '=', existing.id)
        .execute();
    } else {
      await query.insertInto<FolderRow>('mailFolders').values(row).execute();
    }
  }
}

export async function deleteMessages(
  query: QueryAdapter,
  accountId: string,
  providerMessageIds: readonly string[],
): Promise<void> {
  if (providerMessageIds.length === 0) return;
  for (const providerIds of chunks(providerMessageIds, 100)) {
    const messages = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerMessageId', 'in', providerIds)
      .execute<Pick<MessageRow, 'id'>>();
    if (messages.length > 0) {
      const messageIds = messages.map((message) => message.id);
      for (const ids of chunks(messageIds, 100)) {
        await query
          .deleteFrom<MessageFolderRow>('mailMessageFolders')
          .where('messageId', 'in', ids)
          .execute();
        await query
          .deleteFrom<MessageLabelRow>('mailMessageLabels')
          .where('messageId', 'in', ids)
          .execute();
      }
      await query
        .deleteFrom<MessageRow>('mailMessages')
        .where('accountId', '=', accountId)
        .where('providerMessageId', 'in', providerIds)
        .execute();
    }
  }
}

export async function removeMessagesFromFolders(
  query: QueryAdapter,
  accountId: string,
  removals: readonly import('../contracts/provider.js').MailProviderFolderRemoval[],
): Promise<void> {
  for (const removal of removals) {
    const row = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerMessageId', '=', removal.providerMessageId)
      .executeTakeFirst<Pick<MessageRow, 'id'>>();
    if (!row) continue;
    await query
      .deleteFrom<MessageFolderRow>('mailMessageFolders')
      .where('messageId', '=', row.id)
      .where('providerFolderId', '=', removal.providerFolderId)
      .execute();
  }
}
