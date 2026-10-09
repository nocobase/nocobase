import { createHash } from 'node:crypto';
import {
  type MailDraftConflict,
  type MailDraftRemoteVersion,
  type MailMessage,
  MAIL_LOCAL_DRAFT_FOLDER_ID,
} from '../../shared/mail.js';
import { type NormalizedMailMessage } from '../contracts/provider.js';

export function isLocalDraftMessage(
  message: Pick<MailMessage, 'providerMessageId'>,
): boolean {
  return message.providerMessageId.startsWith('local-draft:');
}

/** Provider draft message IDs may change while the local editable record stays stable. */
export function remoteMessageId(
  message: Pick<MailMessage, 'providerMessageId' | 'providerDraftMessageId'>,
): string | undefined {
  return (
    message.providerDraftMessageId ??
    (isLocalDraftMessage(message) ? undefined : message.providerMessageId)
  );
}

export function sameDraftContent(
  local: MailMessage | undefined,
  remote: NormalizedMailMessage,
): boolean {
  if (!local) return true;
  return (
    (local.remoteDraftFingerprint ?? draftFingerprint(local)) ===
    draftFingerprint(remote)
  );
}

export function draftFingerprint(
  message: Pick<
    MailDraftRemoteVersion,
    'from' | 'to' | 'cc' | 'bcc' | 'subject' | 'text' | 'html'
  >,
): string {
  return createHash('sha256')
    .update(JSON.stringify(draftContent(message)))
    .digest('hex');
}

function draftContent(
  message: Pick<
    MailMessage,
    'from' | 'to' | 'cc' | 'bcc' | 'subject' | 'text' | 'html'
  >,
): unknown {
  return {
    from: message.from ? canonicalAddress(message.from) : null,
    to: message.to.map(canonicalAddress),
    cc: message.cc.map(canonicalAddress),
    bcc: message.bcc.map(canonicalAddress),
    subject: message.subject,
    text: message.text ?? '',
    html: message.html ?? '',
  };
}

function canonicalAddress(address: {
  readonly address: string;
  readonly name?: string;
}): { readonly address: string; readonly name: string | null } {
  return { address: address.address, name: address.name ?? null };
}

export function toDraftConflict(
  message: NormalizedMailMessage,
): MailDraftConflict {
  const remote: MailDraftRemoteVersion = {
    providerMessageId: message.providerMessageId,
    providerDraftId: message.providerDraftId,
    providerConversationId: message.providerConversationId,
    from: message.from,
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments,
  };
  return { detectedAt: new Date().toISOString(), remote };
}

export function normalizedDraftFromMessage(
  message: MailMessage,
): NormalizedMailMessage {
  return {
    draftSource: message.draftSource,
    remoteDraftFingerprint: message.remoteDraftFingerprint,
    providerMessageId: message.providerMessageId,
    providerDraftMessageId: message.providerDraftMessageId,
    providerDraftId: message.providerDraftId,
    providerConversationId: message.conversationId,
    providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
    from: message.from,
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    replyTo: message.replyTo,
    inReplyTo: message.inReplyTo,
    references: message.references,
    subject: message.subject,
    preview: (message.text ?? '').slice(0, 240),
    text: message.text,
    html: message.html,
    read: message.read,
    starred: message.starred,
    draft: true,
    attachments: message.attachments.map((attachment) => {
      const {
        id: _id,
        messageId: _messageId,
        fileReference: _fileReference,
        ...publicAttachment
      } = attachment;
      return publicAttachment;
    }),
  };
}
