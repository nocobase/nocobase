import { closeDrafts } from './draft-states.js';
import { upsertMessages } from './message-writes.js';
import { assertDraftEditable } from './scheduled-drafts.js';
import type { NormalizedMailMessage } from '../contracts/provider.js';
import type { MessageRow } from './rows.js';
import { lockWritableAccount } from './account-guard.js';
import { validateLogPagination } from '../log-pagination.js';
import { type DatabaseManager } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import {
  type MailComposeInput,
  type MailOffsetPage,
  type MailProviderError,
  type MailSubmission,
} from '../../shared/mail.js';
import {
  type MailScheduledSubmission,
  type MailStore,
  type MailStoredSubmission,
} from '../contracts/persistence.js';
import { toMailMessage, fromSubmissionRow } from './mappers.js';
import { type OutboxRow, type SubmissionRow } from './rows.js';
import { jsonOrNull, parseJson } from './serialization.js';
import { mailFailedPrecondition, mailNotFound } from '../services/errors.js';

export class MailSubmissionsStore {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly accounts: Pick<MailStore, 'listAccounts' | 'getAccount'>,
  ) {}

  public async getSubmissionByIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
  ): Promise<MailStoredSubmission | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('idempotencyKey', '=', idempotencyKey)
      .executeTakeFirst<SubmissionRow>();
    return row ? fromSubmissionRow(row) : undefined;
  }

  public async countSubmissions(
    userId: string,
    bulkOnly = false,
    groupByBatch = false,
  ): Promise<number> {
    const accounts = await this.accounts.listAccounts(userId);
    if (accounts.length === 0) return 0;
    let query = this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .select(({ fn }) => [fn.countAll().as('count')])
      .where(
        'accountId',
        'in',
        accounts.map((account) => account.id),
      );
    if (groupByBatch) query = query.where('idempotencyKey', 'like', 'bulk:%:0');
    else if (bulkOnly) query = query.where('idempotencyKey', 'like', 'bulk:%');
    const row = await query.executeTakeFirst<{
      readonly count: number | string;
    }>();
    return Number(row?.count ?? 0);
  }

  public async listSubmissions(
    userId: string,
    bulkOnly = false,
    offset = 0,
    groupByBatch = false,
    limit: number = groupByBatch ? 20 : 100,
  ): Promise<readonly MailStoredSubmission[]> {
    validateLogPagination(offset, limit);
    const accounts = await this.accounts.listAccounts(userId);
    if (accounts.length === 0) return [];
    let query = this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where(
        'accountId',
        'in',
        accounts.map((account) => account.id),
      );
    if (groupByBatch) {
      // sendBulk persists recipient zero first, making it the stable batch anchor.
      const anchors = await query
        .where('idempotencyKey', 'like', 'bulk:%:0')
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .offset(offset)
        .limit(limit)
        .execute<SubmissionRow>();
      if (anchors.length === 0) return [];
      const rows = await query
        .where((builder) =>
          builder.or(
            anchors.map((anchor) => {
              const prefix = anchor.idempotencyKey.slice(0, -1);
              return builder.and([
                builder('accountId', '=', anchor.accountId),
                builder(
                  'idempotencyKey',
                  'in',
                  Array.from(
                    { length: 100 },
                    (_, index) => `${prefix}${index}`,
                  ),
                ),
              ]);
            }),
          ),
        )
        .orderBy('createdAt', 'asc')
        .orderBy('id', 'asc')
        .execute<SubmissionRow>();
      return anchors.flatMap((anchor) => {
        const prefix = anchor.idempotencyKey.slice(0, -1);
        return rows
          .filter(
            (row) =>
              row.accountId === anchor.accountId &&
              row.idempotencyKey.startsWith(prefix),
          )
          .map(fromSubmissionRow);
      });
    }
    if (bulkOnly) query = query.where('idempotencyKey', 'like', 'bulk:%');
    const rows = await query
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(limit)
      .execute<SubmissionRow>();
    return rows.map(fromSubmissionRow);
  }

  public async listAllSubmissions(
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailStoredSubmission>> {
    validateLogPagination(offset, limit);
    const [rows, count] = await Promise.all([
      this.database
        .query()
        .selectFrom<SubmissionRow>('mailSubmissions')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .offset(offset)
        .limit(limit)
        .execute<SubmissionRow>(),
      this.database
        .query()
        .selectFrom<SubmissionRow>('mailSubmissions')
        .select(({ fn }) => [fn.countAll().as('count')])
        .executeTakeFirst<{ readonly count: number | string }>(),
    ]);
    return {
      items: rows.map(fromSubmissionRow),
      total: Number(count?.count ?? 0),
    };
  }

  public async createSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId?: string,
    input?: MailComposeInput,
  ): Promise<MailStoredSubmission> {
    const now = new Date().toISOString();
    try {
      await this.database.transaction(async ({ query }) => {
        await lockWritableAccount(query, submission.accountId);
        await query
          .insertInto<SubmissionRow>('mailSubmissions')
          .values({
            ...submission,
            idempotencyKey,
            requestFingerprint,
            requestedBy: actorId,
            composeInput: input ? JSON.stringify(input) : null,
            error: jsonOrNull(submission.error),
            createdAt: now,
            updatedAt: now,
          })
          .execute();
        if (input)
          await closeDrafts(
            query,
            submission.accountId,
            input.draftMessageId,
            input.draftKey,
          );
      });
    } catch (error) {
      const existing = await this.getSubmissionByIdempotencyKey(
        submission.accountId,
        idempotencyKey,
      );
      if (existing) return existing;
      throw error;
    }
    return {
      ...submission,
      requestFingerprint,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async createScheduledSubmission(
    submission: MailSubmission,
    idempotencyKey: string,
    requestFingerprint: string,
    actorId: string,
    input: MailComposeInput,
    draftSnapshot?: NormalizedMailMessage,
  ): Promise<MailStoredSubmission> {
    const scheduledAt = submission.scheduledAt;
    if (!scheduledAt) throw new Error('Scheduled submission time is required.');
    const now = new Date().toISOString();
    try {
      await this.database.transaction(async (connection): Promise<void> => {
        await lockWritableAccount(connection.query, submission.accountId);
        let deliveryInput = input;
        if (draftSnapshot) {
          if (input.draftMessageId) {
            await assertDraftEditable(
              connection.query,
              submission.accountId,
              input.draftMessageId,
            );
            const existingDraft = await connection.query
              .selectFrom<MessageRow>('mailMessages')
              .selectAll()
              .where('id', '=', input.draftMessageId)
              .where('accountId', '=', submission.accountId)
              .where('draft', '=', true)
              .executeTakeFirst<MessageRow>();
            if (!existingDraft) throw new Error('Mail draft was not found.');
            await connection.query
              .updateTable<MessageRow>('mailMessages')
              .set({ providerMessageId: draftSnapshot.providerMessageId })
              .where('id', '=', existingDraft.id)
              .execute();
          }
          await upsertMessages(connection.query, submission.accountId, [
            draftSnapshot,
          ]);
          const savedDraft = await connection.query
            .selectFrom<MessageRow>('mailMessages')
            .selectAll()
            .where('accountId', '=', submission.accountId)
            .where('providerMessageId', '=', draftSnapshot.providerMessageId)
            .executeTakeFirst<MessageRow>();
          if (!savedDraft) throw new Error('Scheduled draft was not saved.');
          await connection.query
            .updateTable<MessageRow>('mailMessages')
            .set({ scheduledSubmissionId: submission.id })
            .where('id', '=', savedDraft.id)
            .execute();
          deliveryInput = {
            ...input,
            draftMessageId: savedDraft.id,
            deliverySnapshot:
              input.deliverySnapshot ?? toMailMessage(savedDraft, [], []),
            retainedAttachmentIds: [],
            forwardBodyIncluded: true,
            replyBodyIncluded: true,
          };
        }
        await connection.query
          .insertInto<SubmissionRow>('mailSubmissions')
          .values({
            ...submission,
            idempotencyKey,
            requestFingerprint,
            scheduledAt,
            requestedBy: actorId,
            composeInput: JSON.stringify(deliveryInput),
            error: jsonOrNull(submission.error),
            createdAt: now,
            updatedAt: now,
          })
          .execute();
        await connection.query
          .insertInto<OutboxRow>('mailOutbox')
          .values({
            id: randomUUID(),
            type: 'sendScheduledMail',
            aggregateId: submission.id,
            deduplicationKey: `scheduled-send:${submission.id}`,
            payload: JSON.stringify({
              version: 1,
              submissionId: submission.id,
            }),
            status: 'pending',
            attempts: 0,
            availableAt: scheduledAt,
            createdAt: now,
          })
          .execute();
      });
    } catch (error) {
      const existing = await this.getSubmissionByIdempotencyKey(
        submission.accountId,
        idempotencyKey,
      );
      if (existing) return existing;
      throw error;
    }
    return {
      ...submission,
      requestFingerprint,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async getScheduledSubmission(
    submissionId: string,
  ): Promise<MailScheduledSubmission | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where('id', '=', submissionId)
      .executeTakeFirst<SubmissionRow>();
    if (!row?.requestedBy || !row.composeInput) return undefined;
    return {
      actorId: row.requestedBy,
      input: parseJson<MailComposeInput>(row.composeInput, 'scheduled input'),
      submission: fromSubmissionRow(row),
    };
  }

  public async clearScheduledSubmission(submissionId: string): Promise<void> {
    await this.database
      .query()
      .updateTable<SubmissionRow>('mailSubmissions')
      .set({ requestedBy: null, composeInput: null })
      .where('id', '=', submissionId)
      .execute();
  }

  public async failScheduledSubmission(
    submissionId: string,
    error: MailProviderError,
  ): Promise<void> {
    const existing = await this.getScheduledSubmission(submissionId);
    if (!existing) return;
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, existing.submission.accountId);
      const result = await query
        .updateTable<SubmissionRow>('mailSubmissions')
        .set({
          status: 'failed',
          error: JSON.stringify(error),
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', submissionId)
        .where('status', '=', 'pending')
        .execute();
      if (result.updatedCount === 1)
        await closeDrafts(
          query,
          existing.input.accountId,
          existing.input.draftMessageId ??
            existing.input.sourceDraft?.messageId,
          existing.input.draftKey,
        );
    });
  }

  public async transitionSubmission(
    submissionId: string,
    action: 'retry' | 'cancel',
  ): Promise<MailStoredSubmission> {
    const now = new Date().toISOString();
    return this.database.transaction(async (connection) => {
      const current = await connection.query
        .selectFrom<SubmissionRow>('mailSubmissions')
        .select('accountId')
        .where('id', '=', submissionId)
        .executeTakeFirst<SubmissionRow>();
      if (!current)
        throw mailNotFound(
          'MAIL_SUBMISSION_NOT_FOUND',
          'Mail submission was not found.',
          'submissionId',
        );
      await lockWritableAccount(connection.query, current.accountId);
      const result = await connection.query
        .updateTable<SubmissionRow>('mailSubmissions')
        .set({
          status: action === 'retry' ? 'pending' : 'cancelled',
          error: null,
          updatedAt: now,
        })
        .where('id', '=', submissionId)
        .where(
          'status',
          'in',
          action === 'retry' ? ['failed'] : ['pending', 'failed'],
        )
        .where('composeInput', 'is not', null)
        .execute();
      if (result.updatedCount !== 1) {
        throw mailFailedPrecondition(
          'MAIL_SUBMISSION_STATE_INVALID',
          'The mail submission cannot perform this action in its current state.',
        );
      }
      if (action === 'cancel') {
        await connection.query
          .updateTable<MessageRow>('mailMessages')
          .set({ scheduledSubmissionId: null })
          .where('scheduledSubmissionId', '=', submissionId)
          .execute();
      }
      if (action === 'retry') {
        await connection.query
          .insertInto<OutboxRow>('mailOutbox')
          .values({
            id: randomUUID(),
            type: 'sendScheduledMail',
            aggregateId: submissionId,
            deduplicationKey: `retry-send:${submissionId}:${randomUUID()}`,
            payload: JSON.stringify({ version: 1, submissionId }),
            status: 'pending',
            attempts: 0,
            availableAt: now,
            createdAt: now,
          })
          .execute();
      }
      const row = await connection.query
        .selectFrom<SubmissionRow>('mailSubmissions')
        .selectAll()
        .where('id', '=', submissionId)
        .executeTakeFirst<SubmissionRow>();
      if (!row) throw new Error('Mail submission was not found.');
      return fromSubmissionRow(row);
    });
  }

  public async claimSubmission(
    submissionId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    return this.database.transaction(async ({ query }) => {
      const submission = await query
        .selectFrom<SubmissionRow>('mailSubmissions')
        .select('accountId')
        .where('id', '=', submissionId)
        .executeTakeFirst<Pick<SubmissionRow, 'accountId'>>();
      if (!submission) return false;
      const writable = await query
        .updateTable('mailAccounts')
        .set({ id: submission.accountId })
        .where('id', '=', submission.accountId)
        .where('status', '=', 'active')
        .execute();
      if (writable.updatedCount !== 1) return false;
      const result = await query
        .updateTable<SubmissionRow>('mailSubmissions')
        .set({
          status: 'submitting',
          leaseToken,
          leaseExpiresAt,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', submissionId)
        .where('status', '=', 'pending')
        .execute();
      return result.updatedCount === 1;
    });
  }

  public async recoverExpiredSubmissions(now: string): Promise<number> {
    const expired = await this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where('status', '=', 'submitting')
      .where('leaseExpiresAt', '<=', now)
      .execute<SubmissionRow>();
    let count = 0;
    for (const row of expired) {
      await this.database.transaction(async ({ query }) => {
        await lockWritableAccount(query, row.accountId);
        const result = await query
          .updateTable<SubmissionRow>('mailSubmissions')
          .set({
            status: 'unknown',
            error: JSON.stringify({
              code: 'MAIL_SEND_RESULT_UNKNOWN',
              message:
                'The Provider result is unknown after sender interruption.',
              category: 'unknown',
              retryable: false,
            } satisfies MailProviderError),
            leaseExpiresAt: null,
            leaseToken: null,
            updatedAt: now,
          })
          .where('id', '=', row.id)
          .where('status', '=', 'submitting')
          .where('leaseExpiresAt', '<=', now)
          .execute();
        if (result.updatedCount !== 1) return;
        count++;
        if (row.composeInput) {
          const input = parseJson<MailComposeInput>(
            row.composeInput,
            'outgoing content',
          );
          await closeDrafts(
            query,
            row.accountId,
            input.draftMessageId ?? input.sourceDraft?.messageId,
            input.draftKey,
          );
        }
      });
    }
    return count;
  }

  public async finishSubmission(
    submission: MailSubmission,
    leaseToken: string,
  ): Promise<MailSubmission> {
    const account = await this.accounts.getAccount(submission.accountId);
    if (!account || account.status === 'removing') return submission;
    const writable = await this.database.transaction(
      async (connection): Promise<boolean> => {
        const writable = await connection.query
          .updateTable('mailAccounts')
          .set({ id: submission.accountId })
          .where('id', '=', submission.accountId)
          .where('status', '!=', 'removing')
          .execute();
        if (writable.updatedCount !== 1) return false;
        const updated = await connection.query
          .updateTable<SubmissionRow>('mailSubmissions')
          .set({
            status: submission.status,
            providerMessageId: submission.providerMessageId ?? null,
            error: jsonOrNull(submission.error),
            leaseToken: null,
            leaseExpiresAt: null,
            updatedAt: new Date().toISOString(),
          })
          .where('id', '=', submission.id)
          .where('status', '=', 'submitting')
          .where('leaseToken', '=', leaseToken)
          .execute();
        if (
          updated.updatedCount === 1 &&
          ['accepted', 'failed', 'unknown'].includes(submission.status)
        ) {
          const stored = await connection.query
            .selectFrom<SubmissionRow>('mailSubmissions')
            .select('composeInput')
            .where('id', '=', submission.id)
            .executeTakeFirst<SubmissionRow>();
          if (stored?.composeInput) {
            const input = parseJson<MailComposeInput>(
              stored.composeInput,
              'outgoing content',
            );
            await closeDrafts(
              connection.query,
              submission.accountId,
              input.draftMessageId ?? input.sourceDraft?.messageId,
              input.draftKey,
            );
          }
        }
        if (updated.updatedCount === 1 && submission.status === 'accepted') {
          // Persist refresh requests with acceptance so a restart cannot lose them.
          const now = Date.now();
          await connection.query
            .insertInto<OutboxRow>('mailOutbox')
            .values(
              [0, 5_000, 30_000].map((delay) => ({
                id: randomUUID(),
                type: 'requestMailboxSync' as const,
                aggregateId: submission.id,
                deduplicationKey: `sent-sync:${submission.id}:${delay}`,
                payload: JSON.stringify({
                  version: 1,
                  accountId: submission.accountId,
                }),
                status: 'pending' as const,
                attempts: 0,
                availableAt: new Date(now + delay).toISOString(),
                createdAt: new Date(now).toISOString(),
              })),
            )
            .execute();
        }
        return true;
      },
    );
    if (!writable) return submission;
    const row = await this.database
      .query()
      .selectFrom<SubmissionRow>('mailSubmissions')
      .selectAll()
      .where('id', '=', submission.id)
      .executeTakeFirst<SubmissionRow>();
    if (!row) return submission;
    return fromSubmissionRow(row);
  }
}
