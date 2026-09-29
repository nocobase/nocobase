import { randomUUID } from 'node:crypto';

import {
  Queue,
  UnrecoverableError,
  WaitingError,
  Worker,
  type Job,
  type JobsOptions,
} from 'bullmq';

import type {
  ResolvedRedisJobsConfig,
  JobsRetentionPolicy,
} from '../../config.js';
import {
  jobQueueName,
  type JobBackend,
  type JobRunner,
  type JobSubmission,
} from '../backend.js';
import {
  JobHandlerNotRegisteredError,
  JobInterruptedError,
  type JobReceipt,
} from '../types.js';
import type { JobsLogger } from '../../types.js';

/** Immutable submission metadata stored by BullMQ, not execution-local state. */
export interface RedisJobData {
  readonly jobName: string;
  readonly payload: unknown;
  readonly enqueuedAt: number;
}

/** The public Queue surface this backend owns; narrow enough for typed doubles. */
export interface RedisJobQueue {
  add(
    name: string,
    data: RedisJobData,
    options: JobsOptions,
  ): Promise<{ readonly id?: string }>;
  waitUntilReady(): Promise<unknown>;
  close(): Promise<void>;
  on(event: 'error', listener: (error: Error) => void): void;
}

/** Every method belongs to BullMQ's public Worker API. */
export interface RedisJobWorker {
  waitUntilReady(): Promise<unknown>;
  cancelAllJobs(reason?: string): void;
  close(): Promise<void>;
  on(event: 'error', listener: (error: Error) => void): void;
}

export type RedisProcessingJob = Pick<
  Job<RedisJobData, void, string>,
  | 'id'
  | 'data'
  | 'processedOn'
  | 'attemptsStarted'
  | 'moveToWait'
  | 'updateProgress'
>;

export type JobProcessor = (
  job: RedisProcessingJob,
  token: string | undefined,
  signal: AbortSignal | undefined,
) => Promise<void>;

export interface RedisJobBackendFactories {
  readonly queue: (config: ResolvedRedisJobsConfig) => RedisJobQueue;
  readonly worker: (
    config: ResolvedRedisJobsConfig,
    processor: JobProcessor,
  ) => RedisJobWorker;
}

function retentionOptions(
  policy: JobsRetentionPolicy,
): JobsOptions['removeOnComplete'] {
  if (typeof policy !== 'object') return policy;
  if (policy.count !== undefined) {
    return {
      count: policy.count,
      ...(policy.age !== undefined ? { age: policy.age } : {}),
    };
  }
  if (policy.age !== undefined) return { age: policy.age };
  // An object with neither bound retains all finished jobs.
  return false;
}

export const defaultRedisJobFactories: RedisJobBackendFactories = {
  queue: (config) =>
    new Queue<RedisJobData, void, string>(jobQueueName(config), {
      connection: { ...config.connection },
      prefix: config.namespace,
    }),
  worker: (config, processor) =>
    new Worker<RedisJobData, void, string>(jobQueueName(config), processor, {
      connection: { ...config.connection },
      prefix: config.namespace,
      concurrency: config.concurrency,
    }),
};

/**
 * Uses only public BullMQ APIs. Graceful interruption returns unfinished work
 * to waiting without spending a failure attempt; abrupt loss is recovered by
 * BullMQ's lock expiry and stalled detection. Neither path rewrites payloads.
 */
export class RedisJobBackend implements JobBackend {
  private queue: RedisJobQueue | undefined;
  private worker: RedisJobWorker | undefined;
  private runner: JobRunner | undefined;
  private stopping: AbortController = new AbortController();
  private closePromise: Promise<void> | undefined;

  public constructor(
    private readonly config: ResolvedRedisJobsConfig,
    private readonly logger: JobsLogger | undefined,
    private readonly factories: RedisJobBackendFactories = defaultRedisJobFactories,
  ) {}

  public async open(): Promise<void> {
    this.stopping = new AbortController();
    this.closePromise = undefined;
    const queue = this.factories.queue(this.config);
    this.queue = queue;
    queue.on('error', (error) => this.report(error, 'queue'));
    // Keep partial resources reachable so the executor owns failure cleanup.
    await queue.waitUntilReady();
  }

  public async enqueue(submission: JobSubmission): Promise<JobReceipt> {
    const queue = this.queue;
    if (!queue) throw new Error('The job queue is not open.');
    const jobId = randomUUID();
    const enqueuedAt = Date.now();
    await queue.add(
      submission.jobName,
      {
        jobName: submission.jobName,
        payload: submission.payload,
        enqueuedAt,
      },
      {
        jobId,
        attempts: this.config.attempts,
        removeOnComplete: retentionOptions(this.config.removeOnComplete),
        removeOnFail: retentionOptions(this.config.removeOnFail),
      },
    );
    return {
      jobId,
      jobName: submission.jobName,
      enqueuedAt: new Date(enqueuedAt),
    };
  }

  public async consume(runner: JobRunner): Promise<void> {
    if (!this.queue) throw new Error('The job queue is not open.');
    this.runner = runner;
    // BullMQ supplies its cancellation signal only to three-argument processors.
    const processor: JobProcessor = (job, token, signal) =>
      this.process(
        job,
        token,
        signal
          ? AbortSignal.any([signal, this.stopping.signal])
          : this.stopping.signal,
      );
    const worker = this.factories.worker(this.config, processor);
    this.worker = worker;
    worker.on('error', (error) => this.report(error, 'worker'));
    await worker.waitUntilReady();
  }

  public close(): Promise<void> {
    this.closePromise ??= this.closeResources();
    return this.closePromise;
  }

  private async closeResources(): Promise<void> {
    const worker = this.worker;
    const queue = this.queue;
    this.worker = undefined;
    this.queue = undefined;
    const errors: unknown[] = [];
    // A processor can start after BullMQ takes cancelAllJobs' active snapshot.
    this.stopping.abort();
    if (worker) {
      try {
        worker.cancelAllJobs('The job executor is shutting down.');
      } catch (error) {
        errors.push(error);
      }
      try {
        // Graceful close waits for processors and their state transitions.
        await worker.close();
      } catch (error) {
        errors.push(error);
      }
    }
    this.runner = undefined;
    try {
      await queue?.close();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1)
      throw new AggregateError(
        errors,
        'Failed to close the Redis job backend.',
      );
  }

  private async process(
    job: RedisProcessingJob,
    token: string | undefined,
    signal: AbortSignal,
  ): Promise<void> {
    if (this.stopping.signal.aborted) {
      // Do not start user work after shutdown, even if BullMQ just acquired it.
      if (!token) throw new JobInterruptedError();
      await job.moveToWait(token);
      throw new WaitingError();
    }
    const runner = this.runner;
    if (!runner) throw new Error('The job executor is not consuming.');
    if (!job.id) throw new Error('The queued job has no identifier.');
    try {
      await runner.run({
        jobId: job.id,
        jobName: job.data.jobName,
        payload: job.data.payload,
        enqueuedAt: new Date(job.data.enqueuedAt),
        runAt: new Date(job.processedOn ?? Date.now()),
        attempt: job.attemptsStarted,
        signal,
        // Stored on the BullMQ job, where other processes can read it.
        reportProgress: (progress) => job.updateProgress(progress),
      });
    } catch (error) {
      if (error instanceof JobHandlerNotRegisteredError) {
        throw new UnrecoverableError(error.message);
      }
      if (error instanceof JobInterruptedError && signal.aborted) {
        // Never transition without the current processor's ownership token.
        if (!token) throw error;
        await job.moveToWait(token);
        // The public sentinel tells BullMQ not to acknowledge or fail this job.
        throw new WaitingError();
      }
      throw error;
    }
  }

  private report(error: Error, resource: 'queue' | 'worker'): void {
    this.logger?.error(
      { error, scope: this.config.scope, key: this.config.key },
      `The job ${resource} reported an error`,
    );
  }
}
