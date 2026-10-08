import { toPublicError } from './services/errors.js';
import {
  type MailAccount,
  type MailAccountView,
  type MailSubmission,
  type MailSubmissionLogView,
  type MailSubmissionView,
  type MailSyncRun,
  type MailSyncRunView,
} from '../shared/mail.js';

export function toSyncRunView(run: MailSyncRun): MailSyncRunView {
  return {
    id: run.id,
    accountId: run.accountId,
    mode: run.mode,
    phase: run.phase,
    status: run.status,
    policy: run.policy,
    historyComplete: run.historyComplete,
    recovering: run.recovering,
    pendingMessages: run.pendingMessages,
    processedMessages: run.processedMessages,
    processedPages: run.processedPages,
    error: run.error ? toPublicError(run.error) : undefined,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt,
  };
}

export function toSubmissionView(
  submission: MailSubmission,
): MailSubmissionView {
  return {
    id: submission.id,
    accountId: submission.accountId,
    status: submission.status,
    providerMessageId: submission.providerMessageId,
    scheduledAt: submission.scheduledAt,
    error: submission.error ? toPublicError(submission.error) : undefined,
  };
}

export function toSubmissionLogView(
  submission: import('./contracts/persistence.js').MailStoredSubmission,
): MailSubmissionLogView {
  return {
    ...toSubmissionView(submission),
    text: submission.text,
    html: submission.html,
    cc: submission.cc,
    bcc: submission.bcc,
    attachmentIds: submission.attachmentIds,
    attachmentContentIds: submission.attachmentContentIds,
    recipients: submission.recipients,
    subject: submission.subject,
    bulk: submission.bulk,
    batchId: submission.batchId,
    canRetry:
      submission.status === 'failed' && submission.hasComposeInput === true,
    canCancel:
      ['pending', 'failed'].includes(submission.status) &&
      submission.hasComposeInput === true,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

export function toMailAccountView(account: MailAccount): MailAccountView {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    address: account.address,
    displayName: account.displayName,
    scopes: account.scopes,
    status: account.status,
    removalFailed: account.removalFailed,
    initialSyncReceivedAfter: account.initialSyncReceivedAfter,
    automaticSyncIntervalMinutes: account.automaticSyncIntervalMinutes,
  };
}
