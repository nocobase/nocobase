/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { isJsTemplateError, mapRemoteSyncErrorToJsTemplate } from '../../shared/errors';
import type { JsTemplateCreateJob } from '../../shared/types';
import { RemoteSyncError } from '../vsc-file/remotes';
import { JsTemplateCreateJobExecutor } from './JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobStore } from './JsTemplateCreateJobStore';
import type { JsTemplateAuditService } from './JsTemplateAuditService';

interface JsTemplateCreateJobEventQueue {
  subscribe(
    channel: string,
    options: { concurrency: number; idle: () => boolean; process: (message: unknown) => Promise<void> },
  ): void;
  unsubscribe(channel: string): void;
  publish(channel: string, message: unknown): Promise<void>;
}

interface JsTemplateCreateJobLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface JsTemplateCreateJobRunnerOptions {
  applicationName: string;
  eventQueue: JsTemplateCreateJobEventQueue;
  logger: JsTemplateCreateJobLogger;
  cleanupIntervalMs?: number;
  runningTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  scanBatchSize?: number;
  claimOwner?: string;
}

const queueChannel = 'js-template.create-jobs';

export class JsTemplateCreateJobRunner {
  private readonly scanIntervalMs: number;

  private readonly leaseDurationMs: number;

  private readonly heartbeatIntervalMs: number;

  private readonly scanBatchSize: number;

  private readonly claimOwner: string;

  private started = false;

  private scanTimer?: ReturnType<typeof setInterval>;

  private scanPromise?: Promise<void>;

  private readonly activeRuns = new Set<Promise<void>>();

  constructor(
    private readonly store: JsTemplateCreateJobStore,
    private readonly executor: JsTemplateCreateJobExecutor,
    private readonly options: JsTemplateCreateJobRunnerOptions,
    private readonly auditService?: JsTemplateAuditService,
  ) {
    this.scanIntervalMs = options.cleanupIntervalMs ?? 5_000;
    this.leaseDurationMs = options.runningTimeoutMs ?? 10 * 60_000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? Math.min(30_000, Math.floor(this.leaseDurationMs / 3));
    this.scanBatchSize = options.scanBatchSize ?? 100;
    this.claimOwner = options.claimOwner || `${options.applicationName}:${randomUUID()}`;
    validatePositiveInteger(this.scanIntervalMs, 'scan interval');
    validatePositiveInteger(this.leaseDurationMs, 'lease duration');
    validatePositiveInteger(this.heartbeatIntervalMs, 'heartbeat interval');
    validatePositiveInteger(this.scanBatchSize, 'scan batch size');
    if (this.heartbeatIntervalMs >= this.leaseDurationMs) {
      throw new TypeError('Creation job heartbeat interval must be shorter than the lease duration');
    }
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    this.options.eventQueue.subscribe(queueChannel, {
      concurrency: 1,
      idle: () => this.started,
      process: async (message) => {
        const jobId = getJobId(message);
        if (jobId) {
          await this.run(jobId);
        } else {
          await this.scanClaimable();
        }
      },
    });
    this.triggerScan();
    this.scanTimer = setInterval(() => {
      this.triggerScan();
    }, this.scanIntervalMs);
    this.scanTimer.unref();
  }

  async stop(): Promise<void> {
    if (this.started) {
      this.started = false;
      this.options.eventQueue.unsubscribe(queueChannel);
    }
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }
    await this.scanPromise;
    await Promise.all([...this.activeRuns]);
  }

  async publish(jobId: string): Promise<void> {
    try {
      await this.options.eventQueue.publish(queueChannel, { jobId });
    } catch (error) {
      this.options.logger.warn('JS Template create-job wake-up publish failed', {
        jobId,
        ...safeErrorMeta(error),
      });
    }
  }

  async run(jobId: string): Promise<void> {
    const execution = this.runClaimedJob(jobId);
    this.activeRuns.add(execution);
    try {
      await execution;
    } finally {
      this.activeRuns.delete(execution);
    }
  }

  private async runClaimedJob(jobId: string): Promise<void> {
    const job = await this.claimWithSqliteRetry(jobId);
    if (!job?.claimToken) {
      return;
    }
    const claimToken = job.claimToken;
    const startedAt = Date.now();
    await this.recordAuditBestEffort(job, 'createJobStart', 'success');
    const heartbeat = this.startHeartbeat(job, claimToken);
    let resultProjectId: string;
    try {
      resultProjectId = await this.executor.execute(job, claimToken);
    } catch (error) {
      await heartbeat.stop();
      await this.handleExecutionFailure(job, claimToken, error, startedAt);
      return;
    }
    await heartbeat.stop();

    let succeeded: JsTemplateCreateJob | null;
    try {
      succeeded = await this.store.succeed(job.id, this.options.applicationName, claimToken, resultProjectId);
    } catch (error) {
      this.options.logger.warn('JS Template create-job success was not persisted', {
        jobId: job.id,
        ...safeErrorMeta(error),
      });
      return;
    }
    if (!succeeded) {
      this.options.logger.warn('JS Template create job finished after its claim was lost', { jobId: job.id });
      return;
    }
    await this.recordAuditBestEffort(job, 'createJobSucceed', 'success', undefined, Date.now() - startedAt);
    this.options.logger.info('JS Template create job succeeded', {
      jobId: job.id,
      sourceType: job.sourceType,
      resultProjectId,
    });
  }

  private async handleExecutionFailure(
    job: JsTemplateCreateJob,
    claimToken: string,
    error: unknown,
    startedAt: number,
  ): Promise<void> {
    const safeError = normalizeCreateJobError(error);
    try {
      await this.executor.cleanup(job, claimToken);
    } catch (cleanupError) {
      this.options.logger.warn('JS Template failed-creation cleanup was skipped', {
        jobId: job.id,
        targetProjectId: job.targetProjectId,
        ...safeErrorMeta(cleanupError),
      });
    }

    let failed: JsTemplateCreateJob | null = null;
    try {
      failed = await this.store.fail(
        job.id,
        this.options.applicationName,
        claimToken,
        safeError.code,
        safeError.message,
        safeError.reasonCode,
      );
    } catch (storeError) {
      this.options.logger.warn('JS Template create-job failure was not persisted', {
        jobId: job.id,
        ...safeErrorMeta(storeError),
      });
    }
    if (!failed) {
      this.options.logger.warn('JS Template create-job failure ignored after claim loss', { jobId: job.id });
      return;
    }
    await this.recordAuditBestEffort(
      job,
      'createJobFail',
      'blocked',
      safeError.reasonCode || safeError.code,
      Date.now() - startedAt,
    );
    this.options.logger.warn('JS Template create job failed', { jobId: job.id, errorCode: safeError.code });
  }

  private startHeartbeat(job: JsTemplateCreateJob, claimToken: string): { stop: () => Promise<void> } {
    let pending = Promise.resolve();
    const timer = setInterval(() => {
      pending = pending
        .then(async () => {
          const renewed = await this.store.heartbeat(
            job.id,
            this.options.applicationName,
            claimToken,
            this.leaseDurationMs,
          );
          if (!renewed) {
            clearInterval(timer);
          }
        })
        .catch((error) => {
          clearInterval(timer);
          this.options.logger.warn('JS Template create-job heartbeat failed', {
            jobId: job.id,
            ...safeErrorMeta(error),
          });
        });
    }, this.heartbeatIntervalMs);
    timer.unref();
    return {
      stop: async () => {
        clearInterval(timer);
        await pending;
      },
    };
  }

  private async scanClaimable(): Promise<void> {
    if (this.scanPromise) {
      return this.scanPromise;
    }
    const scan = this.drainClaimable();
    this.scanPromise = scan;
    try {
      await scan;
    } finally {
      if (this.scanPromise === scan) {
        this.scanPromise = undefined;
      }
    }
  }

  private triggerScan(): void {
    this.scanClaimable().catch((error) => {
      this.options.logger.error('JS Template create-job scan failed', safeErrorMeta(error));
    });
  }

  private async drainClaimable(): Promise<void> {
    while (this.started) {
      const jobIds = await this.store.findClaimableIds(this.options.applicationName, this.scanBatchSize);
      if (!jobIds.length) {
        return;
      }
      for (const jobId of jobIds) {
        if (!this.started) {
          return;
        }
        try {
          await this.run(jobId);
        } catch (error) {
          this.options.logger.error('JS Template create-job execution failed unexpectedly', {
            jobId,
            ...safeErrorMeta(error),
          });
        }
      }
      if (jobIds.length < this.scanBatchSize) {
        return;
      }
    }
  }

  private async claimWithSqliteRetry(jobId: string): Promise<JsTemplateCreateJob | null> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.store.claim(jobId, this.options.applicationName, this.claimOwner, this.leaseDurationMs);
      } catch (error) {
        if (!isSqliteBusyError(error) || attempt >= 2) {
          throw error;
        }
        await delay(100);
      }
    }
  }

  private async recordAuditBestEffort(
    job: JsTemplateCreateJob,
    action: 'createJobStart' | 'createJobSucceed' | 'createJobFail',
    result: 'success' | 'blocked',
    reasonCode?: string,
    durationMs?: number,
  ): Promise<void> {
    try {
      await this.auditService?.recordCreateJobEvent({
        jobId: job.id,
        targetProjectId: job.targetProjectId,
        sourceType: job.sourceType,
        action,
        result,
        requestId: job.requestId,
        actorUserId: job.actorUserId,
        reasonCode,
        durationMs,
      });
    } catch {
      // Job execution must not depend on audit persistence availability.
    }
  }
}

function getJobId(message: unknown): string | null {
  if (!message || typeof message !== 'object' || !('jobId' in message)) {
    return null;
  }
  const jobId = message.jobId;
  return typeof jobId === 'string' && jobId ? jobId : null;
}

function normalizeCreateJobError(error: unknown): { code: string; message: string; reasonCode: string | null } {
  if (isJsTemplateError(error)) {
    return { code: error.code, message: error.message, reasonCode: safeCreateJobReasonCode(error.details?.reasonCode) };
  }
  if (error instanceof RemoteSyncError) {
    const mapped = mapRemoteSyncErrorToJsTemplate(error);
    return {
      code: mapped.code,
      message: mapped.message,
      reasonCode: safeCreateJobReasonCode(mapped.details?.reasonCode),
    };
  }
  return {
    code: 'JS_TEMPLATE_CREATE_FAILED',
    message: 'JS Template creation failed',
    reasonCode: null,
  };
}

function safeCreateJobReasonCode(value: unknown): string | null {
  return value === 'default-branch-unavailable' ? value : null;
}

function safeErrorMeta(error: unknown): Record<string, unknown> {
  if (isJsTemplateError(error)) {
    return { errorCode: error.code };
  }
  if (error instanceof RemoteSyncError) {
    return { errorCode: error.code };
  }
  return { errorCode: error instanceof Error ? error.name : 'UnknownError' };
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

function validatePositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`Creation job ${label} must be a positive integer`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
