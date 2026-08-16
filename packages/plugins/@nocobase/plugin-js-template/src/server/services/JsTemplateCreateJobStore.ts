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
      files: JsTemplateTreeEntryInput[];
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
  idempotencyKey: string;
  requestHash: string;
  actorUserId: string;
  sessionId: string;
  authorizationRole: string;
  authorizationRoles: string[];
  requestId?: string | null;
}

export type JsTemplateCreateJobStoreClock = () => Date;

export type JsTemplateCreateJobClaimTokenFactory = () => string;

const visibleTerminalJobLimit = 20;

const retainedTerminalJobLimit = 100;

const terminalJobPruneBatchSize = 100;

const activeJobStatuses = ['pending', 'running', 'finalize-pending'] as const;

const terminalJobStatuses = ['succeeded', 'failed'] as const;

export class JsTemplateCreateJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: JsTemplateCreateJobStoreClock = () => new Date(),
    private readonly claimTokenFactory: JsTemplateCreateJobClaimTokenFactory = () => randomUUID(),
  ) {}

  async enqueue(input: EnqueueJsTemplateCreateJobInput, transaction?: Transaction): Promise<JsTemplateCreateJob> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.enqueueOnce(input, transaction);
      } catch (error) {
        if (transaction || !isSqliteDatabase(this.db) || !isSqliteBusyError(error) || attempt >= 4) {
          throw error;
        }
        await delay(100 * (attempt + 1));
      }
    }
  }

  private async enqueueOnce(
    input: EnqueueJsTemplateCreateJobInput,
    transaction?: Transaction,
  ): Promise<JsTemplateCreateJob> {
    const existing = await this.findByIdempotency(input, transaction);
    if (existing) {
      return existing;
    }
    try {
      // Sequelize wraps findOrCreate in an internal transaction/savepoint. On PostgreSQL, this keeps the caller's
      // outer transaction usable after a competing insert wins the idempotency or name-reservation constraint.
      const [record] = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).model.findOrCreate({
        where: {
          applicationName: input.applicationName,
          actorUserId: input.actorUserId,
          sessionId: input.sessionId,
          idempotencyKey: input.idempotencyKey,
        },
        defaults: {
          applicationName: input.applicationName,
          targetProjectId: input.targetProjectId,
          name: input.name,
          normalizedName: input.normalizedName,
          title: input.title ?? null,
          description: input.description ?? null,
          sourceType: input.sourceType,
          idempotencyKey: input.idempotencyKey,
          requestHash: input.requestHash,
          status: 'pending',
          resultProjectId: null,
          payload: input.payload,
          errorCode: null,
          errorReasonCode: null,
          errorMessage: null,
          reservationKey: createReservationKey(input.applicationName, input.normalizedName),
          actorUserId: input.actorUserId,
          sessionId: input.sessionId,
          authorizationRole: input.authorizationRole,
          authorizationRoles: input.authorizationRoles,
          dismissed: false,
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
      return await this.resolveIdempotencyRecord(record, input, transaction);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const raced = await this.findByIdempotency(input, transaction);
        if (raced) {
          return raced;
        }
        if (isCreateJobReservationConstraintError(error)) {
          throw createNameConflict(input.name, input.normalizedName);
        }
      }
      throw error;
    }
  }

  private async findByIdempotency(
    input: EnqueueJsTemplateCreateJobInput,
    transaction?: Transaction,
  ): Promise<JsTemplateCreateJob | null> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).findOne({
      filter: {
        applicationName: input.applicationName,
        actorUserId: input.actorUserId,
        sessionId: input.sessionId,
        idempotencyKey: input.idempotencyKey,
      },
      transaction,
    });
    if (!record) {
      return null;
    }
    return this.resolveIdempotencyRecord(record, input, transaction);
  }

  private async resolveIdempotencyRecord(
    record: Model,
    input: EnqueueJsTemplateCreateJobInput,
    transaction?: Transaction,
  ): Promise<JsTemplateCreateJob> {
    if (record.get('requestHash') !== input.requestHash) {
      throw new JsTemplateError(
        'JS_TEMPLATE_IDEMPOTENCY_CONFLICT',
        'Creation job idempotency key was already used with a different request',
      );
    }
    if (record.get('dismissed')) {
      await record.update({ dismissed: false }, { transaction });
    }
    return createJobFromModel(record);
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
          { status: 'finalize-pending', leaseExpiresAt: { $lte: now } },
          { status: 'finalize-pending', leaseExpiresAt: null },
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
          status: record.get('status') === 'finalize-pending' ? 'finalize-pending' : 'running',
          resultProjectId: record.get('status') === 'finalize-pending' ? record.get('resultProjectId') : null,
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

  async assertCurrentFinalizableClaim(
    jobId: string,
    applicationName: string,
    claimToken: string,
    transaction: Transaction,
  ): Promise<void> {
    await this.withLockedJob(
      jobId,
      async (record) => {
        if (!isCurrentFinalizableClaim(record, applicationName, claimToken, this.clock())) {
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
    validateResult?: (transaction: Transaction) => Promise<void>,
  ): Promise<JsTemplateCreateJob | null> {
    if (!resultProjectId.trim()) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job result Project identity is required');
    }
    const succeeded = await this.withLockedJob(jobId, async (record, transaction) => {
      const now = this.clock();
      if (!isCurrentFinalizableClaim(record, applicationName, claimToken, now)) {
        return null;
      }
      await validateResult?.(transaction);
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
    if (succeeded) {
      await this.pruneTerminalJobsBestEffort(applicationName, succeeded.actorUserId, succeeded.sessionId);
    }
    return succeeded;
  }

  async markFinalizePending(
    jobId: string,
    applicationName: string,
    claimToken: string,
    resultProjectId: string,
    transaction: Transaction,
  ): Promise<JsTemplateCreateJob> {
    return this.withLockedJob(
      jobId,
      async (record) => {
        if (!isCurrentLiveClaim(record, applicationName, claimToken, this.clock())) {
          throw claimLost();
        }
        await record.update(
          {
            status: 'finalize-pending',
            resultProjectId,
            payload: null,
          },
          { transaction },
        );
        return createJobFromModel(record);
      },
      transaction,
    );
  }

  async fail(
    jobId: string,
    applicationName: string,
    claimToken: string,
    errorCode: string,
    errorMessage: string,
    errorReasonCode: string | null = null,
  ): Promise<JsTemplateCreateJob | null> {
    const failed = await this.withLockedJob(jobId, async (record, transaction) => {
      const now = this.clock();
      if (!isCurrentLiveClaim(record, applicationName, claimToken, now)) {
        return null;
      }
      await record.update(
        {
          status: 'failed',
          resultProjectId: null,
          payload: null,
          errorCode,
          errorReasonCode,
          errorMessage,
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
    if (failed) {
      await this.pruneTerminalJobsBestEffort(applicationName, failed.actorUserId, failed.sessionId);
    }
    return failed;
  }

  async getOwn(
    jobId: string,
    applicationName: string,
    actorUserId: string,
    sessionId: string,
    transaction?: Transaction,
  ): Promise<JsTemplateCreateJob> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs).findOne({
      filter: { id: jobId, applicationName, actorUserId, sessionId, dismissed: false },
      transaction,
    });
    if (!record) {
      throw jobNotFound(jobId);
    }
    return createJobFromModel(record);
  }

  async dismiss(jobId: string, applicationName: string, actorUserId: string, sessionId: string): Promise<void> {
    await this.withLockedJob(jobId, async (record, transaction) => {
      if (!record) {
        throw jobNotFound(jobId);
      }
      assertJobOwner(record, applicationName, actorUserId, sessionId);
      if (!['succeeded', 'failed'].includes(String(record.get('status')))) {
        throw invalidJobState('Only terminal creation jobs can be dismissed');
      }
      await record.update({ dismissed: true }, { transaction });
    });
  }

  async listOwnVisibleJobs(
    applicationName: string,
    actorUserId: string,
    sessionId: string,
  ): Promise<JsTemplateCreateJobSummary[]> {
    const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs);
    const activeRecords = await repository.find({
      filter: {
        applicationName,
        actorUserId,
        sessionId,
        dismissed: false,
        status: { $in: activeJobStatuses },
      },
      sort: ['-createdAt', '-id'],
    });
    const terminalRecords = await repository.find({
      filter: {
        applicationName,
        actorUserId,
        sessionId,
        dismissed: false,
        status: { $in: terminalJobStatuses },
      },
      sort: ['-createdAt', '-id'],
      limit: visibleTerminalJobLimit,
    });
    const jobsById = new Map<string, JsTemplateCreateJobSummary>();
    for (const record of [...activeRecords, ...terminalRecords]) {
      const summary = toCreateJobSummary(createJobFromModel(record));
      jobsById.set(summary.id, summary);
    }
    return [...jobsById.values()].sort(compareCreateJobsNewestFirst);
  }

  private async pruneTerminalJobsBestEffort(
    applicationName: string,
    actorUserId: string | null,
    sessionId: string,
  ): Promise<void> {
    try {
      const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.createJobs);
      let staleJobIds: string[];
      do {
        const staleRecords = await repository.find({
          filter: {
            applicationName,
            actorUserId,
            sessionId,
            dismissed: false,
            status: { $in: terminalJobStatuses },
          },
          fields: ['id'],
          sort: ['-createdAt', '-id'],
          offset: retainedTerminalJobLimit,
          limit: terminalJobPruneBatchSize,
        });
        staleJobIds = staleRecords.map((record) => String(record.get('id')));
        if (staleJobIds.length) {
          await repository.update({
            filter: { id: { $in: staleJobIds } },
            values: { dismissed: true },
          });
        }
      } while (staleJobIds.length);
    } catch (error) {
      this.db.logger.warn('JS Template create-job terminal-history pruning failed', {
        applicationName,
        actorUserId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }
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

export function hashJsTemplateCreateRequest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortObjectKeys(value)))
    .digest('hex');
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => typeof entryValue !== 'undefined')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortObjectKeys(entryValue)]),
  );
}

function compareCreateJobsNewestFirst(left: JsTemplateCreateJobSummary, right: JsTemplateCreateJobSummary): number {
  const createdAtDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  return createdAtDifference || right.id.localeCompare(left.id);
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
    idempotencyKey: String(record.get('idempotencyKey')),
    requestHash: String(record.get('requestHash')),
    status: record.get('status') as JsTemplateCreateJob['status'],
    resultProjectId: nullableString(record.get('resultProjectId')),
    payload: record.get('payload') as Record<string, unknown> | null,
    errorCode: nullableString(record.get('errorCode')),
    errorReasonCode: nullableString(record.get('errorReasonCode')),
    errorMessage: nullableString(record.get('errorMessage')),
    reservationKey: nullableString(record.get('reservationKey')),
    actorUserId: String(record.get('actorUserId')),
    sessionId: String(record.get('sessionId')),
    authorizationRole: String(record.get('authorizationRole')),
    authorizationRoles: normalizeStoredRoles(record.get('authorizationRoles')),
    dismissed: Boolean(record.get('dismissed')),
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
  if (status !== 'running' && status !== 'finalize-pending') {
    return false;
  }
  const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
  return !leaseExpiresAt || leaseExpiresAt.getTime() <= now.getTime();
}

function isCurrentFinalizableClaim(
  record: Model | null,
  applicationName: string,
  claimToken: string,
  now: Date,
): record is Model {
  if (record?.get('status') !== 'finalize-pending') {
    return false;
  }
  return (
    record.get('applicationName') === applicationName &&
    record.get('claimToken') === claimToken &&
    Boolean(dateValue(record.get('leaseExpiresAt'))?.getTime() > now.getTime())
  );
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

function assertJobOwner(record: Model, applicationName: string, actorUserId: string, sessionId: string): void {
  if (
    record.get('applicationName') !== applicationName ||
    String(record.get('actorUserId')) !== actorUserId ||
    String(record.get('sessionId')) !== sessionId ||
    Boolean(record.get('dismissed'))
  ) {
    throw jobNotFound(String(record.get('id')));
  }
}

function normalizeStoredRoles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === 'string' && Boolean(role.trim()))
    : [];
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
    code?: unknown;
    original?: { code?: unknown };
    parent?: { code?: unknown };
  };
  return (
    candidate.code === 'SQLITE_BUSY' ||
    candidate.original?.code === 'SQLITE_BUSY' ||
    candidate.parent?.code === 'SQLITE_BUSY'
  );
}

function isSqliteDatabase(db: Database): boolean {
  return db.sequelize?.getDialect?.() === 'sqlite';
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
  return new JsTemplateError('JS_TEMPLATE_CREATE_JOB_NOT_FOUND', `JS Template creation job "${jobId}" was not found`);
}

function isCreateJobReservationConstraintError(error: UniqueConstraintError): boolean {
  const constraintNames = [error, error.parent, error.original].flatMap((value) => [
    readStringProperty(value, 'constraint'),
    readStringProperty(value, 'index'),
  ]);
  if (constraintNames.includes('jst_create_job_reservation_uq')) {
    return true;
  }

  const fields = new Set<string>();
  if (Array.isArray(error.fields)) {
    for (const field of error.fields) {
      if (typeof field === 'string') {
        fields.add(field);
      }
    }
  } else {
    for (const field of Object.keys(error.fields || {})) {
      fields.add(field);
    }
  }
  for (const validationError of error.errors) {
    if (validationError.path) {
      fields.add(validationError.path);
    }
  }
  return (
    (fields.size === 1 && fields.has('jst_create_job_reservation_uq')) ||
    (fields.size === 2 && fields.has('applicationName') && fields.has('reservationKey'))
  );
}

function readStringProperty(value: unknown, property: string): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === 'string' ? propertyValue : null;
}

function invalidJobState(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message, { status: 409 });
}

function claimLost(): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_CONFLICT', 'JS Template creation claim is no longer current', {
    status: 409,
  });
}
