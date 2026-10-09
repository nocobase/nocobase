import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../shared/mail.js';
import type { NormalizedMailMessage } from '../contracts/provider.js';
import { MailAttachmentsService } from '../services/attachments.js';
import { uploadedImageMetadata } from '../../shared/inline-images.js';
import { remoteMessageId } from '../services/draft-content.js';
import { mailLogError, writeMailLog, type MailLogger } from '../logging.js';
import { createHash, randomUUID } from 'node:crypto';

import type {
  MailComposeInput,
  MailAttachment,
  MailMessage,
  MailOperationContext,
  MailOutboundAttachmentStorage,
  MailSubmission,
  MailIdentity,
  NormalizedMailAttachment,
} from '../../shared/mail.js';
import type {
  MailProviderAdapterResolver,
  MailProviderMessageInput,
} from '../contracts/provider.js';
import type { MailService } from '../contracts/service.js';
import type { MailStore } from '../contracts/persistence.js';
import {
  notifyMailMessageChange,
  type MailMessageChangeNotifier,
} from '../realtime.js';
import {
  mailAccountInactive,
  mailAccountNotFound,
  mailAttachmentStorageUnavailable,
  mailInvalidArgument,
  mailNotFound,
} from '../services/errors.js';
import { mailFailedPrecondition } from '../services/errors.js';

export interface SendMailOperationDependencies {
  readonly logger?: MailLogger;
  readonly store: MailStore;
  readonly adapters: MailProviderAdapterResolver;
  readonly outbox?: { kick(): void };
  readonly outboundAttachments?: MailOutboundAttachmentStorage;
  readonly messageChangeNotifier?: MailMessageChangeNotifier;
}

export interface SendMailExecutionOptions {
  readonly scheduledDelivery?: boolean;
}

const MAX_OUTBOUND_ATTACHMENT_COUNT = 100;
const OUTBOUND_ATTACHMENT_METADATA_CONCURRENCY = 8;

export class SendMailOperation {
  public constructor(
    private readonly dependencies: SendMailOperationDependencies,
  ) {}

  public async execute(
    context: MailOperationContext,
    input: MailComposeInput,
    options: SendMailExecutionOptions = {},
  ): Promise<MailSubmission> {
    const startedAt = Date.now();
    const fields = {
      accountId: input.accountId,
      actorId: context.actorId,
      scheduled: options.scheduledDelivery === true,
    };
    try {
      const result = await this.executeSubmission(context, input, options);
      if (['accepted', 'failed', 'unknown'].includes(result.status)) {
        try {
          await this.dependencies.store.closeDraft(
            input.accountId,
            input.draftMessageId ?? input.sourceDraft?.messageId,
            input.draftKey,
          );
          const saved = await this.dependencies.store.getScheduledSubmission(
            result.id,
          );
          const original = saved?.input.deliverySnapshot;
          const remoteId = original ? remoteMessageId(original) : undefined;
          if (remoteId) {
            const account = await this.dependencies.store.getAccount(
              input.accountId,
            );
            if (account) {
              const adapter = await this.dependencies.adapters.resolve(
                account,
                context.signal,
              );
              try {
                const remote = await adapter.getMessage?.(
                  remoteId,
                  context.signal,
                );
                if (remote?.ok && remote.value.draft)
                  await adapter.deleteMessage?.(remoteId, true, context.signal);
              } finally {
                await adapter.close?.();
              }
            }
          }
          notifyMailMessageChange(
            this.dependencies.messageChangeNotifier,
            context.actorId,
            this.dependencies.logger,
          );
        } catch (error) {
          writeMailLog(
            this.dependencies.logger,
            'error',
            {
              event: 'mail.send.cleanup_failed',
              accountId: input.accountId,
              submissionId: result.id,
              err: mailLogError(error),
            },
            'Mail delivery was recorded but draft cleanup failed.',
          );
        }
      }
      if (options.scheduledDelivery)
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          context.actorId,
          this.dependencies.logger,
        );
      writeMailLog(
        this.dependencies.logger,
        result.status === 'failed' || result.status === 'unknown'
          ? 'error'
          : result.error
            ? 'warn'
            : 'info',
        {
          ...fields,
          event: 'mail.send.result',
          submissionId: result.id,
          status: result.status,
          durationMs: Date.now() - startedAt,
          ...(result.error
            ? {
                errorCode: result.error.code,
                category: result.error.category,
                retryable: result.error.retryable,
                err: mailLogError(result.error),
              }
            : {}),
        },
        'Mail submission result.',
      );
      return result;
    } catch (error) {
      writeMailLog(
        this.dependencies.logger,
        'error',
        {
          ...fields,
          event: 'mail.send.failed',
          durationMs: Date.now() - startedAt,
          err: mailLogError(error),
        },
        'Mail submission failed.',
      );
      throw error;
    }
  }

  private async executeSubmission(
    context: MailOperationContext,
    input: MailComposeInput,
    options: SendMailExecutionOptions,
  ): Promise<MailSubmission> {
    if (input.inReplyToMessageId && input.forwardOfMessageId) {
      throw mailInvalidArgument(
        'A message cannot be both a reply and a forward.',
      );
    }
    const now = Date.now();
    await this.dependencies.store.recoverExpiredSubmissions(
      new Date(now).toISOString(),
    );
    const account = await this.dependencies.store.getAccount(input.accountId);
    if (!account || account.userId !== context.actorId) {
      throw mailAccountNotFound();
    }
    if (account.status !== 'active') {
      throw mailAccountInactive();
    }
    const requestFingerprint = fingerprint(input);
    const existing =
      await this.dependencies.store.getSubmissionByIdempotencyKey(
        account.id,
        input.idempotencyKey,
      );
    if (existing) {
      if (!options.scheduledDelivery) {
        assertMatchingRequest(existing.requestFingerprint, requestFingerprint);
      }
      if (
        existing.status === 'pending' &&
        existing.scheduledAt &&
        !options.scheduledDelivery
      ) {
        return existing;
      }
      if (existing.status !== 'pending') return existing;
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

    const persistedPending =
      existing?.hasComposeInput && !options.scheduledDelivery
        ? await this.dependencies.store.getScheduledSubmission(existing.id)
        : undefined;
    if (persistedPending) input = persistedPending.input;
    else if (!options.scheduledDelivery)
      input = await this.snapshotDelivery(context, input);
    const providerMessage = await this.prepareProviderMessage(
      context,
      input,
      options.scheduledDelivery === true || Boolean(persistedPending),
    );
    const preparedInput: MailComposeInput = {
      ...input,
      signatureId: null,
      text: providerMessage.text,
      html: providerMessage.html,
      deliveryContext: {
        inReplyTo: providerMessage.inReplyTo,
        references: providerMessage.references,
        providerConversationId: providerMessage.providerConversationId,
      },
    };
    if (input.scheduledAt && !options.scheduledDelivery) {
      const scheduledAt = parseFutureDate(input.scheduledAt);
      const draft = input.draftMessageId
        ? await this.dependencies.store.getMessage(
            context.actorId,
            input.accountId,
            input.draftMessageId,
          )
        : undefined;
      const retainedLocalIds: string[] = [];
      for (const attachment of draft?.attachments ?? []) {
        if (
          input.retainedAttachmentIds !== undefined &&
          !input.retainedAttachmentIds.includes(attachment.id)
        )
          continue;
        const localId = await this.localAttachmentId(
          context,
          draft,
          attachment,
        );
        if (localId) retainedLocalIds.push(localId);
      }
      const attachmentIds = uniqueStrings([
        ...(input.attachmentIds ?? []),
        ...retainedLocalIds,
      ]);
      await this.dependencies.store.extendOutboundAttachments(
        context.actorId,
        attachmentIds,
        new Date(
          new Date(scheduledAt).getTime() + 24 * 60 * 60 * 1_000,
        ).toISOString(),
      );
      const scheduled = await this.dependencies.store.createScheduledSubmission(
        {
          id: randomUUID(),
          accountId: account.id,
          status: 'pending',
          scheduledAt,
        },
        input.idempotencyKey,
        requestFingerprint,
        context.actorId,
        {
          ...preparedInput,
          attachmentIds,
        },
        input.idempotencyKey.startsWith('bulk:')
          ? undefined
          : await this.createScheduledDraft(
              context,
              input,
              identity,
              providerMessage,
              draft,
            ),
      );
      assertMatchingRequest(scheduled.requestFingerprint, requestFingerprint);
      this.dependencies.outbox?.kick();
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        context.actorId,
        this.dependencies.logger,
      );
      return scheduled;
    }

    const submission =
      existing ??
      (await this.dependencies.store.createSubmission(
        {
          id: randomUUID(),
          accountId: account.id,
          status: 'pending',
        },
        input.idempotencyKey,
        requestFingerprint,
        context.actorId,
        preparedInput,
      ));
    if (!options.scheduledDelivery) {
      assertMatchingRequest(submission.requestFingerprint, requestFingerprint);
    }
    const leaseToken = randomUUID();
    const claimed = await this.dependencies.store.claimSubmission(
      submission.id,
      leaseToken,
      new Date(Date.now() + 120_000).toISOString(),
    );
    if (!claimed) {
      return (
        (await this.dependencies.store.getSubmissionByIdempotencyKey(
          account.id,
          input.idempotencyKey,
        )) ?? submission
      );
    }

    writeMailLog(
      this.dependencies.logger,
      'info',
      {
        event: 'mail.send.started',
        accountId: account.id,
        submissionId: submission.id,
        provider: account.provider.type,
      },
      'Mail submission started.',
    );
    if (options.scheduledDelivery)
      notifyMailMessageChange(
        this.dependencies.messageChangeNotifier,
        context.actorId,
        this.dependencies.logger,
      );
    let adapter;
    try {
      adapter = await this.dependencies.adapters.resolve(
        account,
        context.signal,
      );
    } catch (error) {
      writeMailLog(
        this.dependencies.logger,
        'error',
        {
          event: 'mail.send.exception',
          accountId: account.id,
          submissionId: submission.id,
          err: mailLogError(error),
        },
        'Mail Provider operation failed.',
      );
      return this.dependencies.store.finishSubmission(
        {
          ...submission,
          status: 'failed',
          error: {
            code: 'MAIL_PROVIDER_UNAVAILABLE',
            message:
              error instanceof Error
                ? error.message
                : 'The selected mail Provider is unavailable.',
            category: 'configuration',
            retryable: false,
          },
        },
        leaseToken,
      );
    }
    if (!adapter.capabilities.send || !adapter.sendMessage) {
      return this.dependencies.store.finishSubmission(
        {
          ...submission,
          status: 'failed',
          error: {
            code: 'MAIL_SEND_NOT_SUPPORTED',
            message: 'The selected mail Provider does not support sending.',
            category: 'configuration',
            retryable: false,
          },
        },
        leaseToken,
      );
    }

    try {
      const currentAccount = await this.dependencies.store.getAccount(
        account.id,
      );
      if (!currentAccount || currentAccount.status !== 'active')
        throw mailAccountInactive();
      const result = await adapter.sendMessage({
        trackingId: submission.id,
        identity,
        message: providerMessage,
        signal: context.signal,
      });
      if (result.status === 'accepted') {
        const accepted = await this.dependencies.store.finishSubmission(
          {
            ...submission,
            status: 'accepted',
            providerMessageId: result.providerMessageId,
            error: result.recipientError ?? result.sentCopyError,
          },
          leaseToken,
        );
        // Cleanup and refresh must never turn a confirmed delivery into a retry.
        try {
          if (result.providerMessageId && !result.sentCopyError) {
            await this.saveAcceptedMessage(
              context,
              input,
              identity,
              providerMessage,
              result.providerMessageId,
              result.internetMessageId,
            );
          }
        } catch (error) {
          writeMailLog(
            this.dependencies.logger,
            'error',
            {
              event: 'mail.send.sent_copy_failed',
              accountId: account.id,
              submissionId: submission.id,
              err: mailLogError(error),
            },
            'Mail was accepted but its local sent copy could not be saved.',
          );
        }
        try {
          this.dependencies.outbox?.kick();
        } catch (error) {
          writeMailLog(
            this.dependencies.logger,
            'error',
            {
              event: 'mail.send.sync_kick_failed',
              accountId: account.id,
              submissionId: submission.id,
              err: mailLogError(error),
            },
            'Mail delivery was recorded but synchronization could not start.',
          );
        }
        return accepted;
      }
      if (
        result.error.category === 'authentication' &&
        !result.error.retryable
      ) {
        await this.dependencies.store.markAccountReauthorizationRequired(
          account.id,
        );
      }
      return this.dependencies.store.finishSubmission(
        {
          ...submission,
          status: result.status === 'submission_unknown' ? 'unknown' : 'failed',
          error: result.error,
        },
        leaseToken,
      );
    } catch (error) {
      writeMailLog(
        this.dependencies.logger,
        'error',
        {
          event: 'mail.send.exception',
          accountId: account.id,
          submissionId: submission.id,
          err: mailLogError(error),
        },
        'Mail Provider operation failed.',
      );
      return this.dependencies.store.finishSubmission(
        {
          ...submission,
          status: 'unknown',
          error: {
            code: 'MAIL_SEND_RESULT_UNKNOWN',
            message:
              error instanceof Error
                ? error.message
                : 'The Provider submission result is unknown.',
            category: 'unknown',
            retryable: false,
          },
        },
        leaseToken,
      );
    } finally {
      await closeQuietly(adapter);
    }
  }

  private async snapshotDelivery(
    context: MailOperationContext,
    input: MailComposeInput,
  ): Promise<MailComposeInput> {
    const draft = input.draftMessageId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          input.accountId,
          input.draftMessageId,
        )
      : undefined;
    const attachmentIds = [...(input.attachmentIds ?? [])];
    const savedAttachments: MailAttachment[] = [];
    const attachmentsService = new MailAttachmentsService(this.dependencies);
    for (const attachment of draft?.attachments ?? []) {
      if (
        input.retainedAttachmentIds &&
        !input.retainedAttachmentIds.includes(attachment.id)
      )
        continue;
      let uploadId = await this.localAttachmentId(context, draft, attachment);
      if (!uploadId) {
        const storage = this.dependencies.outboundAttachments;
        if (!storage) throw mailAttachmentStorageUnavailable();
        const content = await attachmentsService.getAttachment(
          context,
          input.accountId,
          draft!.id,
          attachment.id,
        );
        const upload = await storage.create(context.actorId, {
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          size: attachment.size,
          stream: content.stream,
        });
        uploadId = upload.id;
      }
      attachmentIds.push(uploadId);
      savedAttachments.push({ ...attachment, outboundAttachmentId: uploadId });
    }
    await this.dependencies.store.extendOutboundAttachments(
      context.actorId,
      uniqueStrings(attachmentIds),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    );
    return {
      ...input,
      attachmentIds: uniqueStrings(attachmentIds),
      retainedAttachmentIds: [],
      deliverySnapshot: draft
        ? { ...draft, attachments: savedAttachments }
        : undefined,
    };
  }

  private async draftAttachments(
    context: MailOperationContext,
    input: MailComposeInput,
    draft?: MailMessage,
  ): Promise<NormalizedMailAttachment[]> {
    const attachments: NormalizedMailAttachment[] = (
      (draft ?? input.deliverySnapshot)?.attachments ?? []
    )
      .filter(
        (attachment) =>
          Boolean(input.deliverySnapshot) ||
          input.retainedAttachmentIds === undefined ||
          input.retainedAttachmentIds.includes(attachment.id),
      )
      .map(
        ({
          id: _id,
          messageId: _messageId,
          fileReference: _fileReference,
          ...attachment
        }) => attachment,
      );
    for (const id of input.attachmentIds ?? []) {
      if (
        attachments.some((attachment) => attachment.outboundAttachmentId === id)
      )
        continue;
      const metadata = await this.dependencies.store.getOutboundAttachment(
        context.actorId,
        id,
      );
      if (metadata)
        attachments.push({
          providerAttachmentId: id,
          outboundAttachmentId: id,
          fileName: metadata.fileName,
          contentType: metadata.contentType,
          size: metadata.size,
          ...uploadedImageMetadata(id, metadata.contentType, input.html),
        });
    }
    return attachments;
  }

  private async createScheduledDraft(
    context: MailOperationContext,
    input: MailComposeInput,
    identity: MailIdentity,
    message: MailProviderMessageInput,
    draft?: MailMessage,
  ): Promise<NormalizedMailMessage> {
    return {
      providerMessageId: draft?.providerMessageId.startsWith('local-draft:')
        ? draft.providerMessageId
        : `local-draft:${input.draftKey ?? draft?.id ?? randomUUID()}`,
      providerDraftMessageId: draft ? remoteMessageId(draft) : undefined,
      providerDraftId: draft?.providerDraftId,
      remoteDraftFingerprint: draft?.remoteDraftFingerprint,
      draftConflict: draft?.draftConflict,
      providerConversationId: message.providerConversationId,
      providerFolderIds: [MAIL_LOCAL_DRAFT_FOLDER_ID],
      from: { address: identity.address, name: identity.displayName },
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: [],
      inReplyTo: message.inReplyTo,
      references: message.references,
      subject: message.subject,
      text: message.text,
      html: message.html,
      preview: message.text.slice(0, 240),
      read: true,
      starred: draft?.starred ?? false,
      draft: true,
      attachments: await this.draftAttachments(context, input, draft),
    };
  }

  private async saveAcceptedMessage(
    context: MailOperationContext,
    input: MailComposeInput,
    identity: MailIdentity,
    message: MailProviderMessageInput,
    providerMessageId: string,
    internetMessageId?: string,
  ): Promise<void> {
    const folders = await this.dependencies.store.listFolders(input.accountId);
    const sentFolder = folders.find((folder) => folder.type === 'sent');
    if (!sentFolder) return;
    const draft = input.draftMessageId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          input.accountId,
          input.draftMessageId,
        )
      : undefined;
    const attachments = await this.draftAttachments(context, input, draft);
    await this.dependencies.store.saveMessage(input.accountId, {
      providerMessageId,
      providerFolderIds: [sentFolder.providerFolderId],
      internetMessageId: internetMessageId ?? message.internetMessageId,
      providerConversationId:
        message.providerConversationId ?? draft?.conversationId,
      from: { address: identity.address, name: identity.displayName },
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: [],
      inReplyTo: message.inReplyTo,
      references: message.references,
      subject: message.subject,
      text: message.text,
      html: message.html,
      preview: message.text.slice(0, 240),
      sentAt: new Date().toISOString(),
      read: true,
      starred: false,
      draft: false,
      attachments,
    });
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
  }

  private async localAttachmentId(
    context: MailOperationContext,
    draft: MailMessage | undefined,
    attachment: MailAttachment,
  ): Promise<string | undefined> {
    if (attachment.outboundAttachmentId) return attachment.outboundAttachmentId;
    if (
      draft?.providerMessageId.startsWith('local-draft:') &&
      (await this.dependencies.store.getOutboundAttachment(
        context.actorId,
        attachment.providerAttachmentId,
      ))
    )
      return attachment.providerAttachmentId;
    return undefined;
  }

  public async prepareProviderMessage(
    context: MailOperationContext,
    input: MailComposeInput,
    contentAlreadyPrepared = false,
  ): Promise<MailProviderMessageInput> {
    const identity = await this.dependencies.store.getIdentity(
      input.identityId,
    );
    if (!identity || identity.accountId !== input.accountId) {
      throw mailNotFound(
        'MAIL_IDENTITY_NOT_FOUND',
        'Mail sending identity is not available.',
        'identityId',
      );
    }
    const configuredSignatures = await this.dependencies.store.listSignatures(
      input.accountId,
    );
    const signature =
      input.signatureId === null
        ? undefined
        : input.signatureId
          ? await this.dependencies.store.getSignature(input.signatureId)
          : configuredSignatures.find((item) => item.isDefault);
    if (
      input.signatureId &&
      (!signature || signature.accountId !== input.accountId)
    ) {
      throw mailNotFound(
        'MAIL_SIGNATURE_NOT_FOUND',
        'Mail signature was not found.',
        'signatureId',
      );
    }
    const signatureText =
      input.signatureId === null ? undefined : signature?.text;
    const signatureHtml =
      input.signatureId === null
        ? undefined
        : signature
          ? (signature.html ?? escapeHtml(signature.text))
          : undefined;
    const knownSignatureTexts = configuredSignatures
      .map((item) => item.text)
      .filter((value): value is string => Boolean(value.trim()));
    const knownSignatureHtml = configuredSignatures
      .map((item) => item.html ?? escapeHtml(item.text))
      .filter((value): value is string => Boolean(value?.trim()));
    const storedDraft =
      input.deliverySnapshot ??
      (input.draftMessageId
        ? await this.dependencies.store.getMessage(
            context.actorId,
            input.accountId,
            input.draftMessageId,
          )
        : undefined);
    const preparedContext = contentAlreadyPrepared
      ? input.deliveryContext
      : undefined;
    const replyId = preparedContext
      ? undefined
      : (input.inReplyToMessageId ??
        storedDraft?.draftSource?.replyToMessageId);
    const forwardId = preparedContext
      ? undefined
      : (input.forwardOfMessageId ??
        storedDraft?.draftSource?.forwardOfMessageId);
    const relatedMessageId = replyId ?? forwardId;
    const related = relatedMessageId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          input.accountId,
          relatedMessageId,
        )
      : undefined;
    if (relatedMessageId && !related) {
      throw mailNotFound(
        'MAIL_RELATED_MESSAGE_NOT_FOUND',
        'The related mail message was not found.',
        input.inReplyToMessageId ? 'inReplyToMessageId' : 'forwardOfMessageId',
      );
    }
    const parentInternetMessageId = related?.internetMessageId;
    const draft = storedDraft;
    if (draft?.scheduledSend && !contentAlreadyPrepared)
      throw mailFailedPrecondition(
        'MAIL_DRAFT_SCHEDULED',
        'Cancel the scheduled delivery before sending this draft again.',
      );
    if (input.draftMessageId && (!draft || !draft.draft)) {
      throw mailNotFound(
        'MAIL_DRAFT_NOT_FOUND',
        'Mail draft was not found.',
        'draftMessageId',
      );
    }
    const retainedDraftAttachments = draft
      ? input.retainedAttachmentIds === undefined
        ? draft.attachments
        : input.retainedAttachmentIds.map((attachmentId) => {
            const attachment = draft.attachments.find(
              (item) => item.id === attachmentId,
            );
            if (!attachment) {
              throw mailInvalidArgument(
                'A retained attachment does not belong to the selected draft.',
              );
            }
            return attachment;
          })
      : [];
    const localRetainedIds: string[] = [];
    const remoteRetainedIds: string[] = [];
    for (const attachment of retainedDraftAttachments) {
      const localId = await this.localAttachmentId(context, draft, attachment);
      if (localId) localRetainedIds.push(localId);
      else remoteRetainedIds.push(attachment.providerAttachmentId);
    }
    const attachmentIds = uniqueStrings([
      ...(input.attachmentIds ?? []),
      ...localRetainedIds,
    ]);
    if (attachmentIds.length > MAX_OUTBOUND_ATTACHMENT_COUNT) {
      throw mailInvalidArgument(
        `Mail messages must contain at most ${MAX_OUTBOUND_ATTACHMENT_COUNT} attachments.`,
      );
    }
    const attachments = await mapConcurrent(
      attachmentIds,
      OUTBOUND_ATTACHMENT_METADATA_CONCURRENCY,
      async (attachmentId) => {
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
        const storage = this.dependencies.outboundAttachments;
        if (!storage) throw mailAttachmentStorageUnavailable();
        return {
          fileName: metadata.fileName,
          contentType: metadata.contentType,
          size: metadata.size,
          ...uploadedImageMetadata(
            attachmentId,
            metadata.contentType,
            input.html,
          ),
          ...(() => {
            const original = input.deliverySnapshot?.attachments.find(
              (item) => item.outboundAttachmentId === attachmentId,
            );
            return original
              ? { contentId: original.contentId, inline: original.inline }
              : {};
          })(),
          open: async () =>
            (await storage.open(context.actorId, attachmentId)).stream,
        };
      },
    );
    const attachmentSize = attachments.reduce(
      (total, attachment) => total + attachment.size,
      0,
    );
    if (attachmentSize > 25 * 1024 * 1024) {
      throw mailInvalidArgument(
        'Mail attachments must not exceed 25 MB in total.',
        'attachmentIds',
      );
    }
    return {
      to: input.to,
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
      subject: input.subject,
      text:
        contentAlreadyPrepared || input.signatureId === null
          ? input.text
          : appendTextSignature(
              stripKnownTextSignature(input.text, knownSignatureTexts),
              signatureText,
            ),
      html:
        contentAlreadyPrepared || input.signatureId === null
          ? input.html
          : appendHtmlSignature(
              stripKnownHtmlSignature(input.html, knownSignatureHtml),
              signatureHtml,
            ),
      attachments,
      retainedProviderAttachmentIds: remoteRetainedIds,
      inReplyTo: replyId ? parentInternetMessageId : draft?.inReplyTo,
      references:
        replyId && related
          ? uniqueStrings([
              ...related.references,
              ...(parentInternetMessageId ? [parentInternetMessageId] : []),
            ])
          : (draft?.references ?? []),
      providerConversationId: replyId
        ? related?.conversationId
        : draft?.conversationId,
      draftProviderMessageId: input.deliverySnapshot
        ? undefined
        : draft
          ? remoteMessageId(draft)
          : undefined,
      draftProviderDraftId: input.deliverySnapshot
        ? undefined
        : draft?.providerDraftId,
      replyToProviderMessageId: replyId
        ? related?.providerMessageId
        : undefined,
      forwardOfProviderMessageId: forwardId
        ? related?.providerMessageId
        : undefined,
      ...(preparedContext ?? {}),
      forwardBodyIncluded:
        input.forwardBodyIncluded ??
        Boolean(storedDraft?.draftSource?.forwardOfMessageId),
      replyBodyIncluded: input.replyBodyIncluded,
    };
  }
}

function appendTextSignature(text: string, signature?: string): string {
  return signature?.trim() ? `${text}\n\n-- \n${signature}` : text;
}

function stripKnownTextSignature(
  text: string,
  signatures: readonly string[],
): string {
  return stripKnownSuffix(
    text,
    signatures.map((signature) => `\n\n-- \n${signature}`),
  );
}

function appendHtmlSignature(
  html?: string,
  signature?: string,
): string | undefined {
  if (!html || !signature?.trim()) return html;
  return `${html}<br><br><div class="nocobase-mail-signature">${signature}</div>`;
}

function stripKnownHtmlSignature(
  html: string | undefined,
  signatures: readonly string[],
): string | undefined {
  if (!html) return html;
  return stripKnownSuffix(
    html,
    signatures.map(
      (signature) =>
        `<br><br><div class="nocobase-mail-signature">${signature}</div>`,
    ),
  );
}

function stripKnownSuffix(value: string, suffixes: readonly string[]): string {
  const suffix = suffixes.find((candidate) => value.endsWith(candidate));
  return suffix ? value.slice(0, -suffix.length) : value;
}

function escapeHtml(value?: string): string | undefined {
  return value
    ?.replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
    .replace(/\n/gu, '<br>');
}

export class MailIdempotencyConflictError extends Error {
  public constructor() {
    super('The idempotency key is already associated with another request.');
  }
}

function assertMatchingRequest(actual: string, expected: string): void {
  if (actual !== expected) throw new MailIdempotencyConflictError();
}

function fingerprint(input: MailComposeInput): string {
  const canonical = {
    accountId: input.accountId,
    identityId: input.identityId,
    signatureId: input.signatureId,
    to: input.to.map(canonicalAddress),
    cc: (input.cc ?? []).map(canonicalAddress),
    bcc: (input.bcc ?? []).map(canonicalAddress),
    subject: input.subject,
    text: input.text,
    html: input.html ?? null,
    attachmentIds: input.attachmentIds ?? [],
    retainedAttachmentIds: input.retainedAttachmentIds ?? null,
    inReplyToMessageId: input.inReplyToMessageId ?? null,
    forwardOfMessageId: input.forwardOfMessageId ?? null,
    ...(input.forwardBodyIncluded ? { forwardBodyIncluded: true } : {}),
    ...(input.replyBodyIncluded ? { replyBodyIncluded: true } : {}),
    scheduledAt: input.scheduledAt ?? null,
    draftMessageId: input.draftMessageId ?? null,
    ...(input.draftKey ? { draftKey: input.draftKey } : {}),
    ...(input.sourceDraft ? { sourceDraft: input.sourceDraft } : {}),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function canonicalAddress(address: {
  readonly address: string;
  readonly name?: string;
}): { readonly address: string; readonly name: string | null } {
  return { address: address.address, name: address.name ?? null };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function parseFutureDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    throw mailInvalidArgument(
      'Scheduled sending time must be a valid future date.',
      'scheduledAt',
    );
  }
  return new Date(timestamp).toISOString();
}

export type SendMessageMethod = MailService['sendMessage'];

async function closeQuietly(adapter: {
  close?(): Promise<void>;
}): Promise<void> {
  try {
    await adapter.close?.();
  } catch {
    // Closing a Provider client must not change a persisted submission result.
  }
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (values.length === 0) return [];
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), values.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= values.length) return;
        results[index] = await mapper(values[index], index);
      }
    }),
  );
  return results;
}
