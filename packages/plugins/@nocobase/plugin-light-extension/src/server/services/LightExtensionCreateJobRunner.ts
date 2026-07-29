/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isLightExtensionError, mapRemoteSyncErrorToLightExtension } from '../../shared/errors';
import type { LightExtensionCreateJobRecord } from '../../shared/types';
import { RemoteSyncError } from '../vsc-file/public-api';
import { LightExtensionCreateJobExecutor } from './LightExtensionCreateJobExecutor';
import { LightExtensionCreateJobStore } from './LightExtensionCreateJobStore';
import type { LightExtensionAuditService } from './LightExtensionAuditService';

interface LightExtensionCreateJobEventQueue {
  subscribe(
    channel: string,
    options: { concurrency: number; idle: () => boolean; process: (message: unknown) => Promise<void> },
  ): void;
  unsubscribe(channel: string): void;
  publish(channel: string, message: unknown): Promise<void>;
}

interface LightExtensionCreateJobLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface LightExtensionCreateJobRunnerOptions {
  applicationName: string;
  eventQueue: LightExtensionCreateJobEventQueue;
  logger: LightExtensionCreateJobLogger;
  cleanupIntervalMs?: number;
  pendingTimeoutMs?: number;
  runningTimeoutMs?: number;
}

const queueChannel = 'light-extension.create-jobs';

export class LightExtensionCreateJobRunner {
  private readonly cleanupIntervalMs: number;

  private readonly pendingTimeoutMs: number;

  private readonly runningTimeoutMs: number;

  private started = false;

  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly store: LightExtensionCreateJobStore,
    private readonly executor: LightExtensionCreateJobExecutor,
    private readonly options: LightExtensionCreateJobRunnerOptions,
    private readonly auditService?: LightExtensionAuditService,
  ) {
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000;
    this.pendingTimeoutMs = options.pendingTimeoutMs ?? 5 * 60_000;
    this.runningTimeoutMs = options.runningTimeoutMs ?? 10 * 60_000;
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
        }
      },
    });
    await this.cleanupStale();
    this.cleanupTimer = setInterval(() => this.cleanupStale(), this.cleanupIntervalMs);
    this.cleanupTimer.unref();
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.options.eventQueue.unsubscribe(queueChannel);
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async publish(jobId: string): Promise<void> {
    await this.options.eventQueue.publish(queueChannel, { jobId });
  }

  async run(jobId: string): Promise<void> {
    let job: LightExtensionCreateJobRecord | null = null;
    for (let attempt = 0; ; attempt += 1) {
      try {
        job = await this.store.start(jobId, this.options.applicationName);
        break;
      } catch (error) {
        if (!isSqliteBusyError(error) || attempt >= 2) {
          throw error;
        }
        await delay(100);
      }
    }
    if (!job) {
      return;
    }
    const startedAt = Date.now();
    await this.recordAuditBestEffort(job, 'createJobStart', 'success');
    try {
      await this.executor.execute(job);
      const completed = await this.store.complete(job.id, this.options.applicationName);
      if (!completed) {
        await this.cleanupJob(job);
        this.options.logger.warn('Light extension create job finished after it expired', { jobId: job.id });
        return;
      }
      await this.recordAuditBestEffort(job, 'createJobSucceed', 'success', undefined, Date.now() - startedAt);
      this.options.logger.info('Light extension create job succeeded', {
        jobId: job.id,
        sourceType: job.sourceType,
        targetRepoId: job.targetRepoId,
      });
    } catch (error) {
      const safeError = normalizeCreateJobError(error);
      try {
        await this.store.fail(job.id, this.options.applicationName, safeError.code, safeError.message);
      } catch (storeError) {
        this.options.logger.warn('Light extension create-job failure was not persisted', {
          jobId: job.id,
          ...safeErrorMeta(storeError),
        });
      }
      await this.cleanupJob(job);
      await this.recordAuditBestEffort(job, 'createJobFail', 'blocked', safeError.code, Date.now() - startedAt);
      this.options.logger.warn('Light extension create job failed', { jobId: job.id, errorCode: safeError.code });
    }
  }

  private async cleanupStale(): Promise<void> {
    try {
      const jobs = await this.store.failStale(this.options.applicationName, {
        pendingTimeoutMs: this.pendingTimeoutMs,
        runningTimeoutMs: this.runningTimeoutMs,
      });
      for (const job of jobs) {
        await this.cleanupJob(job);
        await this.recordAuditBestEffort(job, 'createJobFail', 'blocked', job.errorCode || undefined);
      }
    } catch (error) {
      this.options.logger.error('Light extension create-job cleanup failed', safeErrorMeta(error));
    }
  }

  private async cleanupJob(job: LightExtensionCreateJobRecord): Promise<void> {
    try {
      await this.executor.cleanup(job);
    } catch (error) {
      this.options.logger.warn('Light extension failed-creation cleanup failed', {
        jobId: job.id,
        targetRepoId: job.targetRepoId,
        ...safeErrorMeta(error),
      });
    }
  }

  private async recordAuditBestEffort(
    job: LightExtensionCreateJobRecord,
    action: 'createJobStart' | 'createJobSucceed' | 'createJobFail',
    result: 'success' | 'blocked',
    reasonCode?: string,
    durationMs?: number,
  ): Promise<void> {
    try {
      await this.auditService?.recordCreateJobEvent({
        jobId: job.id,
        targetRepoId: job.targetRepoId,
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

function normalizeCreateJobError(error: unknown): { code: string; message: string } {
  if (isLightExtensionError(error)) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof RemoteSyncError) {
    const mapped = mapRemoteSyncErrorToLightExtension(error);
    return { code: mapped.code, message: mapped.message };
  }
  return {
    code: 'LIGHT_EXTENSION_CREATE_FAILED',
    message: 'Light extension creation failed',
  };
}

function safeErrorMeta(error: unknown): Record<string, unknown> {
  if (isLightExtensionError(error)) {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
