import { randomUUID } from 'node:crypto';
import type { QueryAdapter } from '@nocobase/db';
import type { MessageRow } from './rows.js';
import { MailError } from '../services/errors.js';

interface DraftStateRow {
  [key: string]: unknown;
  id: string;
  accountId: string;
  providerMessageId: string;
  revision: number | string;
  closed: boolean;
}

/** The caller holds the account write lock. Closed drafts are never resurrected. */
export async function acceptDraftWrite(
  query: QueryAdapter,
  accountId: string,
  providerMessageId: string,
  revision?: number,
): Promise<boolean> {
  const state = await query
    .selectFrom<DraftStateRow>('mailDraftStates')
    .selectAll()
    .where('accountId', '=', accountId)
    .where('providerMessageId', '=', providerMessageId)
    .executeTakeFirst<DraftStateRow>();
  if (state?.closed) return false;
  if (revision !== undefined && state && Number(state.revision) >= revision)
    throw new MailError({
      status: 'ABORTED',
      reason: 'MAIL_DRAFT_REVISION_OUTDATED',
      message: 'The draft revision is outdated.',
    });
  if (state)
    await query
      .updateTable<DraftStateRow>('mailDraftStates')
      .set({ revision: revision ?? Number(state.revision) })
      .where('id', '=', state.id)
      .execute();
  else
    await query
      .insertInto<DraftStateRow>('mailDraftStates')
      .values({
        id: randomUUID(),
        accountId,
        providerMessageId,
        revision: revision ?? 0,
        closed: false,
      })
      .execute();
  return true;
}

export async function closeDrafts(
  query: QueryAdapter,
  accountId: string,
  messageId?: string,
  draftKey?: string,
): Promise<void> {
  const providerKey = draftKey ? `local-draft:${draftKey}` : undefined;
  let selection = query
    .selectFrom<MessageRow>('mailMessages')
    .selectAll()
    .where('accountId', '=', accountId)
    .where('draft', '=', true);
  if (messageId) selection = selection.where('id', '=', messageId);
  else if (providerKey)
    selection = selection.where('providerMessageId', '=', providerKey);
  else return;
  const draft = await selection.executeTakeFirst<MessageRow>();
  const keys = [
    ...new Set(
      [
        providerKey,
        draft?.providerMessageId,
        draft?.providerDraftMessageId,
      ].filter((key): key is string => Boolean(key)),
    ),
  ];
  for (const providerMessageId of keys) {
    const state = await query
      .selectFrom<DraftStateRow>('mailDraftStates')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerMessageId', '=', providerMessageId)
      .executeTakeFirst<DraftStateRow>();
    if (state)
      await query
        .updateTable<DraftStateRow>('mailDraftStates')
        .set({ closed: true })
        .where('id', '=', state.id)
        .execute();
    else
      await query
        .insertInto<DraftStateRow>('mailDraftStates')
        .values({
          id: randomUUID(),
          accountId,
          providerMessageId,
          revision: 0,
          closed: true,
        })
        .execute();
  }
  if (!draft) return;
  await query
    .deleteFrom('mailMessageFolders')
    .where('messageId', '=', draft.id)
    .execute();
  await query
    .deleteFrom('mailMessageLabels')
    .where('messageId', '=', draft.id)
    .execute();
  await query.deleteFrom('mailMessages').where('id', '=', draft.id).execute();
}
