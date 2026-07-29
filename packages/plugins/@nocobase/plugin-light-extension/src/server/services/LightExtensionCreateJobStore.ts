/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

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
}

export interface LightExtensionCreateJobTimeouts {
  pendingTimeoutMs: number;
  runningTimeoutMs: number;
}

export type LightExtensionCreateJobStoreClock = () => Date;

export class LightExtensionCreateJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: LightExtensionCreateJobStoreClock = () => new Date(),
  ) {}

  async enqueue(
    input: EnqueueLightExtensionCreateJobInput,
    transaction?: Transaction,
  ): Promise<LightExtensionCreateJobRecord> {
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
          errorCode: null,
          errorMessage: null,
          reservationKey: createReservationKey(input.applicationName, input.normalizedName),
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

  async start(jobId: string, applicationName: string): Promise<LightExtensionCreateJobRecord | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (!record || record.get('applicationName') !== applicationName || record.get('status') !== 'pending') {
        return null;
      }
      await record.update({ status: 'running', startedAt: this.clock(), finishedAt: null }, { transaction });
      return createJobFromModel(record);
    });
  }

  async complete(jobId: string, applicationName: string): Promise<boolean> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (!record || record.get('applicationName') !== applicationName || record.get('status') !== 'running') {
        return false;
      }
      await record.destroy({ transaction });
      return true;
    });
  }

  async fail(
    jobId: string,
    applicationName: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<LightExtensionCreateJobRecord | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (
        !record ||
        record.get('applicationName') !== applicationName ||
        !['pending', 'running'].includes(String(record.get('status')))
      ) {
        return null;
      }
      await markFailed(record, transaction, this.clock(), errorCode, errorMessage);
      return createJobFromModel(record);
    });
  }

  async failStale(
    applicationName: string,
    timeouts: LightExtensionCreateJobTimeouts,
  ): Promise<LightExtensionCreateJobRecord[]> {
    validateTimeout(timeouts.pendingTimeoutMs);
    validateTimeout(timeouts.runningTimeoutMs);
    const records = await this.db.getRepository('lightExtensionCreateJobs').find({
      filter: { applicationName, status: { $in: ['pending', 'running'] } },
      fields: ['id'],
    });
    const failed: LightExtensionCreateJobRecord[] = [];
    for (const candidate of records) {
      const job = await this.failIfStale(String(candidate.get('id')), applicationName, timeouts);
      if (job) {
        failed.push(job);
      }
    }
    return failed;
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

  async dismiss(jobId: string, applicationName: string, actorUserId: string): Promise<void> {
    await this.withLockedJob(jobId, async (record, transaction) => {
      if (!record) {
        throw jobNotFound(jobId);
      }
      assertJobOwner(record, applicationName, actorUserId);
      if (record.get('status') !== 'failed') {
        throw invalidJobState('Only failed creation jobs can be dismissed');
      }
      await record.destroy({ transaction });
    });
  }

  async listOwnVisibleJobs(applicationName: string, actorUserId: string): Promise<LightExtensionCreateJobSummary[]> {
    const records = await this.db.getRepository('lightExtensionCreateJobs').find({
      filter: { applicationName, actorUserId, status: { $in: ['pending', 'running', 'failed'] } },
      sort: ['-createdAt'],
    });
    return records.map((record) => toCreateJobSummary(createJobFromModel(record)));
  }

  private async failIfStale(
    jobId: string,
    applicationName: string,
    timeouts: LightExtensionCreateJobTimeouts,
  ): Promise<LightExtensionCreateJobRecord | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (!record || record.get('applicationName') !== applicationName) {
        return null;
      }
      const status = record.get('status');
      const now = this.clock();
      const referenceTime =
        status === 'running' ? dateValue(record.get('startedAt')) : dateValue(record.get('createdAt'));
      const timeoutMs = status === 'running' ? timeouts.runningTimeoutMs : timeouts.pendingTimeoutMs;
      if (
        !referenceTime ||
        !['pending', 'running'].includes(String(status)) ||
        now.getTime() - referenceTime.getTime() < timeoutMs
      ) {
        return null;
      }
      await markFailed(
        record,
        transaction,
        now,
        'LIGHT_EXTENSION_CREATE_TIMED_OUT',
        status === 'running' ? 'Light extension creation timed out' : 'Light extension creation did not start in time',
      );
      return createJobFromModel(record);
    });
  }

  private async withLockedJob<T>(
    jobId: string,
    run: (record: Model | null, transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.db.sequelize.transaction(async (transaction) => {
      const model = this.db.getModel<Model>('lightExtensionCreateJobs');
      const record = await model.findByPk(jobId, { transaction, lock: transaction.LOCK.UPDATE });
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
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
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
    errorCode: nullableString(record.get('errorCode')),
    errorMessage: nullableString(record.get('errorMessage')),
    reservationKey: nullableString(record.get('reservationKey')),
    actorUserId: nullableString(record.get('actorUserId')),
    requestId: nullableString(record.get('requestId')),
    startedAt: nullableDateString(record.get('startedAt')),
    finishedAt: nullableDateString(record.get('finishedAt')),
    createdAt: nullableDateString(record.get('createdAt')) || new Date(0).toISOString(),
    updatedAt: nullableDateString(record.get('updatedAt')) || new Date(0).toISOString(),
  };
}

async function markFailed(
  record: Model,
  transaction: Transaction,
  now: Date,
  errorCode: string,
  errorMessage: string,
): Promise<void> {
  await record.update(
    {
      status: 'failed',
      errorCode,
      errorMessage,
      payload: null,
      reservationKey: null,
      finishedAt: now,
    },
    { transaction },
  );
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

function validateTimeout(timeoutMs: number): void {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Creation job timeout must be a positive integer');
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
