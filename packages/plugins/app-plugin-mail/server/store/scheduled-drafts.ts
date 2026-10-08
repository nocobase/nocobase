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
    .select('scheduledSubmissionId')
    .where('accountId', '=', accountId)
    .where('id', '=', messageId)
    .executeTakeFirst<MessageRow>();
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
    .select('scheduledSubmissionId')
    .where('accountId', '=', accountId)
    .where('id', '=', messageId)
    .executeTakeFirst<MessageRow>();
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
