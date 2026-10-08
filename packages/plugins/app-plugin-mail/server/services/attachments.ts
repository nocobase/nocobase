import {
  type MailAccount,
  type MailMessage,
  type MailAttachmentContent,
  type MailOperationContext,
  type MailOutboundAttachmentView,
  type MailUploadAttachmentInput,
} from '../../shared/mail.js';
import { type MailServiceDependencies } from './dependencies.js';
import { isLocalDraftMessage, remoteMessageId } from './draft-content.js';
import { assertProviderResult } from './errors.js';
import { closeAdapter, finalizeStream } from './provider-lifecycle.js';
import {
  mailAccountNotFound,
  mailAttachmentStorageUnavailable,
  mailFailedPrecondition,
  mailMessageNotFound,
  mailNotFound,
} from './errors.js';

export class MailAttachmentsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'getAccount'
      | 'getMessage'
      | 'getMessageForAccount'
      | 'getOutboundAttachment',
      'outboundAttachments' | 'adapters'
    >,
  ) {}

  public async getUploadedAttachment(
    context: MailOperationContext,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    const storage = this.dependencies.outboundAttachments;
    if (!storage) throw mailAttachmentStorageUnavailable();
    const { attachment, stream } = await storage.open(
      context.actorId,
      attachmentId,
    );
    return {
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      stream,
    };
  }

  public async uploadAttachment(
    context: MailOperationContext,
    input: MailUploadAttachmentInput,
  ): Promise<MailOutboundAttachmentView> {
    const storage = this.dependencies.outboundAttachments;
    if (!storage) throw mailAttachmentStorageUnavailable();
    return storage.create(context.actorId, input);
  }

  public async getAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    const account = await this.dependencies.store.getAccount(accountId);
    if (!account || account.userId !== context.actorId) {
      throw mailAccountNotFound();
    }
    const message = await this.dependencies.store.getMessage(
      context.actorId,
      accountId,
      messageId,
    );
    if (!message) throw mailMessageNotFound();
    return this.openAttachment(account, message, attachmentId, context.signal);
  }

  public async getManagedAttachment(
    context: MailOperationContext,
    accountId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachmentContent> {
    const account = await this.dependencies.store.getAccount(accountId);
    if (!account) throw mailAccountNotFound();
    const message = await this.dependencies.store.getMessageForAccount(
      accountId,
      messageId,
    );
    if (!message) throw mailMessageNotFound();
    return this.openAttachment(account, message, attachmentId, context.signal);
  }

  private async openAttachment(
    account: MailAccount,
    message: MailMessage,
    attachmentId: string,
    signal?: AbortSignal,
  ): Promise<MailAttachmentContent> {
    const attachment = message.attachments.find(
      (item) =>
        item.id === attachmentId || item.providerAttachmentId === attachmentId,
    );
    if (!attachment)
      throw mailNotFound(
        'MAIL_ATTACHMENT_NOT_FOUND',
        'Mail attachment was not found.',
        'attachmentId',
      );
    const localId =
      attachment.outboundAttachmentId ??
      (isLocalDraftMessage(message) &&
      (await this.dependencies.store.getOutboundAttachment(
        account.userId,
        attachment.providerAttachmentId,
      ))
        ? attachment.providerAttachmentId
        : undefined);
    if (localId) {
      if (!this.dependencies.outboundAttachments)
        throw mailAttachmentStorageUnavailable();
      const content = await this.dependencies.outboundAttachments.open(
        account.userId,
        localId,
      );
      return {
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        size: attachment.size,
        stream: content.stream,
      };
    }
    const providerMessageId = remoteMessageId(message);
    if (!providerMessageId)
      throw mailFailedPrecondition(
        'MAIL_ATTACHMENT_UNAVAILABLE',
        'Mail attachment was not mirrored to the provider.',
      );
    const adapter = await this.dependencies.adapters.resolve(account, signal);
    try {
      if (!adapter.getAttachment) {
        throw mailFailedPrecondition(
          'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
          'The selected Mail Provider cannot download attachments.',
        );
      }
      const content = assertProviderResult(
        await adapter.getAttachment(
          providerMessageId,
          attachment.providerAttachmentId,
          signal,
        ),
      );
      return {
        ...content,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        // Provider metadata can contain an encoded size; only the stream provider
        // knows whether an exact decoded Content-Length is available.
        size: content.size,
        stream: finalizeStream(content.stream, () => closeAdapter(adapter)),
      };
    } catch (error) {
      await closeAdapter(adapter);
      throw error;
    }
  }
}
