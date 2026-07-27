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

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCreateJobRecord,
  LightExtensionCreateJobSummary,
  LightExtensionCreateSourceType,
  LightExtensionTreeEntryInput,
} from '../../shared/types';

export type LightExtensionCreateJobPayload =
  | {
      sourceType: 'template';
      message: string;
      initialFiles?: LightExtensionTreeEntryInput[];
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

export interface EnqueueLightExtensionCreateJobInput {
  applicationName: string;
  targetRepoId: string;
  name: string;
  normalizedName: string;
  title?: string | null;
  description?: string | null;
  sourceType: LightExtensionCreateSourceType;
  payload: LightExtensionCreateJobPayload;
  actorUserId?: string | null;
  requestId?: string | null;
  maxAttempts?: number;
}

export interface ClaimLightExtensionCreateJobInput {
  leaseOwner: string;
  leaseDurationMs: number;
}

export type LightExtensionCreateJobStoreClock = () => Date;
export type LightExtensionCreateJobClaimTokenFactory = () => string;

export class LightExtensionCreateJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: LightExtensionCreateJobStoreClock = () => new Date(),
    private readonly claimTokenFactory: LightExtensionCreateJobClaimTokenFactory = () => randomUUID(),
  ) {}

  async enqueue(
    input: EnqueueLightExtensionCreateJobInput,
    transaction?: Transaction,
  ): Promise<LightExtensionCreateJobRecord> {
    validateMaxAttempts(input.maxAttempts ?? 3);
    try {
      const record = await this.db.getRepository('lightExtensionCreateJobs').create({
        values: {
          applicationName: input.applicationName,
          targetRepoId: input.targetRepoId,
          name: input.name,
          normalizedName: input.normalizedName,
          title: input.title ?? null,
          description: input.description ?? null,
          sourceType: input.sourceType,
          status: 'pending',
          payload: input.payload,
          resultRepoId: null,
          errorCode: null,
          errorMessage: null,
          reservationKey: createReservationKey(input.applicationName, input.normalizedName),
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          attempt: 0,
          maxAttempts: input.maxAttempts ?? 3,
          actorUserId: input.actorUserId ?? null,
          requestId: input.requestId ?? null,
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

  async get(jobId: string, transaction?: Transaction): Promise<LightExtensionCreateJobRecord> {
    const record = await this.db.getRepository('lightExtensionCreateJobs').findOne({
      filterByTk: jobId,
      transaction,
    });
    if (!record) {
      throw jobNotFound(jobId);
    }
    return createJobFromModel(record);
  }

  async getOwn(
    jobId: string,
    applicationName: string,
    actorUserId: string,
    transaction?: Transaction,
  ): Promise<LightExtensionCreateJobRecord> {
    const record = await this.db.getRepository('lightExtensionCreateJobs').findOne({
      filter: { id: jobId, applicationName, actorUserId },
      transaction,
    });
    if (!record) {
      throw jobNotFound(jobId);
    }
    return createJobFromModel(record);
  }

  async claimPendingOrExpired(
    applicationName: string,
    input: ClaimLightExtensionCreateJobInput,
  ): Promise<LightExtensionCreateJobRecord | null> {
    validateLeaseDuration(input.leaseDurationMs);
    const candidates = await this.db.getRepository('lightExtensionCreateJobs').find({
      filter: {
        applicationName,
        $or: [{ status: 'pending' }, { status: 'running', leaseExpiresAt: { $lte: this.clock() } }],
      },
      fields: ['id'],
      sort: ['createdAt'],
      limit: 20,
    });

    for (const candidate of candidates) {
      const claimed = await this.claim(String(candidate.get('id')), input);
      if (claimed) {
        return claimed;
      }
    }
    return null;
  }

  async heartbeat(jobId: string, claimToken: string, leaseDurationMs: number): Promise<LightExtensionCreateJobRecord> {
    validateLeaseDuration(leaseDurationMs);
    return this.updateClaimed(jobId, claimToken, async (record, transaction) => {
      const now = this.clock();
      await record.update(
        {
          heartbeatAt: now,
          leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
        },
        { transaction },
      );
    });
  }

  async succeed(jobId: string, claimToken: string, repoId: string): Promise<LightExtensionCreateJobRecord> {
    return this.updateClaimed(jobId, claimToken, async (record, transaction) => {
      const now = this.clock();
      await record.update(
        {
          status: 'succeeded',
          resultRepoId: repoId,
          errorCode: null,
          errorMessage: null,
          payload: null,
          reservationKey: null,
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: now,
          finishedAt: now,
        },
        { transaction },
      );
    });
  }

  async fail(
    jobId: string,
    claimToken: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<LightExtensionCreateJobRecord> {
    return this.updateClaimed(jobId, claimToken, async (record, transaction) => {
      const now = this.clock();
      await record.update(
        {
          status: 'failed',
          errorCode,
          errorMessage,
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: now,
          finishedAt: now,
        },
        { transaction },
      );
    });
  }

  async retry(jobId: string, applicationName: string, actorUserId: string): Promise<LightExtensionCreateJobRecord> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      assertJobOwner(record, applicationName, actorUserId);
      if (record.get('status') !== 'failed' || !record.get('payload') || !record.get('reservationKey')) {
        throw invalidJobState('Only failed creation jobs with retained input can be retried');
      }
      await record.update(
        {
          status: 'pending',
          errorCode: null,
          errorMessage: null,
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          finishedAt: null,
          attempt: 0,
        },
        { transaction },
      );
      return createJobFromModel(record);
    });
  }

  async dismiss(jobId: string, applicationName: string, actorUserId: string): Promise<void> {
    await this.withLockedJob(jobId, async (record, transaction) => {
      assertJobOwner(record, applicationName, actorUserId);
      if (record.get('status') !== 'failed') {
        throw invalidJobState('Only failed creation jobs can be dismissed');
      }
      await record.update({ payload: null, reservationKey: null }, { transaction });
      await record.destroy({ transaction });
    });
  }

  async listOwnVisibleJobs(applicationName: string, actorUserId: string): Promise<LightExtensionCreateJobSummary[]> {
    const succeededAfter = new Date(this.clock().getTime() - 24 * 60 * 60 * 1000);
    const records = await this.db.getRepository('lightExtensionCreateJobs').find({
      filter: {
        applicationName,
        actorUserId,
        $or: [
          { status: { $in: ['pending', 'running', 'failed'] } },
          { status: 'succeeded', finishedAt: { $gte: succeededAfter } },
        ],
      },
      sort: ['-createdAt'],
    });
    return records.map((record) => toCreateJobSummary(createJobFromModel(record)));
  }

  async cleanupSucceeded(applicationName: string): Promise<number> {
    const finishedBefore = new Date(this.clock().getTime() - 24 * 60 * 60 * 1000);
    return this.db.getRepository('lightExtensionCreateJobs').destroy({
      filter: { applicationName, status: 'succeeded', finishedAt: { $lt: finishedBefore } },
    });
  }

  private async claim(
    jobId: string,
    input: ClaimLightExtensionCreateJobInput,
  ): Promise<LightExtensionCreateJobRecord | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      const job = createJobFromModel(record);
      const now = this.clock();
      const expired = !job.leaseExpiresAt || new Date(job.leaseExpiresAt).getTime() <= now.getTime();
      if (job.status !== 'pending' && !(job.status === 'running' && expired)) {
        return null;
      }
      if (job.attempt >= job.maxAttempts) {
        await record.update(
          {
            status: 'failed',
            errorCode: 'LIGHT_EXTENSION_CREATE_ATTEMPTS_EXHAUSTED',
            errorMessage: 'Light extension creation could not be completed',
            claimToken: null,
            leaseOwner: null,
            leaseExpiresAt: null,
            heartbeatAt: now,
            finishedAt: now,
          },
          { transaction },
        );
        return null;
      }

      const claimToken = this.claimTokenFactory();
      await record.update(
        {
          status: 'running',
          claimToken,
          leaseOwner: input.leaseOwner,
          leaseExpiresAt: new Date(now.getTime() + input.leaseDurationMs),
          heartbeatAt: now,
          attempt: job.attempt + 1,
          startedAt: record.get('startedAt') || now,
          finishedAt: null,
        },
        { transaction },
      );
      return createJobFromModel(record);
    });
  }

  private async updateClaimed(
    jobId: string,
    claimToken: string,
    update: (record: Model, transaction: Transaction) => Promise<void>,
  ): Promise<LightExtensionCreateJobRecord> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
      if (
        record.get('status') !== 'running' ||
        record.get('claimToken') !== claimToken ||
        !leaseExpiresAt ||
        leaseExpiresAt.getTime() <= this.clock().getTime()
      ) {
        throw invalidJobState('Creation job is not owned by this claimant');
      }
      await update(record, transaction);
      return createJobFromModel(record);
    });
  }

  private async withLockedJob<T>(
    jobId: string,
    run: (record: Model, transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.db.sequelize.transaction(async (transaction) => {
      const model = this.db.getModel<Model>('lightExtensionCreateJobs');
      const record = await model.findByPk(jobId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!record) {
        throw jobNotFound(jobId);
      }
      return run(record, transaction);
    });
  }
}

export function toCreateJobSummary(job: LightExtensionCreateJobRecord): LightExtensionCreateJobSummary {
  return {
    id: job.id,
    targetRepoId: job.targetRepoId,
    name: job.name,
    title: job.title,
    description: job.description,
    sourceType: job.sourceType,
    status: job.status,
    resultRepoId: job.resultRepoId,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    canRetry: job.status === 'failed' && Boolean(job.payload),
    canDismiss: job.status === 'failed',
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function createJobFromModel(record: Model): LightExtensionCreateJobRecord {
  return {
    id: String(record.get('id')),
    applicationName: String(record.get('applicationName')),
    targetRepoId: String(record.get('targetRepoId')),
    name: String(record.get('name')),
    normalizedName: String(record.get('normalizedName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    sourceType: record.get('sourceType') as LightExtensionCreateSourceType,
    status: record.get('status') as LightExtensionCreateJobRecord['status'],
    payload: record.get('payload') as Record<string, unknown> | null,
    resultRepoId: nullableString(record.get('resultRepoId')),
    errorCode: nullableString(record.get('errorCode')),
    errorMessage: nullableString(record.get('errorMessage')),
    reservationKey: nullableString(record.get('reservationKey')),
    claimToken: nullableString(record.get('claimToken')),
    leaseOwner: nullableString(record.get('leaseOwner')),
    leaseExpiresAt: nullableDateString(record.get('leaseExpiresAt')),
    heartbeatAt: nullableDateString(record.get('heartbeatAt')),
    attempt: Number(record.get('attempt')),
    maxAttempts: Number(record.get('maxAttempts')),
    actorUserId: nullableString(record.get('actorUserId')),
    requestId: nullableString(record.get('requestId')),
    startedAt: nullableDateString(record.get('startedAt')),
    finishedAt: nullableDateString(record.get('finishedAt')),
    createdAt: nullableDateString(record.get('createdAt')) || new Date(0).toISOString(),
    updatedAt: nullableDateString(record.get('updatedAt')) || new Date(0).toISOString(),
  };
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
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Lease duration must be a positive integer');
  }
}

function validateMaxAttempts(maxAttempts: number): void {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts <= 0) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Maximum attempts must be a positive integer');
  }
}

function createNameConflict(name: string, normalizedName: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_REPO_CONFLICT', 'Light extension repository name already exists', {
    details: { name, normalizedName },
  });
}

function jobNotFound(jobId: string): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_REPO_NOT_FOUND',
    `Light extension creation job "${jobId}" was not found`,
  );
}

function invalidJobState(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message, { status: 409 });
}
