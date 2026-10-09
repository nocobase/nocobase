import { notifyMailMessageChange } from '../realtime.js';
import { createHash } from 'node:crypto';
import { SendMailOperation } from '../operations/send-mail.js';
import {
  type MailOperationContext,
  type MailOffsetPage,
  type MailSubmissionLogView,
  type MailSubmissionView,
} from '../../shared/mail.js';
import { toSubmissionLogView, toSubmissionView } from '../views.js';
import { type MailServiceDependencies } from './dependencies.js';
import { mailInvalidArgument, mailNotFound } from './errors.js';

export class MailSubmissionsService {
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'countSubmissions'
      | 'getAccount'
      | 'getMessage'
      | 'closeDraft'
      | 'getScheduledSubmission'
      | 'getSubmissionByIdempotencyKey'
      | 'listSubmissions'
      | 'transitionSubmission',
      'outbox' | 'messageChangeNotifier' | 'logger'
    >,
    private readonly sendMail: SendMailOperation,
  ) {}

  public async listSubmissionsPage(
    context: MailOperationContext,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit = 20,
  ): Promise<MailOffsetPage<MailSubmissionLogView>> {
    const [items, total] = await Promise.all([
      this.listSubmissions(context, bulkOnly, offset, groupByBatch, limit),
      this.dependencies.store.countSubmissions(
        context.actorId,
        bulkOnly,
        groupByBatch,
      ),
    ]);
    return { items, total };
  }

  public async listSubmissions(
    context: MailOperationContext,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit: number = groupByBatch ? 20 : 100,
  ): Promise<readonly MailSubmissionLogView[]> {
    return (
      await this.dependencies.store.listSubmissions(
        context.actorId,
        bulkOnly,
        offset,
        groupByBatch,
        limit,
      )
    ).map(toSubmissionLogView);
  }

  public async transitionSubmission(
    context: MailOperationContext,
    submissionId: string,
    action: 'retry' | 'cancel',
  ): Promise<MailSubmissionLogView> {
    const scheduled =
      await this.dependencies.store.getScheduledSubmission(submissionId);
    const account = scheduled
      ? await this.dependencies.store.getAccount(scheduled.submission.accountId)
      : undefined;
    if (
      !scheduled ||
      !account ||
      account.userId !== context.actorId ||
      scheduled.actorId !== context.actorId
    ) {
      throw mailNotFound(
        'MAIL_SUBMISSION_NOT_FOUND',
        'Mail submission was not found.',
        'submissionId',
      );
    }
    const submission = await this.dependencies.store.transitionSubmission(
      submissionId,
      action,
    );
    if (action === 'retry') this.dependencies.outbox?.kick();
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return toSubmissionLogView(submission);
  }

  public async sendMessage(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailComposeInput,
  ): Promise<MailSubmissionView> {
    return toSubmissionView(await this.sendMail.execute(context, input));
  }

  public async sendBulk(
    context: MailOperationContext,
    input: import('../../shared/mail.js').MailBulkComposeInput,
  ): Promise<readonly MailSubmissionView[]> {
    if (input.recipients.length === 0 || input.recipients.length > 100) {
      throw mailInvalidArgument(
        'Bulk mail requires between 1 and 100 recipients.',
        'recipients',
      );
    }
    const submissions: MailSubmissionView[] = [];
    const bulkKeyPrefix = `bulk:${createHash('sha256').update(input.idempotencyKey).digest('hex')}`;
    const anchor = await this.dependencies.store.getSubmissionByIdempotencyKey(
      input.accountId,
      `${bulkKeyPrefix}:0`,
    );
    const persisted = anchor
      ? await this.dependencies.store.getScheduledSubmission(anchor.id)
      : undefined;
    if (
      anchor &&
      (persisted?.input.sourceDraft?.messageId !== input.sourceDraftMessageId ||
        (persisted?.input.sourceDraft &&
          persisted.input.sourceDraft.submissionKeys.length !==
            input.recipients.length))
    ) {
      throw mailInvalidArgument(
        'The batch idempotency key belongs to a different draft or recipient count.',
      );
    }
    const source = input.sourceDraftMessageId
      ? await this.dependencies.store.getMessage(
          context.actorId,
          input.accountId,
          input.sourceDraftMessageId,
        )
      : undefined;
    if (input.sourceDraftMessageId && !anchor && !source?.draft)
      throw mailNotFound(
        'MAIL_DRAFT_NOT_FOUND',
        'Mail draft was not found.',
        'sourceDraftMessageId',
      );
    const sourceDraft =
      persisted?.input.sourceDraft ??
      (source?.updatedAt
        ? {
            messageId: source.id,
            updatedAt: source.updatedAt,
            submissionKeys: input.recipients.map(
              (_, index) => `${bulkKeyPrefix}:${index}`,
            ),
          }
        : undefined);
    for (const [index, recipient] of input.recipients.entries()) {
      const idempotencyKey = `${bulkKeyPrefix}:${index}`;
      const existing =
        await this.dependencies.store.getSubmissionByIdempotencyKey(
          input.accountId,
          idempotencyKey,
        );
      submissions.push(
        toSubmissionView(
          await this.sendMail.execute(context, {
            ...input,
            draftMessageId: undefined,
            sourceDraft,
            to: [recipient],
            cc: [],
            bcc: [],
            scheduledAt:
              input.scheduledAt ??
              existing?.scheduledAt ??
              new Date(Date.now() + 1_000).toISOString(),
            idempotencyKey,
          }),
        ),
      );
    }
    await this.dependencies.store.closeDraft(
      input.accountId,
      input.sourceDraftMessageId,
      input.draftKey,
    );
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      context.actorId,
      this.dependencies.logger,
    );
    return submissions;
  }
}
