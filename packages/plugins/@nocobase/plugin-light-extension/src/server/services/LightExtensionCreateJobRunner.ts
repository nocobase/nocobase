/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { isLightExtensionError, mapRemoteSyncErrorToLightExtension } from '../../shared/errors';
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
  leaseOwner?: string;
  leaseDurationMs?: number;
  scanIntervalMs?: number;
  shutdownTimeoutMs?: number;
}

const queueChannel = 'light-extension.create-jobs';

export class LightExtensionCreateJobRunner {
  private readonly leaseOwner: string;

  private readonly leaseDurationMs: number;

  private readonly scanIntervalMs: number;

  private readonly shutdownTimeoutMs: number;

  private started = false;

  private stopping = false;

  private scanTimer?: ReturnType<typeof setInterval>;

  private scanPromise?: Promise<void>;

  constructor(
    private readonly store: LightExtensionCreateJobStore,
    private readonly executor: LightExtensionCreateJobExecutor,
    private readonly options: LightExtensionCreateJobRunnerOptions,
    private readonly auditService?: LightExtensionAuditService,
  ) {
    this.leaseOwner = options.leaseOwner || `${options.applicationName}:${process.pid}:${randomUUID()}`;
    this.leaseDurationMs = options.leaseDurationMs ?? 30_000;
    this.scanIntervalMs = options.scanIntervalMs ?? 5_000;
    this.shutdownTimeoutMs = options.shutdownTimeoutMs ?? 5_000;
  }

  async start(): Promise<void> {
    if (this.started) {
      await this.runOnce();
      return;
    }
    this.started = true;
    this.stopping = false;
    this.options.eventQueue.subscribe(queueChannel, {
      concurrency: 1,
      idle: () => !this.stopping,
      process: async () => {
        await this.runOnce();
      },
    });
    this.scanTimer = setInterval(() => this.runScheduledScan(), this.scanIntervalMs);
    this.scanTimer.unref();
    await this.runScheduledScan();
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.stopping = true;
    this.options.eventQueue.unsubscribe(queueChannel);
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }
    const current = this.scanPromise;
    if (current) {
      await this.waitForCurrentScan(current);
    }
  }

  scheduleWake(jobId: string): void {
    setImmediate(() => this.publishWake(jobId));
  }

  async runOnce(): Promise<void> {
    if (this.scanPromise) {
      return this.scanPromise;
    }
    const scan = this.scan();
    this.scanPromise = scan;
    try {
      await scan;
    } finally {
      if (this.scanPromise === scan) {
        this.scanPromise = undefined;
      }
    }
  }

  private async publishWake(jobId: string): Promise<void> {
    try {
      await this.options.eventQueue.publish(queueChannel, { jobId });
    } catch {
      this.options.logger.warn('Light extension create-job wake publish failed', { jobId });
    }
  }

  private async runScheduledScan(): Promise<void> {
    try {
      await this.runOnce();
    } catch (error) {
      this.options.logger.error('Light extension create-job recovery scan failed', safeErrorMeta(error));
    }
  }

  private async scan(): Promise<void> {
    if (this.stopping) {
      return;
    }
    await this.store.cleanupSucceeded(this.options.applicationName);
    while (!this.stopping) {
      const job = await this.store.claimPendingOrExpired(this.options.applicationName, {
        leaseOwner: this.leaseOwner,
        leaseDurationMs: this.leaseDurationMs,
      });
      if (!job?.claimToken) {
        return;
      }
      const outcome = await this.executeClaimed(job.id, job.claimToken, job.recoveryOnly);
      if (outcome === 'defer') {
        return;
      }
    }
  }

  private async executeClaimed(
    jobId: string,
    claimToken: string,
    recoveryOnly: boolean,
  ): Promise<'continue' | 'defer'> {
    const startedAt = Date.now();
    const heartbeat = new ClaimHeartbeat(this.store, jobId, claimToken, this.leaseDurationMs, this.options.logger);
    heartbeat.start();
    try {
      const job = await this.store.get(jobId);
      await this.recordAuditBestEffort({
        jobId: job.id,
        targetRepoId: job.targetRepoId,
        sourceType: job.sourceType,
        action: 'createJobStart',
        result: 'success',
        requestId: job.requestId,
        actorUserId: job.actorUserId,
      });
      const repoId = await this.executor.execute(job, { recoveryOnly });
      await this.store.succeed(jobId, claimToken, repoId);
      await this.recordAuditBestEffort({
        jobId: job.id,
        targetRepoId: job.targetRepoId,
        sourceType: job.sourceType,
        action: 'createJobSucceed',
        result: 'success',
        requestId: job.requestId,
        actorUserId: job.actorUserId,
        durationMs: Date.now() - startedAt,
      });
      this.options.logger.info('Light extension create job succeeded', {
        jobId,
        sourceType: job.sourceType,
        targetRepoId: job.targetRepoId,
      });
      return 'continue';
    } catch (error) {
      const safeError = normalizeCreateJobError(error);
      const job = await this.getJobBestEffort(jobId);
      heartbeat.stop();
      if (job && job.attempt < job.maxAttempts && isRetryableCreateJobError(error)) {
        try {
          await this.store.requeue(jobId, claimToken);
          this.options.logger.warn('Light extension create job will retry', {
            jobId,
            attempt: job.attempt,
            maxAttempts: job.maxAttempts,
            errorCode: safeError.code,
          });
        } catch (storeError) {
          this.options.logger.warn('Light extension create-job retry was not persisted', {
            jobId,
            ...safeErrorMeta(storeError),
          });
        }
        return 'defer';
      }
      try {
        await this.store.fail(jobId, claimToken, safeError.code, safeError.message);
      } catch (storeError) {
        this.options.logger.warn('Light extension create-job result was not persisted', {
          jobId,
          ...safeErrorMeta(storeError),
        });
      }
      if (job) {
        await this.recordAuditBestEffort({
          jobId: job.id,
          targetRepoId: job.targetRepoId,
          sourceType: job.sourceType,
          action: 'createJobFail',
          result: 'blocked',
          requestId: job.requestId,
          actorUserId: job.actorUserId,
          reasonCode: safeError.code,
          durationMs: Date.now() - startedAt,
        });
      }
      this.options.logger.warn('Light extension create job failed', { jobId, errorCode: safeError.code });
      return 'continue';
    } finally {
      heartbeat.stop();
    }
  }

  private async waitForCurrentScan(current: Promise<void>): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<'timeout'>((resolve) => {
      timeout = setTimeout(() => resolve('timeout'), this.shutdownTimeoutMs);
      timeout.unref();
    });
    try {
      const result = await Promise.race([current.then(() => 'settled' as const), timedOut]);
      if (result === 'timeout') {
        this.options.logger.warn('Light extension create-job shutdown wait timed out', {
          timeoutMs: this.shutdownTimeoutMs,
        });
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private async getJobBestEffort(jobId: string) {
    try {
      return await this.store.get(jobId);
    } catch {
      return null;
    }
  }

  private async recordAuditBestEffort(
    input: Parameters<LightExtensionAuditService['recordCreateJobEvent']>[0],
  ): Promise<void> {
    try {
      await this.auditService?.recordCreateJobEvent(input);
    } catch {
      // Durable job execution must not depend on audit persistence availability.
    }
  }
}

class ClaimHeartbeat {
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly store: LightExtensionCreateJobStore,
    private readonly jobId: string,
    private readonly claimToken: string,
    private readonly leaseDurationMs: number,
    private readonly logger: LightExtensionCreateJobLogger,
  ) {}

  start(): void {
    const intervalMs = Math.max(250, Math.floor(this.leaseDurationMs / 3));
    this.timer = setInterval(() => this.renew(), intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async renew(): Promise<void> {
    try {
      await this.store.heartbeat(this.jobId, this.claimToken, this.leaseDurationMs);
    } catch (error) {
      this.stop();
      this.logger.warn('Light extension create-job heartbeat stopped', {
        jobId: this.jobId,
        ...safeErrorMeta(error),
      });
    }
  }
}

function isRetryableCreateJobError(error: unknown): boolean {
  if (error instanceof RemoteSyncError) {
    return ['BUSY', 'RATE_LIMITED', 'REMOTE_UNAVAILABLE'].includes(error.code);
  }
  if (isLightExtensionError(error)) {
    return [
      'LIGHT_EXTENSION_IDEMPOTENCY_IN_PROGRESS',
      'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
      'LIGHT_EXTENSION_SOURCE_ERROR',
      'LIGHT_EXTENSION_SYNC_BUSY',
      'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
      'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
    ].includes(error.code);
  }
  return true;
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
