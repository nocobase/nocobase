import { toSubmissionView } from '../views.js';
import { fromSubmissionRow } from './mappers.js';
import type { SubmissionRow } from './rows.js';
import { type QueryAdapter } from '@nocobase/db';
import {
  type MailMessage,
  type MailMessageSummary,
} from '../../shared/mail.js';
import { toMailMessage, toMailMessageSummary } from './mappers.js';
import {
  type MessageFolderRow,
  type MessageLabelRow,
  type MessageRow,
} from './rows.js';

export async function countMessageConversations(
  query: QueryAdapter,
  accountIds: readonly string[],
  rows: readonly MessageRow[],
): Promise<ReadonlyMap<string, number>> {
  const counts = new Map<string, number>();
  const conversationIds = [
    ...new Set(
      rows
        .map((row) => row.providerConversationId)
        .filter((conversationId): conversationId is string =>
          Boolean(conversationId),
        ),
    ),
  ];

  if (accountIds.length === 0) return counts;

  // The conversation detail view includes every non-draft message in a Provider
  // conversation, so its badge must not be narrowed by the current mailbox
  // folder, search, unread, or starred filters.
  if (conversationIds.length > 0) {
    const conversationCountRows = await query
      .selectFrom<MessageRow>('mailMessages')
      .select(['mailMessages.accountId', 'mailMessages.providerConversationId'])
      .select(({ fn }) => [fn.count<number>('mailMessages.id').as('count')])
      .where('mailMessages.accountId', 'in', accountIds)
      .where('mailMessages.providerConversationId', 'in', conversationIds)
      .where('mailMessages.draft', '=', false)
      .groupBy([
        'mailMessages.accountId',
        'mailMessages.providerConversationId',
      ])
      .execute<{
        readonly accountId: string;
        readonly providerConversationId: string;
        readonly count: number | string;
      }>();

    for (const row of conversationCountRows) {
      counts.set(
        conversationGroupKey(row.accountId, row.providerConversationId),
        Number(row.count),
      );
    }
  }

  return counts;
}

export function conversationGroupKey(
  accountId: string,
  conversationId: string,
): string {
  return `${accountId}:conversation:${conversationId}`;
}

export async function loadMailMessages(
  query: QueryAdapter,
  rows: readonly MessageRow[],
): Promise<MailMessage[]> {
  if (rows.length === 0) return [];
  const relations = await loadMessageRelations(query, rows);
  const states = await query
    .selectFrom('mailDraftStates')
    .select(['accountId', 'providerMessageId', 'revision'])
    .where('accountId', 'in', [...new Set(rows.map((row) => row.accountId))])
    .where(
      'providerMessageId',
      'in',
      rows.map((row) => row.providerMessageId),
    )
    .execute<{
      accountId: string;
      providerMessageId: string;
      revision: number;
    }>();
  const revisions = new Map(
    states.map((state) => [
      `${state.accountId}:${state.providerMessageId}`,
      Number(state.revision),
    ]),
  );
  return rows.map((row) => ({
    draftRevision: row.draft
      ? revisions.get(`${row.accountId}:${row.providerMessageId}`)
      : undefined,
    ...toMailMessage(
      row,
      relations.folderIdsByMessageId.get(row.id) ?? [],
      relations.labelIdsByMessageId.get(row.id) ?? [],
    ),
    scheduledSend: row.scheduledSubmissionId
      ? relations.submissions.get(row.scheduledSubmissionId)
      : undefined,
  }));
}

export async function loadMailMessageSummaries(
  query: QueryAdapter,
  rows: readonly MessageRow[],
): Promise<MailMessageSummary[]> {
  if (rows.length === 0) return [];
  const relations = await loadMessageRelations(query, rows);
  return rows.map((row) => ({
    ...toMailMessageSummary(
      row,
      relations.folderIdsByMessageId.get(row.id) ?? [],
      relations.labelIdsByMessageId.get(row.id) ?? [],
    ),
    scheduledSend: row.scheduledSubmissionId
      ? relations.submissions.get(row.scheduledSubmissionId)
      : undefined,
  }));
}

async function loadMessageRelations(
  query: QueryAdapter,
  rows: readonly MessageRow[],
): Promise<{
  readonly submissions: ReadonlyMap<
    string,
    import('../../shared/mail.js').MailSubmissionView
  >;
  readonly folderIdsByMessageId: ReadonlyMap<string, readonly string[]>;
  readonly labelIdsByMessageId: ReadonlyMap<string, readonly string[]>;
}> {
  const messageIds = rows.map((row) => row.id);
  const [folderRows, labelRows] = await Promise.all([
    query
      .selectFrom<MessageFolderRow>('mailMessageFolders')
      .select(['messageId', 'providerFolderId'])
      .where('messageId', 'in', messageIds)
      .execute<Pick<MessageFolderRow, 'messageId' | 'providerFolderId'>>(),
    query
      .selectFrom<MessageLabelRow>('mailMessageLabels')
      .select(['messageId', 'labelId'])
      .where('messageId', 'in', messageIds)
      .execute<Pick<MessageLabelRow, 'messageId' | 'labelId'>>(),
  ]);
  const folderIdsByMessageId = new Map<string, string[]>();
  for (const folderRow of folderRows) {
    const folderIds = folderIdsByMessageId.get(folderRow.messageId) ?? [];
    folderIds.push(folderRow.providerFolderId);
    folderIdsByMessageId.set(folderRow.messageId, folderIds);
  }
  const labelIdsByMessageId = new Map<string, string[]>();
  for (const labelRow of labelRows) {
    const labelIds = labelIdsByMessageId.get(labelRow.messageId) ?? [];
    labelIds.push(labelRow.labelId);
    labelIdsByMessageId.set(labelRow.messageId, labelIds);
  }
  const ids = rows.flatMap((row) =>
    row.scheduledSubmissionId ? [row.scheduledSubmissionId] : [],
  );
  const submissions = ids.length
    ? await query
        .selectFrom<SubmissionRow>('mailSubmissions')
        .selectAll()
        .where('id', 'in', ids)
        .execute<SubmissionRow>()
    : [];
  return {
    folderIdsByMessageId,
    labelIdsByMessageId,
    submissions: new Map(
      submissions.map((row) => [
        row.id,
        toSubmissionView(fromSubmissionRow(row)),
      ]),
    ),
  };
}
