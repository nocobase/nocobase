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

export interface JsTemplateCreateJobTimeouts {
  pendingTimeoutMs: number;
  runningTimeoutMs: number;
}

export type JsTemplateCreateJobStoreClock = () => Date;

export class JsTemplateCreateJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: JsTemplateCreateJobStoreClock = () => new Date(),
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
          payload: input.payload,
          errorCode: null,
          errorReasonCode: null,
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

  async start(jobId: string, applicationName: string): Promise<JsTemplateCreateJob | null> {
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
    errorReasonCode: string | null = null,
  ): Promise<JsTemplateCreateJob | null> {
    return this.withLockedJob(jobId, async (record, transaction) => {
      if (
        !record ||
        record.get('applicationName') !== applicationName ||
        !['pending', 'running'].includes(String(record.get('status')))
      ) {
        return null;
      }
      await markFailed(record, transaction, this.clock(), errorCode, errorMessage, errorReasonCode);
      return createJobFromModel(record);
    });
  }

  async failStale(applicationName: string, timeouts: JsTemplateCreateJobTimeouts): Promise<JsTemplateCreateJob[]> {
    validateTimeout(timeouts.pendingTimeoutMs);
    validateTimeout(timeouts.runningTimeoutMs);
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).find({
      filter: { applicationName, status: { $in: ['pending', 'running'] } },
      fields: ['id'],
    });
    const failed: JsTemplateCreateJob[] = [];
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
      if (record.get('status') !== 'failed') {
        throw invalidJobState('Only failed creation jobs can be dismissed');
      }
      await record.destroy({ transaction });
    });
  }

  async listOwnVisibleJobs(applicationName: string, actorUserId: string): Promise<JsTemplateCreateJobSummary[]> {
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).find({
      filter: { applicationName, actorUserId, status: { $in: ['pending', 'running', 'failed'] } },
      sort: ['-createdAt'],
    });
    return records.map((record) => toCreateJobSummary(createJobFromModel(record)));
  }

  private async failIfStale(
    jobId: string,
    applicationName: string,
    timeouts: JsTemplateCreateJobTimeouts,
  ): Promise<JsTemplateCreateJob | null> {
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
        'JS_TEMPLATE_CREATE_TIMED_OUT',
        status === 'running' ? 'JS Template creation timed out' : 'JS Template creation did not start in time',
        null,
      );
      return createJobFromModel(record);
    });
  }

  private async withLockedJob<T>(
    jobId: string,
    run: (record: Model | null, transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.db.sequelize.transaction(async (transaction) => {
          const model = this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.createJobs);
          const record = await model.findByPk(jobId, { transaction, lock: transaction.LOCK.UPDATE });
          return run(record, transaction);
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
    payload: record.get('payload') as Record<string, unknown> | null,
    errorCode: nullableString(record.get('errorCode')),
    errorReasonCode: nullableString(record.get('errorReasonCode')),
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
  errorReasonCode: string | null,
): Promise<void> {
  await record.update(
    {
      status: 'failed',
      errorCode,
      errorReasonCode,
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
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job timeout must be a positive integer');
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
