import {
  Queue,
  UnrecoverableError,
  Worker,
  type Job,
  type JobSchedulerJson,
  type RepeatOptions,
} from 'bullmq';

import type { ResolvedRedisScheduleExecutorConfig } from '../config.js';
import {
  ScheduleHandlerNotRegisteredError,
  type ScheduleBackend,
  type ScheduleExecutionSettings,
  type ScheduleRuleWrite,
  type ScheduleRunner,
  type StoredScheduleRule,
} from '../executor.js';
import type {
  JobScheduler,
  ScheduleEvent,
  ScheduleEventName,
  ScheduleLogger,
} from '../types.js';
import type { ScheduleRule } from '../validation.js';

/** The part of a BullMQ `Queue` this backend calls, all of it public API. */
export type ScheduleQueue = Pick<
  Queue,
  | 'upsertJobScheduler'
  | 'getJobScheduler'
  | 'getJobSchedulers'
  | 'getJobSchedulersCount'
  | 'removeJobScheduler'
  | 'waitUntilReady'
  | 'close'
  | 'on'
>;

/** The part of a BullMQ `Worker` this backend calls, all of it public API. */
export type ScheduleWorker = Pick<
  Worker,
  'waitUntilReady' | 'close' | 'cancelAllJobs' | 'on'
>;

export type ScheduleProcessor = (
  job: Job,
  token: string | undefined,
  signal: AbortSignal | undefined,
) => Promise<void>;

/** Creates the BullMQ objects; tests replace them with doubles of the same public API. */
export interface RedisScheduleBackendFactories {
  readonly queue: (
    config: ResolvedRedisScheduleExecutorConfig,
  ) => ScheduleQueue;
  readonly worker: (
    config: ResolvedRedisScheduleExecutorConfig,
    processor: ScheduleProcessor,
  ) => ScheduleWorker;
}

export const defaultRedisFactories: RedisScheduleBackendFactories = {
  queue: (config) =>
    new Queue(config.scope, {
      connection: { ...config.connection },
      prefix: config.namespace,
    }),
  worker: (config, processor) =>
    new Worker(config.scope, processor, {
      connection: { ...config.connection },
      prefix: config.namespace,
      concurrency: config.concurrency,
    }),
};

/**
 * Carries a missing handler through BullMQ as an unrecoverable failure, so the
 * firing fails once instead of being retried.
 */
class HandlerNotRegisteredFailure extends UnrecoverableError {
  public constructor(
    public readonly original: ScheduleHandlerNotRegisteredError,
  ) {
    super(original.message);
  }
}

/**
 * Stores rules as BullMQ job schedulers — the scope is the queue name and the
 * namespace its prefix — and runs them on a BullMQ worker. Everything goes
 * through BullMQ's public API: no Redis client, key layout, script or job id
 * format is relied on.
 */
export class RedisScheduleBackend implements ScheduleBackend {
  public readonly settings: ScheduleExecutionSettings;
  private queue: ScheduleQueue | undefined;
  private worker: ScheduleWorker | undefined;
  private runner: ScheduleRunner | undefined;
  private events: Promise<void> = Promise.resolve();

  public constructor(
    private readonly config: ResolvedRedisScheduleExecutorConfig,
    private readonly logger: ScheduleLogger | undefined,
    private readonly factories: RedisScheduleBackendFactories = defaultRedisFactories,
  ) {
    this.settings = Object.freeze({
      attempts: config.attempts,
      removeOnComplete: config.removeOnComplete,
      removeOnFail: config.removeOnFail,
    });
  }

  public async open(): Promise<void> {
    const queue = this.factories.queue(this.config);
    queue.on('error', (error: Error) => {
      this.logger?.error(
        { error, scope: this.config.scope },
        'The schedule queue reported an error',
      );
    });
    this.queue = queue;
    try {
      await queue.waitUntilReady();
    } catch (error) {
      this.queue = undefined;
      await queue.close().catch(() => undefined);
      throw error;
    }
  }

  public async read(name: string): Promise<StoredScheduleRule | undefined> {
    const scheduler = await this.openQueue().getJobScheduler(name);
    if (!scheduler) return undefined;
    const opts = scheduler.template?.opts ?? {};
    return {
      options: ruleOf(scheduler),
      payload: scheduler.template?.data as unknown,
      settings: {
        attempts: opts.attempts,
        removeOnComplete: opts.removeOnComplete,
        removeOnFail: opts.removeOnFail,
      },
      ...nextOf(scheduler),
    };
  }

  public async write(rule: ScheduleRuleWrite): Promise<Date | undefined> {
    if (hasEnded(rule.options)) {
      // BullMQ refuses an end date in the past. Such a rule has nothing left
      // to fire, so whatever the name held before is removed instead.
      await this.openQueue().removeJobScheduler(rule.name);
      return undefined;
    }
    const job = await this.openQueue().upsertJobScheduler(
      rule.name,
      repeatOptionsOf(rule.options, rule.immediately),
      {
        name: rule.name,
        data: rule.payload,
        opts: { ...rule.settings },
      },
    );
    if (!job) return undefined;
    // The returned job's timestamp and delay come from two clock readings,
    // so their sum can miss the planned time by a millisecond; the
    // scheduler's own `next` is the planned time itself.
    const scheduler = await this.openQueue().getJobScheduler(rule.name);
    const next = scheduler ? nextOf(scheduler).nextRunAt : undefined;
    return next ?? plannedAt(job);
  }

  public remove(name: string): Promise<boolean> {
    return this.openQueue().removeJobScheduler(name);
  }

  public count(): Promise<number> {
    return this.openQueue().getJobSchedulersCount();
  }

  public async list(start: number, end: number): Promise<JobScheduler[]> {
    const schedulers = await this.openQueue().getJobSchedulers(
      start,
      end,
      true,
    );
    return schedulers.map((scheduler) => ({
      jobName: scheduler.key,
      options: ruleOf(scheduler),
      payload: scheduler.template?.data as unknown,
      ...nextOf(scheduler),
    }));
  }

  public async consume(runner: ScheduleRunner): Promise<void> {
    this.runner = runner;
    // BullMQ passes the abort signal only to a processor declaring three parameters.
    const processor: ScheduleProcessor = (job, _token, signal) =>
      this.process(job, signal ?? new AbortController().signal);
    const worker = this.factories.worker(this.config, processor);
    // Local worker events fire on the instance that ran the firing, once per
    // attempt, which is what subscribers count on. QueueEvents would broadcast
    // every firing to every instance.
    worker.on('active', (job: Job) => this.report('ScheduleStart', job));
    worker.on('completed', (job: Job) => this.report('ScheduleEnd', job));
    worker.on('failed', (job: Job | undefined, error: Error) => {
      if (job) this.report('ScheduleError', job, error);
    });
    worker.on('error', (error: Error) => {
      this.logger?.error(
        { error, scope: this.config.scope },
        'The schedule worker reported an error',
      );
    });
    this.worker = worker;
    await worker.waitUntilReady();
  }

  public async close(): Promise<void> {
    const worker = this.worker;
    const queue = this.queue;
    this.worker = undefined;
    this.queue = undefined;
    if (worker) {
      worker.cancelAllJobs('The schedule executor is shutting down.');
      // Waits for running processors before closing the worker's connections.
      await worker.close();
    }
    await this.events;
    this.runner = undefined;
    await queue?.close();
  }

  private async process(job: Job, signal: AbortSignal): Promise<void> {
    const runner = this.runner;
    if (!runner) throw new Error('The schedule executor is not consuming.');
    try {
      await runner.run({
        jobId: String(job.id),
        jobName: job.name,
        scheduledAt: plannedAt(job),
        runAt: new Date(job.processedOn ?? Date.now()),
        ...(await this.nextRunAt(job)),
        signal,
      });
    } catch (error) {
      if (error instanceof ScheduleHandlerNotRegisteredError) {
        throw new HandlerNotRegisteredFailure(error);
      }
      throw error;
    }
  }

  /** Builds events one after another, so they reach subscribers in the order BullMQ emitted them. */
  private report(name: ScheduleEventName, job: Job, error?: Error): void {
    const runner = this.runner;
    if (!runner) return;
    this.events = this.events.then(async () => {
      try {
        const event: ScheduleEvent = {
          name,
          jobId: String(job.id),
          jobName: job.name,
          scheduledAt: plannedAt(job),
          runAt: new Date(job.processedOn ?? Date.now()),
          ...(await this.nextRunAt(job)),
          ...(name === 'ScheduleError'
            ? failureOf(error, runner.hasHandler(job.name))
            : {}),
        };
        runner.emit(event);
      } catch (reportError) {
        this.logger?.error(
          { error: reportError, jobName: job.name, event: name },
          'Failed to report a schedule event',
        );
      }
    });
  }

  /**
   * The firing after `job`. Once a scheduler has spent its `limit`, BullMQ
   * keeps reporting the last planned time as `next`; a `next` that is not
   * after this firing is therefore no further firing at all.
   */
  private async nextRunAt(job: Job): Promise<{ nextRunAt?: Date }> {
    const queue = this.queue;
    if (!queue) return {};
    const scheduler = await queue.getJobScheduler(job.name);
    const next = scheduler ? nextOf(scheduler) : {};
    return next.nextRunAt && next.nextRunAt > plannedAt(job) ? next : {};
  }

  private openQueue(): ScheduleQueue {
    if (!this.queue) throw new Error('The schedule queue is not open.');
    return this.queue;
  }
}

/**
 * When a firing was planned. BullMQ stores the delay among the job's options
 * and zeroes the job's own `delay` once the job leaves the delayed set, so the
 * option is read first.
 */
function plannedAt(job: Job): Date {
  return new Date(job.timestamp + (job.opts?.delay ?? job.delay ?? 0));
}

function hasEnded(rule: ScheduleRule): boolean {
  return rule.endDate !== undefined && rule.endDate.getTime() <= Date.now();
}

function failureOf(
  error: Error | undefined,
  handlerRegistered: boolean,
): Pick<ScheduleEvent, 'reason' | 'error'> {
  if (error instanceof HandlerNotRegisteredFailure) {
    return { reason: 'handler-not-registered', error: error.original };
  }
  return {
    reason: handlerRegistered ? 'execute-failed' : 'handler-not-registered',
    ...(error ? { error } : {}),
  };
}

function repeatOptionsOf(
  rule: ScheduleRule,
  immediately: boolean,
): Omit<RepeatOptions, 'key'> {
  return {
    ...(rule.cron !== undefined
      ? // An omitted time zone means UTC, not the host's local time.
        { pattern: rule.cron, tz: rule.tz ?? 'UTC' }
      : {}),
    ...(rule.every !== undefined ? { every: rule.every } : {}),
    ...(rule.cron === undefined && rule.tz !== undefined
      ? { tz: rule.tz }
      : {}),
    ...(rule.limit !== undefined ? { limit: rule.limit } : {}),
    ...(rule.startDate ? { startDate: rule.startDate } : {}),
    ...(rule.endDate ? { endDate: rule.endDate } : {}),
    ...(immediately ? { immediately: true } : {}),
  };
}

function ruleOf(scheduler: JobSchedulerJson): ScheduleRule {
  return {
    ...(scheduler.pattern !== undefined ? { cron: scheduler.pattern } : {}),
    ...(scheduler.every !== undefined ? { every: scheduler.every } : {}),
    ...(scheduler.limit !== undefined ? { limit: scheduler.limit } : {}),
    ...(scheduler.tz !== undefined ? { tz: scheduler.tz } : {}),
    ...(scheduler.startDate !== undefined
      ? { startDate: new Date(scheduler.startDate) }
      : {}),
    ...(scheduler.endDate !== undefined
      ? { endDate: new Date(scheduler.endDate) }
      : {}),
  };
}

function nextOf(scheduler: JobSchedulerJson): { nextRunAt?: Date } {
  return typeof scheduler.next === 'number' && Number.isFinite(scheduler.next)
    ? { nextRunAt: new Date(scheduler.next) }
    : {};
}
