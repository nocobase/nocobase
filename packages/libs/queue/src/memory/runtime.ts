import { randomUUID } from 'node:crypto';

import type { DispatchOutcome } from '../consumer.js';
import type { PreparedJob } from '../message.js';
import { backoffDelay } from '../options.js';
import type { QueueRuntime, QueueRuntimeContext } from '../runtime.js';
import type {
  QueueBackoffOptions,
  QueueRetentionPolicy,
  RateLimitOptions,
} from '../types.js';
import { MemoryStateFile, type MemoryJobState } from './state-file.js';

/** Longest delay one Node.js timer can wait; longer delays re-arm. */
const MAX_TIMER_DELAY = 2 ** 31 - 1;

interface MemoryJob {
  readonly id: string;
  readonly channel: string;
  readonly text: string;
  readonly priority: number;
  readonly attempts: number;
  readonly backoff: QueueBackoffOptions | undefined;
  readonly removeOnComplete: QueueRetentionPolicy;
  readonly removeOnFail: QueueRetentionPolicy;
  started: number;
  failures: number;
  /** Position within its priority; a returned job keeps it and so goes back to the head. */
  sequence: number;
  delayedUntil: number | undefined;
}

interface FinishedJob {
  readonly id: string;
  readonly finishedAt: number;
}

/**
 * One logical queue held in this process, following BullMQ's observable
 * rules rather than its internals: jobs without a priority run first and in
 * order, then prioritized ones by priority; retries follow the backoff; the
 * rate limit counts starts per window. Unfinished jobs reach the state file
 * only at close.
 */
export class MemoryQueueRuntime implements QueueRuntime {
  private readonly file: MemoryStateFile;
  /** Every unfinished job: waiting, delayed and active. */
  private readonly jobs = new Map<string, MemoryJob>();
  private waiting: MemoryJob[] = [];
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly active = new Set<string>();
  private readonly running = new Set<Promise<void>>();
  private readonly completed: FinishedJob[] = [];
  private readonly failed: FinishedJob[] = [];
  private readonly finished = new Set<string>();
  private readonly failures: unknown[] = [];
  private sequence = 0;
  private concurrency: number;
  private rateLimit: RateLimitOptions | null = null;
  private windowStart = 0;
  private windowCount = 0;
  private rateTimer: NodeJS.Timeout | undefined;
  private consuming = false;
  private stopping = false;
  private opened = false;
  private pumpQueued = false;

  public constructor(private readonly context: QueueRuntimeContext) {
    const persistencePath = context.config.persistencePath;
    if (persistencePath === undefined) {
      throw new Error('An inMemory queue needs a persistence path.');
    }
    this.file = new MemoryStateFile({
      persistencePath,
      namespace: context.config.namespace,
      queue: context.queue,
    });
    this.concurrency = context.config.concurrency;
  }

  public async open(): Promise<void> {
    const states = await this.file.read();
    for (const state of states) this.restore(state);
    this.opened = true;
  }

  public add(jobs: readonly PreparedJob[]): Promise<string[]> {
    if (!this.opened) {
      return Promise.reject(
        new Error(`Queue "${this.context.queue}" is not open.`),
      );
    }
    // Everything was prepared before this point, so the batch is written as a whole.
    const ids = jobs.map((prepared) => {
      const id = prepared.jobId ?? randomUUID();
      if (this.jobs.has(id) || this.finished.has(id)) return id;
      const job: MemoryJob = {
        id,
        channel: prepared.channel,
        text: prepared.text,
        priority: prepared.options.priority,
        attempts: prepared.options.attempts,
        backoff: prepared.options.backoff,
        removeOnComplete: prepared.options.removeOnComplete,
        removeOnFail: prepared.options.removeOnFail,
        started: 0,
        failures: 0,
        sequence: this.nextSequence(),
        delayedUntil: undefined,
      };
      this.jobs.set(id, job);
      if (prepared.options.delay > 0) {
        this.delay(job, Date.now() + prepared.options.delay);
      } else {
        this.enqueue(job);
      }
      return id;
    });
    this.schedulePump();
    return Promise.resolve(ids);
  }

  public startConsuming(concurrency: number): Promise<void> {
    this.concurrency = concurrency;
    if (!this.stopping) this.consuming = true;
    this.schedulePump();
    return Promise.resolve();
  }

  public pauseConsuming(): Promise<void> {
    this.consuming = false;
    return Promise.resolve();
  }

  public setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    this.schedulePump();
  }

  public setRateLimit(rateLimit: RateLimitOptions | null): Promise<void> {
    this.rateLimit = rateLimit;
    this.windowStart = 0;
    this.windowCount = 0;
    this.clearRateTimer();
    this.schedulePump();
    return Promise.resolve();
  }

  public drain(delayed: boolean): Promise<void> {
    for (const job of this.waiting) this.jobs.delete(job.id);
    this.waiting = [];
    if (delayed) {
      for (const [id, timer] of this.timers) {
        clearTimeout(timer);
        this.jobs.delete(id);
      }
      this.timers.clear();
    }
    return Promise.resolve();
  }

  public async stopConsuming(): Promise<void> {
    this.stopping = true;
    this.consuming = false;
    this.clearRateTimer();
    await Promise.allSettled([...this.running]);
  }

  public async close(): Promise<void> {
    this.stopping = true;
    this.consuming = false;
    this.clearRateTimer();
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    if (this.opened) {
      this.opened = false;
      await this.file.write(this.snapshot());
    }
    if (this.failures.length > 0) {
      throw new AggregateError(
        this.failures,
        `Queue "${this.context.queue}" failed unexpectedly while processing jobs.`,
      );
    }
  }

  /** Interrupted jobs first, then waiting ones in order, then delayed ones. */
  private snapshot(): MemoryJobState[] {
    const jobs = [...this.jobs.values()];
    const activeJobs = jobs
      .filter((job) => this.active.has(job.id))
      .sort((a, b) => a.sequence - b.sequence);
    const delayedJobs = jobs
      .filter(
        (job) => job.delayedUntil !== undefined && !this.active.has(job.id),
      )
      .sort(
        (a, b) =>
          (a.delayedUntil ?? 0) - (b.delayedUntil ?? 0) ||
          a.sequence - b.sequence,
      );
    return [...activeJobs, ...this.waiting, ...delayedJobs].map(toState);
  }

  private restore(state: MemoryJobState): void {
    const job: MemoryJob = {
      id: state.jobId,
      channel: state.channel,
      text: state.message,
      priority: state.priority,
      attempts: state.attempts,
      backoff: state.backoff,
      removeOnComplete: state.removeOnComplete,
      removeOnFail: state.removeOnFail,
      started: state.started,
      failures: state.failures,
      sequence: this.nextSequence(),
      delayedUntil: undefined,
    };
    this.jobs.set(job.id, job);
    if (state.delayedUntil !== undefined && state.delayedUntil > Date.now()) {
      this.delay(job, state.delayedUntil);
    } else {
      this.enqueue(job);
    }
  }

  private nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  /** Non-prioritized jobs first, then by priority, then in sequence. */
  private enqueue(job: MemoryJob): void {
    job.delayedUntil = undefined;
    let index = this.waiting.length;
    while (index > 0 && compareWaiting(this.waiting[index - 1], job) > 0) {
      index -= 1;
    }
    this.waiting.splice(index, 0, job);
  }

  private delay(job: MemoryJob, due: number): void {
    // Whole milliseconds, as the state file records them.
    const until = Math.ceil(due);
    job.delayedUntil = until;
    const arm = (): void => {
      const remaining = until - Date.now();
      if (remaining > 0) {
        const timer = setTimeout(arm, Math.min(remaining, MAX_TIMER_DELAY));
        timer.unref();
        this.timers.set(job.id, timer);
        return;
      }
      this.timers.delete(job.id);
      if (!this.jobs.has(job.id)) return;
      // A promoted job joins the end of its priority, as in BullMQ.
      job.sequence = this.nextSequence();
      this.enqueue(job);
      this.schedulePump();
    };
    arm();
  }

  private schedulePump(): void {
    if (this.pumpQueued || !this.consuming) return;
    this.pumpQueued = true;
    // Yields to I/O and shutdown even when handlers resolve synchronously.
    setImmediate(() => {
      this.pumpQueued = false;
      this.pump();
    });
  }

  private pump(): void {
    while (
      this.consuming &&
      this.running.size < this.concurrency &&
      this.waiting.length > 0
    ) {
      if (!this.takeRateLimitSlot()) break;
      const job = this.waiting.shift();
      if (!job) break;
      const execution = this.execute(job);
      const tracked = execution
        .catch((error: unknown) => {
          this.failures.push(error);
          this.context.logger.error(
            { error, queue: this.context.queue },
            `Queue "${this.context.queue}" failed unexpectedly while processing a job.`,
          );
        })
        .finally(() => {
          this.running.delete(tracked);
          this.schedulePump();
        });
      this.running.add(tracked);
    }
  }

  private takeRateLimitSlot(): boolean {
    const limit = this.rateLimit;
    if (!limit) return true;
    const now = Date.now();
    if (now >= this.windowStart + limit.duration) {
      this.windowStart = now;
      this.windowCount = 0;
    }
    if (this.windowCount < limit.max) {
      this.windowCount += 1;
      return true;
    }
    if (!this.rateTimer) {
      this.rateTimer = setTimeout(
        () => {
          this.rateTimer = undefined;
          this.schedulePump();
        },
        this.windowStart + limit.duration - now,
      );
      this.rateTimer.unref();
    }
    return false;
  }

  private clearRateTimer(): void {
    if (this.rateTimer) clearTimeout(this.rateTimer);
    this.rateTimer = undefined;
  }

  private async execute(job: MemoryJob): Promise<void> {
    this.active.add(job.id);
    job.started += 1;
    let outcome: DispatchOutcome;
    try {
      outcome = await this.context.dispatcher.dispatch({
        id: job.id,
        channel: job.channel,
        text: job.text,
      });
    } catch (error) {
      // Only an unreadable message throws here; a retry cannot fix it.
      outcome = { kind: 'cancelled', reason: String(error) };
    } finally {
      this.active.delete(job.id);
    }
    switch (outcome.kind) {
      case 'completed':
        this.finish(job, 'completed');
        return;
      case 'cancelled':
        this.finish(job, 'failed');
        return;
      case 'requeue':
        // Not a failure: the job goes back to the head of its priority.
        job.started -= 1;
        this.enqueue(job);
        return;
      case 'failed': {
        job.failures += 1;
        if (job.failures >= job.attempts) {
          this.finish(job, 'failed');
          return;
        }
        const delay = backoffDelay(job.backoff, job.failures);
        job.sequence = this.nextSequence();
        if (delay > 0) this.delay(job, Date.now() + delay);
        else this.enqueue(job);
        return;
      }
    }
  }

  private finish(job: MemoryJob, state: 'completed' | 'failed'): void {
    this.jobs.delete(job.id);
    const policy =
      state === 'completed' ? job.removeOnComplete : job.removeOnFail;
    if (policy === true) return;
    const history = state === 'completed' ? this.completed : this.failed;
    history.push({ id: job.id, finishedAt: Date.now() });
    this.finished.add(job.id);
    this.trim(history, policy);
  }

  private trim(history: FinishedJob[], policy: QueueRetentionPolicy): void {
    let keep = history.length;
    if (typeof policy === 'number') keep = Math.min(keep, policy);
    if (typeof policy === 'object') {
      if (policy.count !== undefined) keep = Math.min(keep, policy.count);
      if ('age' in policy && policy.age !== undefined) {
        const oldest = Date.now() - policy.age * 1000;
        const young = history.filter((entry) => entry.finishedAt >= oldest);
        keep = Math.min(keep, young.length);
      }
    }
    const removed = history.splice(0, history.length - keep);
    for (const entry of removed) this.finished.delete(entry.id);
  }
}

function compareWaiting(a: MemoryJob, b: MemoryJob): number {
  const groupA = a.priority === 0 ? 0 : 1;
  const groupB = b.priority === 0 ? 0 : 1;
  return groupA - groupB || a.priority - b.priority || a.sequence - b.sequence;
}

function toState(job: MemoryJob): MemoryJobState {
  return {
    jobId: job.id,
    channel: job.channel,
    message: job.text,
    priority: job.priority,
    attempts: job.attempts,
    ...(job.backoff !== undefined ? { backoff: job.backoff } : {}),
    removeOnComplete: job.removeOnComplete,
    removeOnFail: job.removeOnFail,
    started: job.started,
    failures: job.failures,
    ...(job.delayedUntil !== undefined
      ? { delayedUntil: job.delayedUntil }
      : {}),
  };
}
