import type { QueryAdapter } from '@nocobase/db';
import { fromSubmissionRow } from './mappers.js';
import type { MessageRow, SubmissionRow } from './rows.js';
import { mailFailedPrecondition } from '../services/errors.js';

/** Call while holding the account write lock so schedule and edits serialize. */
export async function assertDraftEditable(
  query: QueryAdapter,
  accountId: string,
  messageId: string,
): Promise<void> {
  const row = await query
    .selectFrom<MessageRow>('mailMessages')
    .select([
      'scheduledSubmissionId',
      'imapIdSource',
      'providerDraftMessageIdSource',
    ])
    .where('accountId', '=', accountId)
    .where('id', '=', messageId)
    .executeTakeFirst<MessageRow>();
  if (row?.imapIdSource || row?.providerDraftMessageIdSource)
    await assertNoPendingMove(query, accountId, messageId);
  if (row?.scheduledSubmissionId)
    throw mailFailedPrecondition(
      'MAIL_DRAFT_SCHEDULED',
      'Cancel the scheduled delivery before editing or deleting this draft.',
    );
}

/** Only the worker that completed this exact delivery may remove the locked draft. */
export async function assertDraftDeletable(
  query: QueryAdapter,
  accountId: string,
  messageId: string,
  acceptedSubmissionId?: string,
): Promise<void> {
  const row = await query
    .selectFrom<MessageRow>('mailMessages')
    .select([
      'scheduledSubmissionId',
      'imapIdSource',
      'providerDraftMessageIdSource',
    ])
    .where('accountId', '=', accountId)
    .where('id', '=', messageId)
    .executeTakeFirst<MessageRow>();
  if (row?.imapIdSource || row?.providerDraftMessageIdSource)
    await assertNoPendingMove(query, accountId, messageId);
  if (!row?.scheduledSubmissionId) return;
  if (acceptedSubmissionId === row.scheduledSubmissionId) {
    const submission = await query
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where('id', '=', acceptedSubmissionId)
      .where('accountId', '=', accountId)
      .where('status', '=', 'accepted')
      .executeTakeFirst<SubmissionRow>();
    if (
      submission &&
      !fromSubmissionRow(submission).error?.recipients?.rejected.length
    )
      return;
  }
  throw mailFailedPrecondition(
    'MAIL_DRAFT_SCHEDULED',
    'Cancel the scheduled delivery before deleting this draft.',
  );
}

/** The schedule/edit lock must respect durable IMAP protection while the network is in flight. */
async function assertNoPendingMove(
  query: QueryAdapter,
  accountId: string,
  messageId: string,
): Promise<void> {
  const pending = await query
    .selectFrom('mailMessageImapLocations')
    .select('id')
    .where('accountId', '=', accountId)
    .where('messageId', '=', messageId)
    .where('status', '=', 'pending')
    .where('invalidationReason', 'like', 'move-%')
    .executeTakeFirst();
  if (pending)
    throw mailFailedPrecondition(
      'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
      'Verify the pending move before editing or scheduling this draft.',
    );
}
