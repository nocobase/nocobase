/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import type { Database, Model, Transaction } from '@nocobase/database';

import type {
  RemoteSyncErrorCode,
  VscFileSyncJobPhase,
  VscFileSyncJobRecord,
  VscFileSyncOperation,
} from '../../shared/remote-sync-types';
import { RemoteSyncError } from './RemoteSyncAdapter';

const leasedStatuses = ['running', 'finalize-pending'] as const;

export interface CreateSyncJobInput {
  remoteId: string;
  remoteTargetVersion: number;
  operation: VscFileSyncOperation;
  idempotencyKey: string;
  planFingerprint?: string | null;
  expectedLocalCommitId?: string | null;
  expectedRemoteRevision?: string | null;
  maxAttempts?: number;
}

export interface CreateOrGetSyncJobResult {
  job: VscFileSyncJobRecord;
  created: boolean;
}

export interface ClaimSyncJobInput {
  leaseOwner: string;
  leaseDurationMs: number;
}

export interface AdvanceSyncJobPhaseInput {
  phase: VscFileSyncJobPhase;
  resultLocalCommitId?: string | null;
  resultRemoteRevision?: string | null;
  contentHash?: string | null;
}

export interface CompleteSyncJobInput {
  resultLocalCommitId?: string | null;
  resultRemoteRevision?: string | null;
  contentHash?: string | null;
}

export interface MarkFinalizePendingInput extends CompleteSyncJobInput {
  lastErrorCode?: RemoteSyncErrorCode | null;
}

export type SyncJobStoreClock = () => Date;
export type SyncJobClaimTokenFactory = () => string;

export class SyncJobStore {
  constructor(
    private readonly db: Database,
    private readonly clock: SyncJobStoreClock = () => new Date(),
    private readonly claimTokenFactory: SyncJobClaimTokenFactory = () => randomUUID(),
  ) {}

  async createOrGet(input: CreateSyncJobInput, transaction?: Transaction): Promise<CreateOrGetSyncJobResult> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      validateMaxAttempts(input.maxAttempts ?? 3);
      const remote = await this.lockRemote(input.remoteId, currentTransaction);
      const currentVersion = remote.get('version') as number;
      if (currentVersion !== input.remoteTargetVersion) {
        throw remoteTargetChanged(input.remoteTargetVersion, currentVersion);
      }

      const existing = await this.db.getRepository('vscFileSyncJobs').findOne({
        filter: {
          remoteId: input.remoteId,
          remoteTargetVersion: input.remoteTargetVersion,
          idempotencyKey: input.idempotencyKey,
        },
        transaction: currentTransaction,
      });
      if (existing) {
        const job = syncJobFromRecord(existing);
        assertSameIdempotentJob(job, input);
        return { job, created: false };
      }

      const record = await this.db.getRepository('vscFileSyncJobs').create({
        values: {
          remoteId: input.remoteId,
          remoteTargetVersion: input.remoteTargetVersion,
          operation: input.operation,
          status: 'pending',
          phase: 'prepared',
          idempotencyKey: input.idempotencyKey,
          planFingerprint: input.planFingerprint ?? null,
          expectedLocalCommitId: input.expectedLocalCommitId ?? null,
          expectedRemoteRevision: input.expectedRemoteRevision ?? null,
          resultLocalCommitId: null,
          resultRemoteRevision: null,
          contentHash: null,
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          attempt: 0,
          maxAttempts: input.maxAttempts ?? 3,
          startedAt: null,
          finishedAt: null,
          lastErrorCode: null,
        },
        transaction: currentTransaction,
      });

      return { job: syncJobFromRecord(record), created: true };
    });
  }

  async get(jobId: string, transaction?: Transaction): Promise<VscFileSyncJobRecord> {
    const record = await this.db.getRepository('vscFileSyncJobs').findOne({
      filterByTk: jobId,
      transaction,
    });

    if (!record) {
      throw jobNotFound(jobId);
    }

    return syncJobFromRecord(record);
  }

  async claim(
    jobId: string,
    input: ClaimSyncJobInput,
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord | null> {
    return this.withLockedJob(jobId, transaction, (record, currentTransaction) =>
      this.claimLocked(record, input, currentTransaction, false),
    );
  }

  async reclaimExpired(
    jobId: string,
    input: ClaimSyncJobInput,
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord | null> {
    return this.withLockedJob(jobId, transaction, (record, currentTransaction) =>
      this.claimLocked(record, input, currentTransaction, true),
    );
  }

  async renewLease(
    jobId: string,
    claimToken: string,
    leaseDurationMs: number,
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord> {
    validateLeaseDuration(leaseDurationMs);
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockJob(jobId, currentTransaction);
      assertClaimOwner(record, claimToken);
      const now = this.clock();
      const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
      if (!leaseExpiresAt || leaseExpiresAt.getTime() <= now.getTime()) {
        throw new RemoteSyncError('BUSY', 'Synchronization job lease has expired', {
          details: { reasonCode: 'lease-expired' },
        });
      }

      await record.update(
        {
          leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
          heartbeatAt: now,
        },
        { transaction: currentTransaction },
      );

      return syncJobFromRecord(record);
    });
  }

  async advancePhase(
    jobId: string,
    claimToken: string,
    input: AdvanceSyncJobPhaseInput,
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord> {
    return this.updateClaimedJob(jobId, claimToken, transaction, async (record, currentTransaction) => {
      await record.update(
        {
          phase: input.phase,
          resultLocalCommitId: input.resultLocalCommitId ?? record.get('resultLocalCommitId'),
          resultRemoteRevision: input.resultRemoteRevision ?? record.get('resultRemoteRevision'),
          contentHash: input.contentHash ?? record.get('contentHash'),
          heartbeatAt: this.clock(),
        },
        { transaction: currentTransaction },
      );
    });
  }

  async succeed(
    jobId: string,
    claimToken: string,
    input: CompleteSyncJobInput = {},
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord> {
    return this.updateClaimedJob(jobId, claimToken, transaction, async (record, currentTransaction) => {
      await record.update(
        {
          status: 'succeeded',
          phase: 'finalized',
          resultLocalCommitId: input.resultLocalCommitId ?? record.get('resultLocalCommitId'),
          resultRemoteRevision: input.resultRemoteRevision ?? record.get('resultRemoteRevision'),
          contentHash: input.contentHash ?? record.get('contentHash'),
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: this.clock(),
          finishedAt: this.clock(),
          lastErrorCode: null,
        },
        { transaction: currentTransaction },
      );
    });
  }

  async fail(
    jobId: string,
    claimToken: string,
    lastErrorCode: RemoteSyncErrorCode,
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord> {
    return this.updateClaimedJob(jobId, claimToken, transaction, async (record, currentTransaction) => {
      await record.update(
        {
          status: 'failed',
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: this.clock(),
          finishedAt: this.clock(),
          lastErrorCode,
        },
        { transaction: currentTransaction },
      );
    });
  }

  async markFinalizePending(
    jobId: string,
    claimToken: string,
    input: MarkFinalizePendingInput = {},
    transaction?: Transaction,
  ): Promise<VscFileSyncJobRecord> {
    return this.updateClaimedJob(jobId, claimToken, transaction, async (record, currentTransaction) => {
      await record.update(
        {
          status: 'finalize-pending',
          phase: 'finalize-pending',
          resultLocalCommitId: input.resultLocalCommitId ?? record.get('resultLocalCommitId'),
          resultRemoteRevision: input.resultRemoteRevision ?? record.get('resultRemoteRevision'),
          contentHash: input.contentHash ?? record.get('contentHash'),
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: this.clock(),
          lastErrorCode: input.lastErrorCode ?? record.get('lastErrorCode'),
        },
        { transaction: currentTransaction },
      );
    });
  }

  async listRecoverable(transaction?: Transaction): Promise<VscFileSyncJobRecord[]> {
    const now = this.clock();
    const records = await this.db.getRepository('vscFileSyncJobs').find({
      filter: {
        $or: [
          { status: 'pending' },
          { status: 'finalize-pending' },
          {
            status: 'running',
            leaseExpiresAt: { $lte: now },
          },
        ],
      },
      sort: ['createdAt'],
      transaction,
    });

    return records.map(syncJobFromRecord);
  }

  private async claimLocked(
    record: Model,
    input: ClaimSyncJobInput,
    transaction: Transaction,
    requireExpired: boolean,
  ): Promise<VscFileSyncJobRecord | null> {
    validateLeaseDuration(input.leaseDurationMs);
    const job = syncJobFromRecord(record);
    const now = this.clock();
    if (job.status === 'succeeded' || job.status === 'failed') {
      return null;
    }

    const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
    const leaseIsLive = leaseExpiresAt !== null && leaseExpiresAt.getTime() > now.getTime();
    if (job.status === 'running' || job.status === 'finalize-pending') {
      if (leaseIsLive) {
        return null;
      }
      if (requireExpired && job.status === 'running' && leaseExpiresAt === null) {
        return null;
      }
    } else if (requireExpired) {
      return null;
    }

    if (job.attempt >= job.maxAttempts) {
      await record.update(
        {
          status: 'failed',
          claimToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: now,
          finishedAt: now,
          lastErrorCode: 'REMOTE_UNAVAILABLE',
        },
        { transaction },
      );
      return null;
    }

    const otherActive = await this.db.getRepository('vscFileSyncJobs').count({
      filter: {
        remoteId: job.remoteId,
        id: { $ne: job.id },
        status: { $in: [...leasedStatuses] },
      },
      transaction,
    });
    if (otherActive > 0) {
      return null;
    }

    const claimToken = this.claimTokenFactory();
    await record.update(
      {
        status: job.status === 'pending' ? 'running' : job.status,
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

    return syncJobFromRecord(record);
  }

  private async updateClaimedJob(
    jobId: string,
    claimToken: string,
    transaction: Transaction | undefined,
    update: (record: Model, transaction: Transaction) => Promise<void>,
  ): Promise<VscFileSyncJobRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockJob(jobId, currentTransaction);
      assertClaimOwner(record, claimToken);
      assertLiveLease(record, this.clock());
      await update(record, currentTransaction);
      return syncJobFromRecord(record);
    });
  }

  private async withLockedJob<T>(
    jobId: string,
    transaction: Transaction | undefined,
    run: (record: Model, transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const initial = await this.db.getRepository('vscFileSyncJobs').findOne({
        filterByTk: jobId,
        fields: ['remoteId'],
        transaction: currentTransaction,
      });
      if (!initial) {
        throw jobNotFound(jobId);
      }

      const remote = await this.lockRemote(initial.get('remoteId') as string, currentTransaction);
      const record = await this.lockJob(jobId, currentTransaction);
      const remoteTargetVersion = record.get('remoteTargetVersion') as number;
      const currentRemoteVersion = remote.get('version') as number;
      if (remoteTargetVersion !== currentRemoteVersion) {
        throw remoteTargetChanged(remoteTargetVersion, currentRemoteVersion);
      }

      return run(record, currentTransaction);
    });
  }

  private async lockRemote(remoteId: string, transaction: Transaction): Promise<Model> {
    const model = this.db.getModel<Model>('vscFileRemotes');
    const record = await model.findByPk(remoteId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw new RemoteSyncError('REMOTE_NOT_FOUND', `Remote "${remoteId}" was not found`);
    }

    return record;
  }

  private async lockJob(jobId: string, transaction: Transaction): Promise<Model> {
    const model = this.db.getModel<Model>('vscFileSyncJobs');
    const record = await model.findByPk(jobId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw jobNotFound(jobId);
    }

    return record;
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

export function syncJobFromRecord(record: Model): VscFileSyncJobRecord {
  return {
    id: record.get('id') as string,
    remoteId: record.get('remoteId') as string,
    remoteTargetVersion: record.get('remoteTargetVersion') as number,
    operation: record.get('operation') as VscFileSyncJobRecord['operation'],
    status: record.get('status') as VscFileSyncJobRecord['status'],
    phase: record.get('phase') as VscFileSyncJobRecord['phase'],
    idempotencyKey: record.get('idempotencyKey') as string,
    planFingerprint: nullableString(record.get('planFingerprint')),
    expectedLocalCommitId: nullableString(record.get('expectedLocalCommitId')),
    expectedRemoteRevision: nullableString(record.get('expectedRemoteRevision')),
    resultLocalCommitId: nullableString(record.get('resultLocalCommitId')),
    resultRemoteRevision: nullableString(record.get('resultRemoteRevision')),
    contentHash: nullableString(record.get('contentHash')),
    claimToken: nullableString(record.get('claimToken')),
    leaseOwner: nullableString(record.get('leaseOwner')),
    leaseExpiresAt: nullableDateString(record.get('leaseExpiresAt')),
    heartbeatAt: nullableDateString(record.get('heartbeatAt')),
    attempt: record.get('attempt') as number,
    maxAttempts: record.get('maxAttempts') as number,
    startedAt: nullableDateString(record.get('startedAt')),
    finishedAt: nullableDateString(record.get('finishedAt')),
    lastErrorCode: nullableString(record.get('lastErrorCode')) as RemoteSyncErrorCode | null,
    createdAt: nullableDateString(record.get('createdAt')) || undefined,
    updatedAt: nullableDateString(record.get('updatedAt')) || undefined,
  };
}

function assertSameIdempotentJob(job: VscFileSyncJobRecord, input: CreateSyncJobInput): void {
  if (
    job.operation !== input.operation ||
    job.planFingerprint !== (input.planFingerprint ?? null) ||
    job.expectedLocalCommitId !== (input.expectedLocalCommitId ?? null) ||
    job.expectedRemoteRevision !== (input.expectedRemoteRevision ?? null) ||
    job.maxAttempts !== (input.maxAttempts ?? 3)
  ) {
    throw new RemoteSyncError('REMOTE_CHANGED', 'Synchronization idempotency key was reused for another plan', {
      details: { reasonCode: 'idempotency-key-reused' },
    });
  }
}

function assertClaimOwner(record: Model, claimToken: string): void {
  const status = record.get('status') as VscFileSyncJobRecord['status'];
  if (!leasedStatuses.includes(status as (typeof leasedStatuses)[number]) || record.get('claimToken') !== claimToken) {
    throw new RemoteSyncError('BUSY', 'Synchronization job is not owned by this claimant', {
      details: { reasonCode: 'claim-token-mismatch' },
    });
  }
}

function validateLeaseDuration(leaseDurationMs: number): void {
  if (!Number.isSafeInteger(leaseDurationMs) || leaseDurationMs <= 0) {
    throw new RemoteSyncError('CONFIG_INVALID', 'Lease duration must be a positive integer', {
      details: { reasonCode: 'invalid-lease-duration' },
    });
  }
}

function validateMaxAttempts(maxAttempts: number): void {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts <= 0) {
    throw new RemoteSyncError('CONFIG_INVALID', 'Maximum attempts must be a positive integer', {
      details: { reasonCode: 'invalid-max-attempts' },
    });
  }
}

function assertLiveLease(record: Model, now: Date): void {
  const leaseExpiresAt = dateValue(record.get('leaseExpiresAt'));
  if (!leaseExpiresAt || leaseExpiresAt.getTime() <= now.getTime()) {
    throw new RemoteSyncError('BUSY', 'Synchronization job lease has expired', {
      details: { reasonCode: 'lease-expired' },
    });
  }
}

function jobNotFound(jobId: string): RemoteSyncError {
  return new RemoteSyncError('REMOTE_NOT_FOUND', `Synchronization job "${jobId}" was not found`, {
    details: { reasonCode: 'sync-job-not-found' },
  });
}

function remoteTargetChanged(expectedVersion: number, currentVersion: number): RemoteSyncError {
  return new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
    details: {
      reasonCode: 'remote-target-version-changed',
      remoteTargetVersion: currentVersion,
    },
  });
}

function dateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value);
  }
  return null;
}

function nullableDateString(value: unknown): string | null {
  const date = dateValue(value);
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
