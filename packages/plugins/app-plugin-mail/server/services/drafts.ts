import { uploadedImageMetadata } from '../../shared/inline-images.js';
import { SendMailOperation } from '../operations/send-mail.js';
import { notifyMailMessageChange } from '../realtime.js';
import {
  MAIL_LOCAL_DRAFT_FOLDER_ID,
  type MailIdentity,
  type MailMessage,
  type MailOperationContext,
  type MailResolveDraftConflictInput,
  type NormalizedMailAttachment,
} from '../../shared/mail.js';
import { type NormalizedMailMessage } from '../contracts/provider.js';
import { requireOwnedMessage } from './access.js';
import { type MailServiceDependencies } from './dependencies.js';
import {
  draftFingerprint,
  isLocalDraftMessage,
  normalizedDraftFromMessage,
} from './draft-content.js';
import {
  mailAccountInactive,
  mailAccountNotFound,
  mailFailedPrecondition,
  mailInvalidArgument,
  mailNotFound,
} from './errors.js';

export class MailDraftsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'getAccount'
      | 'getIdentity'
      | 'getMessage'
      | 'getOutboundAttachment'
      | 'saveMessage'
      | 'localizeDraft',
      'adapters' | 'messageChangeNotifier' | 'logger'
    >,
    _sendMail: SendMailOperation,
  ) {}

  public async saveDraft(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailComposeInput,
  ): Promise<MailMessage> {
    if (input.scheduledAt) {
      throw mailInvalidArgument(
        'A draft cannot also be scheduled for delivery.',
        'scheduledAt',
      );
    }
    const account = await this.dependencies.store.getAccount(input.accountId);
    if (!account || account.userId !== context.actorId) {
      throw mailAccountNotFound();
    }
    if (account.status !== 'active') {
      throw mailAccountInactive();
    }
    const identity = await this.dependencies.store.getIdentity(
      input.identityId,
    );
    if (!identity || identity.accountId !== account.id || !identity.canSend) {
      throw mailNotFound(
        'MAIL_IDENTITY_NOT_FOUND',
        'Mail sending identity is not available.',
        'identityId',
      );
    }
    let existingDraft = input.draftMessageId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          account.id,
          input.draftMessageId,
        )
      : undefined;
    if (input.draftMessageId && (!existingDraft || !existingDraft.draft)) {
      throw mailNotFound(
        'MAIL_DRAFT_NOT_FOUND',
        'Mail draft was not found.',
        'draftMessageId',
      );
    }
    if (existingDraft?.scheduledSend)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_SCHEDULED',
        'Cancel the scheduled delivery before editing this draft.',
      );
    if (existingDraft && !isLocalDraftMessage(existingDraft)) {
      existingDraft = await this.dependencies.store.localizeDraft(
        account.id,
        existingDraft.id,
      );
    }
    const localDraft = await this.dependencies.store.saveMessage(
      account.id,
      await this.createLocalDraftMessage(
        context,
        identity,
        input,
        existingDraft,
      ),
    );
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return localDraft;
  }

  public async resolveDraftConflict(
    context: MailOperationContext,
    input: MailResolveDraftConflictInput,
  ): Promise<MailMessage> {
    const { account, message } = await requireOwnedMessage(
      this.dependencies.store,
      context,
      input.accountId,
      input.messageId,
    );
    if (message.scheduledSend)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_SCHEDULED',
        'Cancel the scheduled delivery before editing this draft.',
      );
    if (!message.draft || !message.draftConflict) {
      throw mailFailedPrecondition(
        'MAIL_DRAFT_CONFLICT_NOT_FOUND',
        'Mail draft conflict was not found.',
      );
    }
    const remote = message.draftConflict.remote;
    const normalized: NormalizedMailMessage =
      input.action === 'useRemote'
        ? {
            draftSource: message.draftSource,
            providerMessageId: message.providerMessageId,
            providerDraftMessageId: message.providerDraftMessageId,
            providerDraftId: message.providerDraftId,
            providerConversationId:
              remote.providerConversationId ?? message.conversationId,
            providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
            from: remote.from,
            to: remote.to,
            cc: remote.cc,
            bcc: remote.bcc,
            replyTo: message.replyTo,
            inReplyTo: message.inReplyTo,
            references: message.references,
            subject: remote.subject,
            preview: (remote.text ?? '').slice(0, 240),
            text: remote.text,
            html: remote.html,
            read: true,
            starred: message.starred,
            draft: true,
            attachments: remote.attachments,
          }
        : normalizedDraftFromMessage(message);
    const resolved = await this.dependencies.store.saveMessage(account.id, {
      ...normalized,
      remoteDraftFingerprint: draftFingerprint(remote),
    });
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return resolved;
  }

  private async createLocalDraftMessage(
    context: MailOperationContext,
    identity: MailIdentity,
    input: import('../../shared/mail.js').MailComposeInput,
    existingDraft?: MailMessage,
  ): Promise<NormalizedMailMessage> {
    const attachments = await this.loadLocalDraftAttachments(
      context,
      input,
      existingDraft,
    );
    const source =
      input.inReplyToMessageId || input.forwardOfMessageId
        ? {
            replyToMessageId: input.inReplyToMessageId,
            forwardOfMessageId: input.forwardOfMessageId,
          }
        : existingDraft?.draftSource;
    if (source?.replyToMessageId && source.forwardOfMessageId)
      throw mailInvalidArgument(
        'A message cannot be both a reply and a forward.',
      );
    const relatedId = source?.replyToMessageId ?? source?.forwardOfMessageId;
    const related = relatedId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          input.accountId,
          relatedId,
        )
      : undefined;
    if (relatedId && !related)
      throw mailNotFound(
        'MAIL_RELATED_MESSAGE_NOT_FOUND',
        'The related mail message was not found.',
        input.inReplyToMessageId ? 'inReplyToMessageId' : 'forwardOfMessageId',
      );
    return {
      draftSource: source,
      draftRevision: input.draftRevision,
      providerMessageId:
        existingDraft?.providerMessageId ??
        `local-draft:${input.draftKey ?? input.idempotencyKey}`,
      remoteDraftFingerprint: existingDraft?.remoteDraftFingerprint,
      providerDraftMessageId: existingDraft?.providerDraftMessageId,
      providerDraftId: existingDraft?.providerDraftId,
      providerConversationId: source?.replyToMessageId
        ? related?.conversationId
        : existingDraft?.conversationId,
      providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
      from: {
        address: identity.address,
        ...(identity.displayName ? { name: identity.displayName } : {}),
      },
      to: input.to,
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
      replyTo: [],
      references:
        source?.replyToMessageId && related
          ? [
              ...new Set([
                ...related.references,
                ...(related.internetMessageId
                  ? [related.internetMessageId]
                  : []),
              ]),
            ]
          : (existingDraft?.references ?? []),
      inReplyTo: source?.replyToMessageId
        ? related?.internetMessageId
        : existingDraft?.inReplyTo,
      subject: input.subject,
      preview: input.text.slice(0, 240),
      text: input.text,
      html: input.html,
      read: true,
      starred: existingDraft?.starred ?? false,
      draft: true,
      attachments,
      draftConflict: undefined,
    };
  }

  private async loadLocalDraftAttachments(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailComposeInput,
    existingDraft?: MailMessage,
  ): Promise<readonly NormalizedMailAttachment[]> {
    const retained =
      input.retainedAttachmentIds === undefined
        ? (existingDraft?.attachments ?? [])
        : (existingDraft?.attachments ?? []).filter((attachment) =>
            input.retainedAttachmentIds?.includes(attachment.id),
          );
    const attachments: NormalizedMailAttachment[] = retained.map(
      (attachment) => ({
        providerAttachmentId: attachment.providerAttachmentId,
        outboundAttachmentId: attachment.outboundAttachmentId,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        size: attachment.size,
        contentId: attachment.contentId,
        inline: attachment.inline,
      }),
    );
    for (const attachmentId of input.attachmentIds ?? []) {
      const metadata = await this.dependencies.store.getOutboundAttachment(
        context.actorId,
        attachmentId,
      );
      if (!metadata)
        throw mailNotFound(
          'MAIL_ATTACHMENT_NOT_FOUND',
          'Mail outbound attachment was not found.',
          'attachmentIds',
        );
      if (
        attachments.some(
          (attachment) => attachment.providerAttachmentId === attachmentId,
        )
      )
        continue;
      attachments.push({
        providerAttachmentId: attachmentId,
        outboundAttachmentId: attachmentId,
        fileName: metadata.fileName,
        contentType: metadata.contentType,
        size: metadata.size,
        ...uploadedImageMetadata(
          attachmentId,
          metadata.contentType,
          input.html,
        ),
      });
    }
    return attachments;
  }
}
