/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import type { Database, Model, Transaction } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateCreateJob,
  JsTemplateCreateJobSummary,
  JsTemplateCreateSourceType,
  JsTemplateTreeEntryInput,
} from '../../shared/types';

export type JsTemplateCreateJobPayload =
  | {
      sourceType: 'starter';
      message: string;
      initialFiles?: JsTemplateTreeEntryInput[];
    }
  | {
      sourceType: 'zip';
      message: string;
      zipBase64: string;
    }
  | {
      sourceType: 'git';
      provider: 'git';
      config: Record<string, unknown>;
      authRef: string | null;
    };

export interface EnqueueJsTemplateCreateJobInput {
  applicationName: string;
  targetProjectId: string;
  name: string;
  normalizedName: string;
  title?: string | null;
  description?: string | null;
  sourceType: JsTemplateCreateSourceType;
  payload: JsTemplateCreateJobPayload;
  actorUserId?: string | null;
  requestId?: string | null;
}

export type JsTemplateCreateJobStoreClock = () => Date;

export type JsTemplateCreateJobClaimTokenFactory = () => string;

export class JsTemplateCreateJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: JsTemplateCreateJobStoreClock = () => new Date(),
    private readonly claimTokenFactory: JsTemplateCreateJobClaimTokenFactory = () => randomUUID(),
  ) {}

  async enqueue(input: EnqueueJsTemplateCreateJobInput, transaction?: Transaction): Promise<JsTemplateCreateJob> {
    try {
      const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).create({
        values: {
          applicationName: input.applicationName,
          targetProjectId: input.targetProjectId,
          name: input.name,
          normalizedName: input.normalizedName,
          title: input.title ?? null,
          description: input.description ?? null,
          sourceType: input.sourceType,
          status: 'pending',
          resultProjectId: null,
          payload: input.payload,
          errorCode: null,
          errorReasonCode: null,
          errorMessage: null,
          reservationKey: createReservationKey(input.applicationName, input.normalizedName),
          actorUserId: input.actorUserId ?? null,
          requestId: input.requestId ?? null,
          claimToken: null,
          claimOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          attempt: 0,
          startedAt: null,
          finishedAt: null,
        },
        transaction,
      });
      return createJobFromModel(record);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw createNameConflict(input.name, input.normalizedName);
      }
      throw error;
    }
  }

  async findClaimableIds(applicationName: string, limit = 100): Promise<string[]> {
    validateLimit(limit);
    const now = this.clock();
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).find({
      filter: {
        applicationName,
        $or: [
          { status: 'pending' },
          { status: 'running', leaseExpiresAt: { $lte: now } },
          { status: 'running', leaseExpiresAt: null },
        ],
      },
      fields: ['id'],
      sort: ['createdAt'],
      limit,
    });
    return records.map((record) => String(record.get('id')));
  }

  async claim(
    jobId: string,
    applicationName: string,
    claimOwner: string,
    leaseDurationMs: number,
  ): Promise<JsTemplateCreateJob | null> {
    validateLeaseDuration(leaseDurationMs);
    if (!claimOwner.trim()) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job claim owner is required');
    }
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (!record || record.get('applicationName') !== applicationName) {
        return null;
      }
      const now = this.clock();
      if (!isClaimable(record, now)) {
        return null;
      }
      await record.update(
        {
          status: 'running',
          resultProjectId: null,
          claimToken: this.claimTokenFactory(),
          claimOwner,
          leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
          heartbeatAt: now,
          attempt: numericValue(record.get('attempt')) + 1,
          startedAt: record.get('startedAt') || now,
          finishedAt: null,
          errorCode: null,
          errorReasonCode: null,
          errorMessage: null,
        },
        { transaction },
      );
      return createJobFromModel(record);
    });
  }

  async heartbeat(
    jobId: string,
    applicationName: string,
    claimToken: string,
    leaseDurationMs: number,
  ): Promise<boolean> {
    validateLeaseDuration(leaseDurationMs);
    return this.withLockedJob(jobId, async (record, transaction) => {
      const now = this.clock();
      if (!isCurrentLiveClaim(record, applicationName, claimToken, now)) {
        return false;
      }
      await record.update(
        {
          leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
          heartbeatAt: now,
        },
        { transaction },
      );
      return true;
    });
  }

  async assertCurrentClaim(
    jobId: string,
    applicationName: string,
    claimToken: string,
    transaction: Transaction,
  ): Promise<void> {
    await this.withLockedJob(
      jobId,
      async (record) => {
        if (!isCurrentLiveClaim(record, applicationName, claimToken, this.clock())) {
          throw claimLost();
        }
      },
      transaction,
    );
  }

  async succeed(
    jobId: string,
    applicationName: string,
    claimToken: string,
    resultProjectId: string,
  ): Promise<JsTemplateCreateJob | null> {
    if (!resultProjectId.trim()) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job result Project identity is required');
    }
    return this.withLockedJob(jobId, async (record, transaction) => {
      const now = this.clock();
      if (!isCurrentLiveClaim(record, applicationName, claimToken, now)) {
        return null;
      }
      await record.update(
        {
          status: 'succeeded',
          resultProjectId,
          payload: null,
          reservationKey: null,
          errorCode: null,
          errorReasonCode: null,
          errorMessage: null,
          claimToken: null,
          claimOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          finishedAt: now,
        },
        { transaction },
      );
      return createJobFromModel(record);
    });
  }

  async fail(
    jobId: string,
    applicationName: string,
    claimToken: string,
    errorCode: string,
    errorMessage: string,
    errorReasonCode: string | null = null,
  ): Promise<JsTemplateCreateJob | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      const now = this.clock();
      if (!isCurrentLiveClaim(record, applicationName, claimToken, now)) {
        return null;
      }
      await record.update(
        {
          status: 'failed',
          resultProjectId: null,
          errorCode,
          errorReasonCode,
          errorMessage,
          payload: null,
          reservationKey: null,
          claimToken: null,
          claimOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          finishedAt: now,
        },
        { transaction },
      );
      return createJobFromModel(record);
    });
  }

  async getOwn(
    jobId: string,
    applicationName: string,
    actorUserId: string,
    transaction?: Transaction,
  ): Promise<JsTemplateCreateJob> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).findOne({
      filter: { id: jobId, applicationName, actorUserId },
      transaction,
    });
    if (!record) {
      throw jobNotFound(jobId);
    }
    return createJobFromModel(record);
  }

  async dismiss(jobId: string, applicationName: string, actorUserId: string): Promise<void> {
    await this.withLockedJob(jobId, async (record, transaction) => {
      if (!record) {
        throw jobNotFound(jobId);
      }
      assertJobOwner(record, applicationName, actorUserId);
      if (!['succeeded', 'failed'].includes(String(record.get('status')))) {
        throw invalidJobState('Only terminal creation jobs can be dismissed');
      }
      await record.destroy({ transaction });
    });
  }

  async listOwnVisibleJobs(applicationName: string, actorUserId: string): Promise<JsTemplateCreateJobSummary[]> {
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).find({
      filter: { applicationName, actorUserId, status: { $in: ['pending', 'running', 'succeeded', 'failed'] } },
      sort: ['-createdAt'],
    });
    return records.map((record) => toCreateJobSummary(createJobFromModel(record)));
  }

  private async withLockedJob<T>(
    jobId: string,
    run: (record: Model | null, transaction: Transaction) => Promise<T>,
    transaction?: Transaction,
  ): Promise<T> {
    if (transaction) {
      const model = this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.createJobs);
      const record = await model.findByPk(jobId, { transaction, lock: transaction.LOCK.UPDATE });
      return run(record, transaction);
    }
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.db.sequelize.transaction(async (currentTransaction) => {
          const model = this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.createJobs);
          const record = await model.findByPk(jobId, {
            transaction: currentTransaction,
            lock: currentTransaction.LOCK.UPDATE,
          });
          return run(record, currentTransaction);
        });
      } catch (error) {
        if (this.db.sequelize.getDialect() !== 'sqlite' || !isSqliteBusyError(error) || attempt >= 2) {
          throw error;
        }
        await delay(100);
      }
    }
  }
}

export function toCreateJobSummary(job: JsTemplateCreateJob): JsTemplateCreateJobSummary {
  return {
    id: job.id,
    targetProjectId: job.targetProjectId,
    name: job.name,
    title: job.title,
    description: job.description,
    sourceType: job.sourceType,
    status: job.status,
    resultProjectId: job.resultProjectId,
    errorCode: job.errorCode,
    errorReasonCode: job.errorReasonCode ?? null,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function createJobFromModel(record: Model): JsTemplateCreateJob {
  return {
    id: String(record.get('id')),
    applicationName: String(record.get('applicationName')),
    targetProjectId: String(record.get('targetProjectId')),
    name: String(record.get('name')),
    normalizedName: String(record.get('normalizedName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    sourceType: record.get('sourceType') as JsTemplateCreateSourceType,
    status: record.get('status') as JsTemplateCreateJob['status'],
    resultProjectId: nullableString(record.get('resultProjectId')),
    payload: record.get('payload') as Record<string, unknown> | null,
    errorCode: nullableString(record.get('errorCode')),
    errorReasonCode: nullableString(record.get('errorReasonCode')),
    errorMessage: nullableString(record.get('errorMessage')),
    reservationKey: nullableString(record.get('reservationKey')),
    actorUserId: nullableString(record.get('actorUserId')),
    requestId: nullableString(record.get('requestId')),
    claimToken: nullableString(record.get('claimToken')),
    claimOwner: nullableString(record.get('claimOwner')),
    leaseExpiresAt: nullableDateString(record.get('leaseExpiresAt')),
    heartbeatAt: nullableDateString(record.get('heartbeatAt')),
    attempt: numericValue(record.get('attempt')),
    startedAt: nullableDateString(record.get('startedAt')),
    finishedAt: nullableDateString(record.get('finishedAt')),
    createdAt: nullableDateString(record.get('createdAt')) || new Date(0).toISOString(),
    updatedAt: nullableDateString(record.get('updatedAt')) || new Date(0).toISOString(),
  };
}

function isClaimable(record: Model, now: Date): boolean {
  const status = record.get('status');
  if (status === 'pending') {
    return true;
  }
  if (status !== 'running') {
    return false;
  }
  const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
  return !leaseExpiresAt || leaseExpiresAt.getTime() <= now.getTime();
}

function isCurrentLiveClaim(
  record: Model | null,
  applicationName: string,
  claimToken: string,
  now: Date,
): record is Model {
  if (
    !record ||
    record.get('applicationName') !== applicationName ||
    record.get('status') !== 'running' ||
    record.get('claimToken') !== claimToken
  ) {
    return false;
  }
  const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
  return Boolean(leaseExpiresAt && leaseExpiresAt.getTime() > now.getTime());
}

function createReservationKey(applicationName: string, normalizedName: string): string {
  return `sha256:${createHash('sha256').update(`${applicationName}\0${normalizedName}`).digest('hex')}`;
}

function assertJobOwner(record: Model, applicationName: string, actorUserId: string): void {
  if (record.get('applicationName') !== applicationName || String(record.get('actorUserId')) !== actorUserId) {
    throw jobNotFound(String(record.get('id')));
  }
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numericValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
}

function dateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function nullableDateString(value: unknown): string | null {
  return dateValue(value)?.toISOString() || null;
}

function validateLeaseDuration(leaseDurationMs: number): void {
  if (!Number.isSafeInteger(leaseDurationMs) || leaseDurationMs <= 0) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job lease duration must be a positive integer');
  }
}

function validateLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job scan limit must be a positive integer');
  }
}

function isSqliteBusyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    original?: { code?: unknown };
    parent?: { code?: unknown };
  };
  return candidate.original?.code === 'SQLITE_BUSY' || candidate.parent?.code === 'SQLITE_BUSY';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createNameConflict(name: string, normalizedName: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PROJECT_CONFLICT', 'JS Template project name already exists', {
    details: { name, normalizedName },
  });
}

function jobNotFound(jobId: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PROJECT_NOT_FOUND', `JS Template creation job "${jobId}" was not found`);
}

function invalidJobState(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message, { status: 409 });
}

function claimLost(): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_CREATE_FAILED', 'JS Template creation claim is no longer current', {
    status: 409,
  });
}
