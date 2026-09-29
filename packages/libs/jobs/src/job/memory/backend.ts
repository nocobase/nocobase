import { randomUUID } from 'node:crypto';

import type { ResolvedMemoryJobsConfig } from '../../config.js';
import type { JobBackend, JobRunner, JobSubmission } from '../backend.js';
import {
  JobHandlerNotRegisteredError,
  JobInterruptedError,
  type JobReceipt,
} from '../types.js';
import { copyJobPayload } from '../validation.js';
import { JobStateFile, type PendingJobState } from './state-file.js';

export class MemoryJobBackend implements JobBackend {
  private readonly file: JobStateFile;
  private readonly pending = new Map<string, PendingJobState>();
  private queue: PendingJobState[] = [];
  private readonly running = new Set<Promise<void>>();
  private runner: JobRunner | undefined;
  private abort = new AbortController();
  private opened = false;
  private pumpQueued = false;
  private failures: unknown[] = [];

  public constructor(private readonly config: ResolvedMemoryJobsConfig) {
    this.file = new JobStateFile(config);
  }

  public async open(): Promise<void> {
    const jobs = await this.file.read();
    this.pending.clear();
    for (const job of jobs) this.pending.set(job.jobId, job);
    this.queue = [...jobs];
    this.abort = new AbortController();
    this.failures = [];
    this.opened = true;
  }

  public enqueue(submission: JobSubmission): Promise<JobReceipt> {
    if (!this.opened)
      return Promise.reject(new Error('The job backend is not open.'));
    const job: PendingJobState = {
      jobId: randomUUID(),
      jobName: submission.jobName,
      payload: copyJobPayload(submission.payload),
      enqueuedAt: Date.now(),
      attempts: this.config.attempts,
      started: 0,
      failures: 0,
    };
    this.pending.set(job.jobId, job);
    this.queue.push(job);
    this.schedulePump();
    return Promise.resolve({
      jobId: job.jobId,
      jobName: job.jobName,
      enqueuedAt: new Date(job.enqueuedAt),
    });
  }

  public consume(runner: JobRunner): Promise<void> {
    this.runner = runner;
    this.schedulePump();
    return Promise.resolve();
  }

  public async close(): Promise<void> {
    this.runner = undefined;
    this.abort.abort(
      new JobInterruptedError('The job executor is shutting down.'),
    );
    await Promise.allSettled([...this.running]);
    if (this.opened) {
      this.opened = false;
      // The queue captures retry order; interrupted tasks not queued yet follow it.
      const ordered = new Map(this.queue.map((job) => [job.jobId, job]));
      for (const [id, job] of this.pending)
        if (!ordered.has(id)) ordered.set(id, job);
      await this.file.write(
        [...ordered.values()].filter((job) => this.pending.has(job.jobId)),
      );
    }
    if (this.failures.length)
      throw new AggregateError(
        this.failures,
        'Memory job processing failed unexpectedly.',
      );
  }

  private schedulePump(): void {
    if (this.pumpQueued || !this.runner) return;
    this.pumpQueued = true;
    // Yield to I/O and shutdown even when jobs synchronously resolve.
    setImmediate(() => {
      this.pumpQueued = false;
      this.pump();
    });
  }

  private pump(): void {
    while (this.runner && this.running.size < this.config.concurrency) {
      const job = this.queue.shift();
      if (!job) break;
      const runner = this.runner;
      const execution = Promise.resolve().then(() => this.execute(job, runner));
      const tracked = execution
        .catch((error: unknown) => {
          this.failures.push(error);
        })
        .finally(() => {
          this.running.delete(tracked);
          this.schedulePump();
        });
      this.running.add(tracked);
    }
  }

  private async execute(
    job: PendingJobState,
    runner: JobRunner,
  ): Promise<void> {
    if (this.abort.signal.aborted) return;
    job.started += 1;
    try {
      await runner.run({
        jobId: job.jobId,
        jobName: job.jobName,
        payload: job.payload,
        enqueuedAt: new Date(job.enqueuedAt),
        runAt: new Date(),
        attempt: job.started,
        signal: this.abort.signal,
        // Progress is not persisted: a pending task always restarts from 0.
        reportProgress: () => Promise.resolve(),
      });
      this.pending.delete(job.jobId);
    } catch (error) {
      if (error instanceof JobInterruptedError && this.abort.signal.aborted)
        return;
      job.failures += 1;
      if (
        error instanceof JobHandlerNotRegisteredError ||
        job.failures >= job.attempts
      ) {
        this.pending.delete(job.jobId);
      } else {
        this.queue.push(job);
      }
    }
  }
}
