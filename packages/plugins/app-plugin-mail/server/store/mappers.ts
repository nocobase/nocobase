import { createHash } from 'node:crypto';
import { isVisibleMailAttachment } from '../../shared/inline-images.js';
import { DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES } from '../config.js';
import {
  DEFAULT_MAIL_LABEL_COLOR,
  type MailAccount,
  type MailAttachment,
  type MailDraftConflict,
  type MailFolder,
  type MailIdentity,
  type MailLabel,
  type MailMessage,
  type MailMessageSummary,
  type MailProviderError,
  type MailSignature,
  type MailSyncCursor,
  type MailSyncRun,
  type MailTemplate,
  type NormalizedMailAttachment,
  isMailLabelColor,
} from '../../shared/mail.js';
import {
  type MailOutboxRecord,
  type MailRequestSyncPayload,
  type MailScheduledSendTaskPayload,
  type MailStoredSubmission,
  type MailSyncMailboxTaskPayload,
} from '../contracts/persistence.js';
import {
  type MailProviderPushSubscription,
  type NormalizedMailMessage,
} from '../contracts/provider.js';
import {
  type AccountRow,
  type FolderRow,
  type IdentityRow,
  type LabelRow,
  type MessageRow,
  type OutboxRow,
  type PushSubscriptionRow,
  type SignatureRow,
  type SubmissionRow,
  type SyncRunRow,
  type TemplateRow,
} from './rows.js';
import {
  jsonOrNull,
  normalizeAddress,
  parseJson,
  toIsoString,
} from './serialization.js';

export function toAccountRow(
  account: MailAccount,
  updatedAt: string,
  createdAt?: string,
): AccountRow {
  return {
    id: account.id,
    userId: account.userId,
    providerType: account.provider.type,
    providerName: account.provider.name,
    address: normalizeAddress(account.address),
    displayName: account.displayName,
    credentialReference: account.credentialReference,
    authorizationSubject: account.authorizationSubject,
    scopes: JSON.stringify(account.scopes),
    status: account.status,
    initialSyncReceivedAfter: account.initialSyncReceivedAfter ?? null,
    automaticSyncIntervalMinutes:
      account.automaticSyncIntervalMinutes ??
      DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
    createdAt: createdAt ?? updatedAt,
    updatedAt,
  };
}

export function fromAccountRow(row: AccountRow): MailAccount {
  return {
    id: row.id,
    userId: row.userId,
    provider: { type: row.providerType, name: row.providerName },
    address: row.address,
    displayName: row.displayName ?? undefined,
    credentialReference: row.credentialReference,
    authorizationSubject: row.authorizationSubject ?? undefined,
    scopes: parseJson<readonly string[]>(row.scopes, 'account scopes'),
    status: row.status,
    removalFailed: row.removalFailed || undefined,
    initialSyncReceivedAfter: row.initialSyncReceivedAfter ?? undefined,
    automaticSyncIntervalMinutes:
      row.automaticSyncIntervalMinutes ??
      DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES,
  };
}

export function toIdentityRow(identity: MailIdentity): IdentityRow {
  return {
    id: identity.id,
    accountId: identity.accountId,
    address: normalizeAddress(identity.address),
    displayName: identity.displayName,
    primaryForAccountId: identity.isPrimary ? identity.accountId : null,
    canSend: identity.canSend,
  };
}

export function fromIdentityRow(row: IdentityRow): MailIdentity {
  return {
    id: row.id,
    accountId: row.accountId,
    address: row.address,
    displayName: row.displayName ?? undefined,
    isPrimary: Boolean(row.primaryForAccountId),
    canSend: Boolean(row.canSend),
  };
}

export function fromSignatureRow(row: SignatureRow): MailSignature {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    text: row.text,
    html: row.html ?? undefined,
    isDefault: Boolean(row.defaultForAccountId),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toMailTemplate(row: TemplateRow): MailTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    text: row.text ?? undefined,
    html: row.html ?? '',
    ownerId: row.ownerId,
  };
}

export function fromFolderRow(row: FolderRow): MailFolder {
  return {
    id: row.id,
    accountId: row.accountId,
    providerFolderId: row.providerFolderId,
    type: row.type,
    name: row.name,
    unreadCount: row.unreadCount ?? undefined,
    kind: row.kind,
  };
}

export function fromLabelRow(row: LabelRow): MailLabel {
  return {
    id: row.id,
    name: row.name,
    color: isMailLabelColor(row.color) ? row.color : DEFAULT_MAIL_LABEL_COLOR,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toMessageRow(
  accountId: string,
  message: NormalizedMailMessage,
  id: string,
  createdAt: string,
  updatedAt: string,
  local?: Pick<MessageRow, 'note' | 'todo'>,
): MessageRow {
  return {
    id,
    accountId,
    contentStatus: message.contentStatus ?? 'complete',
    contentError: message.contentError ?? null,
    size: message.size ?? null,
    providerMessageId: message.providerMessageId,
    providerDraftId: message.providerDraftId,
    providerDraftMessageId: message.providerDraftMessageId,
    internetMessageId: message.internetMessageId,
    providerConversationId:
      message.providerConversationId ?? fallbackConversationId(message),
    senderSearch: message.from
      ? [message.from.name, message.from.address].filter(Boolean).join(' ')
      : '',
    recipientsSearch: [...message.to, ...message.cc, ...message.bcc]
      .flatMap((address) => [address.name, address.address])
      .filter(Boolean)
      .join(' '),
    sender: jsonOrNull(message.from),
    recipients: JSON.stringify({
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
    }),
    replyTo: JSON.stringify(message.replyTo),
    inReplyTo: message.inReplyTo,
    references: JSON.stringify(message.references),
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
    receivedAt: message.receivedAt ?? null,
    sentAt: message.sentAt ?? null,
    sortAt: message.receivedAt ?? message.sentAt ?? createdAt,
    read: message.read,
    starred: message.starred,
    draft: message.draft,
    attachments: JSON.stringify(message.attachments),
    note: local?.note ?? null,
    todo: local?.todo ?? false,
    draftConflict: jsonOrNull(message.draftConflict),
    draftSource: jsonOrNull(message.draftSource),
    remoteDraftFingerprint: message.remoteDraftFingerprint ?? null,
    createdAt,
    updatedAt,
  };
}

export function toMailMessageSummary(
  row: MessageRow,
  folderIds: readonly string[],
  labelIds: readonly string[],
): MailMessageSummary {
  const recipients = parseJson<{
    readonly to: MailMessageSummary['to'];
    readonly cc: MailMessageSummary['cc'];
    readonly bcc: MailMessageSummary['bcc'];
  }>(row.recipients, 'message recipients');
  const attachments = parseJson<readonly NormalizedMailAttachment[]>(
    row.attachments,
    'message attachments',
  );
  return {
    id: row.id,
    accountId: row.accountId,
    contentStatus: row.contentStatus ?? 'complete',
    contentError: row.contentError ?? undefined,
    size: row.size ?? undefined,
    providerMessageId: row.providerMessageId,
    providerDraftId: row.providerDraftId ?? undefined,
    providerDraftMessageId: row.providerDraftMessageId ?? undefined,
    internetMessageId: row.internetMessageId ?? undefined,
    conversationId: row.providerConversationId ?? undefined,
    folderIds,
    labelIds,
    from: row.sender
      ? parseJson<NonNullable<MailMessageSummary['from']>>(
          row.sender,
          'message sender',
        )
      : undefined,
    ...recipients,
    subject: row.subject,
    preview: row.preview ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
    sentAt: row.sentAt ?? undefined,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
    draft: Boolean(row.draft),
    hasAttachments: attachments.some(isVisibleMailAttachment),
    note: row.note ?? undefined,
    todo: Boolean(row.todo),
    draftConflict: row.draftConflict
      ? parseJson<MailDraftConflict>(row.draftConflict, 'draft conflict')
      : undefined,
  };
}

export function toMailMessage(
  row: MessageRow,
  folderIds: readonly string[],
  labelIds: readonly string[],
): MailMessage {
  const recipients = parseJson<{
    readonly to: MailMessage['to'];
    readonly cc: MailMessage['cc'];
    readonly bcc: MailMessage['bcc'];
  }>(row.recipients, 'message recipients');
  const attachments = parseJson<readonly NormalizedMailAttachment[]>(
    row.attachments,
    'message attachments',
  ).map((attachment): MailAttachment => ({
    ...attachment,
    id: `${row.id}:${attachment.providerAttachmentId}`,
    messageId: row.id,
  }));
  return {
    id: row.id,
    updatedAt: row.updatedAt,
    draftSource: row.draftSource
      ? parseJson<NonNullable<MailMessage['draftSource']>>(
          row.draftSource,
          'draft source',
        )
      : undefined,
    remoteDraftFingerprint: row.remoteDraftFingerprint ?? undefined,
    accountId: row.accountId,
    contentStatus: row.contentStatus ?? 'complete',
    contentError: row.contentError ?? undefined,
    size: row.size ?? undefined,
    providerMessageId: row.providerMessageId,
    providerDraftId: row.providerDraftId ?? undefined,
    providerDraftMessageId: row.providerDraftMessageId ?? undefined,
    internetMessageId: row.internetMessageId ?? undefined,
    conversationId: row.providerConversationId ?? undefined,
    folderIds,
    labelIds,
    from: row.sender
      ? parseJson<NonNullable<MailMessage['from']>>(
          row.sender,
          'message sender',
        )
      : undefined,
    ...recipients,
    subject: row.subject,
    preview: row.preview ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
    sentAt: row.sentAt ?? undefined,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
    draft: Boolean(row.draft),
    hasAttachments: attachments.some(isVisibleMailAttachment),
    note: row.note ?? undefined,
    todo: Boolean(row.todo),
    draftConflict: row.draftConflict
      ? parseJson<MailDraftConflict>(row.draftConflict, 'draft conflict')
      : undefined,
    replyTo: parseJson<MailMessage['replyTo']>(row.replyTo, 'message reply-to'),
    inReplyTo: row.inReplyTo ?? undefined,
    references: parseJson<readonly string[]>(
      row.references,
      'message references',
    ),
    text: row.text ?? undefined,
    html: row.html ?? undefined,
    attachments,
  };
}

export function toSyncRunRow(run: MailSyncRun): SyncRunRow {
  return {
    ...run,
    activeKey:
      run.status === 'pending' || run.status === 'running'
        ? run.accountId
        : null,
    policy: JSON.stringify(run.policy),
    baselineCursor: jsonOrNull(run.baselineCursor),
    changeCursor: jsonOrNull(run.changeCursor),
    error: jsonOrNull(run.error),
  };
}

export function fromSyncRunRow(row: SyncRunRow): MailSyncRun {
  return {
    id: row.id,
    accountId: row.accountId,
    requestedBy: row.requestedBy,
    mode: row.mode,
    phase: row.phase,
    status: row.status,
    revision: Number(row.revision),
    policy: parseJson<MailSyncRun['policy']>(row.policy, 'sync policy'),
    historyStartedAt: row.historyStartedAt ?? undefined,
    historyComplete: Boolean(row.historyComplete),
    recovering: Boolean(row.recovering),
    pendingMessages: Number(row.pendingMessages ?? 0),
    retryAttempts: Number(row.retryAttempts ?? 0),
    processedMessages: Number(row.processedMessages),
    processedPages: Number(row.processedPages),
    historyCursor: row.historyCursor ?? undefined,
    folderCursor: row.folderCursor ?? undefined,
    baselineCursor: row.baselineCursor
      ? parseJson<MailSyncCursor>(row.baselineCursor, 'baseline cursor')
      : undefined,
    changeCursor: row.changeCursor
      ? parseJson<MailSyncCursor>(row.changeCursor, 'change cursor')
      : undefined,
    leaseToken: row.leaseToken ?? undefined,
    leaseExpiresAt: row.leaseExpiresAt ?? undefined,
    error: row.error
      ? parseJson<MailProviderError>(row.error, 'sync error')
      : undefined,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
    completedAt: row.completedAt ? toIsoString(row.completedAt) : undefined,
  };
}

export function fromSubmissionRow(row: SubmissionRow): MailStoredSubmission {
  const input = row.composeInput
    ? parseJson<import('../../shared/mail.js').MailComposeInput>(
        row.composeInput,
        'submission input',
      )
    : undefined;
  return {
    text: input?.text,
    html: input?.html,
    cc: input?.cc,
    bcc: input?.bcc,
    attachmentIds: input?.attachmentIds,
    attachmentContentIds: Object.fromEntries(
      (input?.deliverySnapshot?.attachments ?? []).flatMap((attachment) =>
        attachment.outboundAttachmentId && attachment.contentId
          ? [[attachment.outboundAttachmentId, attachment.contentId]]
          : [],
      ),
    ),
    recipients: input?.to,
    subject: input?.subject,
    bulk: row.idempotencyKey.startsWith('bulk:'),
    batchId: row.idempotencyKey.startsWith('bulk:')
      ? `${row.accountId}:${row.idempotencyKey.slice(0, row.idempotencyKey.lastIndexOf(':'))}`
      : undefined,
    hasComposeInput: Boolean(input),
    id: row.id,
    accountId: row.accountId,
    status: row.status,
    providerMessageId: row.providerMessageId ?? undefined,
    scheduledAt: row.scheduledAt ? toIsoString(row.scheduledAt) : undefined,
    error: row.error
      ? parseJson<MailProviderError>(row.error, 'submission error')
      : undefined,
    requestFingerprint: row.requestFingerprint,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function fromPushSubscriptionRow(
  row: PushSubscriptionRow,
): MailProviderPushSubscription {
  return {
    accountId: row.accountId,
    provider: { type: row.providerType, name: row.providerName },
    providerSubscriptionId: row.providerSubscriptionId!,
    configurationFingerprint: row.configurationFingerprint!,
    renewAfter: toIsoString(row.renewAfter!),
    expiresAt: toIsoString(row.expiresAt!),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function completePushSubscription(row: PushSubscriptionRow): boolean {
  return Boolean(
    row.providerSubscriptionId &&
    row.configurationFingerprint &&
    row.renewAfter &&
    row.expiresAt,
  );
}

export function fromOutboxRow(row: OutboxRow): MailOutboxRecord {
  const base = {
    id: row.id,
    aggregateId: row.aggregateId,
    deduplicationKey: row.deduplicationKey,
    status: row.status,
    attempts: Number(row.attempts),
    availableAt: toIsoString(row.availableAt),
    leaseToken: row.leaseToken ?? undefined,
    leaseExpiresAt: row.leaseExpiresAt
      ? toIsoString(row.leaseExpiresAt)
      : undefined,
    createdAt: toIsoString(row.createdAt),
    publishedAt: row.publishedAt ? toIsoString(row.publishedAt) : undefined,
  };
  if (row.type === 'requestMailboxSync') {
    return {
      ...base,
      type: 'requestMailboxSync',
      payload: parseJson<MailRequestSyncPayload>(
        row.payload as string | MailRequestSyncPayload,
        'sync request payload',
      ),
    };
  }
  return row.type === 'syncMailbox'
    ? {
        ...base,
        type: 'syncMailbox',
        payload: parseJson<MailSyncMailboxTaskPayload>(
          row.payload as string | MailSyncMailboxTaskPayload,
          'sync outbox payload',
        ),
      }
    : {
        ...base,
        type: 'sendScheduledMail',
        payload: parseJson<MailScheduledSendTaskPayload>(
          row.payload as string | MailScheduledSendTaskPayload,
          'scheduled send outbox payload',
        ),
      };
}

// RFC reply chains carry the root Message-ID as their first Reference. Hash it
// because Message-IDs can exceed the conversation column's length limit.
function fallbackConversationId(
  message: NormalizedMailMessage,
): string | undefined {
  const root =
    message.references.find((reference) => reference.trim())?.trim() ||
    message.inReplyTo?.trim() ||
    message.internetMessageId?.trim();
  return root
    ? `rfc:${createHash('sha256').update(root).digest('hex')}`
    : undefined;
}
