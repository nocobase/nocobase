import { sameRule, stableStringify } from './rules.js';
import {
  ScheduleReceiptCode,
  type JobScheduler,
  type ScheduleEvent,
  type ScheduleExecutionContext,
  type ScheduleExecutor,
  type ScheduleJob,
  type ScheduleReceipt,
  type ScheduleSetupOptions,
  type Subscriber,
} from './types.js';
import type { JobsLogger, Unsubscribe } from '../types.js';
import {
  assertValidJobName,
  normalizeScheduleJob,
  type NormalizedScheduleJob,
  type ScheduleRule,
} from './validation.js';

/** Raised for a firing whose job has no handler on the executing instance. */
export class ScheduleHandlerNotRegisteredError extends Error {
  public readonly jobName: string;

  public constructor(jobName: string) {
    super(
      `No handler is registered for schedule job "${jobName}" on this instance.`,
    );
    this.name = 'ScheduleHandlerNotRegisteredError';
    this.jobName = jobName;
  }
}

/** Execution settings stored with a rule, such as `attempts`. */
export type ScheduleExecutionSettings = Readonly<Record<string, unknown>>;

/** A rule as a backend holds it. */
export interface StoredScheduleRule {
  readonly options: ScheduleRule;
  readonly payload: unknown;
  readonly settings: ScheduleExecutionSettings;
  readonly nextRunAt?: Date;
}

export interface ScheduleRuleWrite {
  readonly name: string;
  readonly options: ScheduleRule;
  readonly payload: unknown;
  readonly settings: ScheduleExecutionSettings;
  /** Only ever set when the backend holds no rule of this name. */
  readonly immediately: boolean;
}

/** One firing about to run a handler. */
export interface ScheduleRun {
  readonly jobId: string;
  readonly jobName: string;
  readonly scheduledAt: Date;
  readonly runAt: Date;
  readonly nextRunAt?: Date;
  readonly signal: AbortSignal;
}

/** What a backend calls back into while consuming. */
export interface ScheduleRunner {
  /** Runs the registered handler; rejects with {@link ScheduleHandlerNotRegisteredError} when there is none. */
  run(run: ScheduleRun): Promise<void>;
  hasHandler(jobName: string): boolean;
  /** Delivers an event to this executor's subscribers, in emission order. */
  emit(event: ScheduleEvent): void;
}

/**
 * The storage and execution half of an executor. The shared executor keeps
 * handlers, subscribers, validation and the comparison that skips unchanged
 * writes; a backend only reads, writes and fires rules.
 */
export interface ScheduleBackend {
  /** Settings this executor writes with every rule and compares on the next write. */
  readonly settings: ScheduleExecutionSettings;
  open(): Promise<void>;
  read(name: string): Promise<StoredScheduleRule | undefined>;
  /** Writes a rule, replacing any other of the name, and returns its next planned firing. */
  write(rule: ScheduleRuleWrite): Promise<Date | undefined>;
  remove(name: string): Promise<boolean>;
  count(): Promise<number>;
  list(start: number, end: number): Promise<JobScheduler[]>;
  consume(runner: ScheduleRunner): Promise<void>;
  /** Stops consuming, aborts and awaits running handlers, and releases resources. */
  close(): Promise<void>;
}

type ExecutorState = 'created' | 'setting-up' | 'ready' | 'closed';

interface PendingJob {
  readonly job: NormalizedScheduleJob;
  readonly payload: unknown;
}

const upserted = (jobName: string, scheduledAt?: Date): ScheduleReceipt => ({
  jobName,
  code: ScheduleReceiptCode.Upserted,
  message: 'Job upserted',
  ...(scheduledAt ? { scheduledAt } : {}),
});

export class BackendScheduleExecutor implements ScheduleExecutor {
  private state: ExecutorState = 'created';
  private readonly handlers = new Map<string, ScheduleJob>();
  private readonly pending = new Map<string, PendingJob>();
  private readonly subscribers = new Set<Subscriber>();
  private delivery: Promise<void> = Promise.resolve();
  private setupPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;
  private opened = false;

  public constructor(
    private readonly backend: ScheduleBackend,
    private readonly logger: JobsLogger | undefined,
  ) {}

  public async addJob<TPayload = unknown>(
    job: ScheduleJob<TPayload>,
    registerOnly: boolean = false,
  ): Promise<ScheduleReceipt> {
    this.assertOpen();
    const normalized = normalizeScheduleJob(job);
    this.handlers.set(normalized.name, job);
    if (registerOnly) {
      this.pending.delete(normalized.name);
      return {
        jobName: normalized.name,
        code: ScheduleReceiptCode.HandlerRegistered,
        message: 'Handler registered',
      };
    }
    if (this.state === 'created') {
      // Nothing is written before setup(): the rule is written there, before
      // any worker starts, so a due firing never meets a missing handler.
      this.pending.set(normalized.name, {
        job: normalized,
        payload: job.payload,
      });
      return upserted(normalized.name);
    }
    if (this.state === 'setting-up') await this.setupPromise;
    this.assertOpen();
    return this.upsert(normalized, job.payload);
  }

  public async removeJob(name: string): Promise<ScheduleReceipt> {
    assertValidJobName(name);
    await this.whenReady('removeJob');
    // The handler stays registered: another instance may add the job again,
    // and this instance must still be able to run it when it does.
    return (await this.backend.remove(name))
      ? {
          jobName: name,
          code: ScheduleReceiptCode.Removed,
          message: 'Job removed',
        }
      : {
          jobName: name,
          code: ScheduleReceiptCode.NotExisted,
          message: 'Job not existed',
        };
  }

  public async countJob(): Promise<number> {
    await this.whenReady('countJob');
    return this.backend.count();
  }

  public async listJob(start: number, end: number): Promise<JobScheduler[]> {
    await this.whenReady('listJob');
    return this.backend.list(start, end);
  }

  public async getJob(name: string): Promise<JobScheduler | undefined> {
    assertValidJobName(name);
    await this.whenReady('getJob');
    const stored = await this.backend.read(name);
    return stored
      ? {
          jobName: name,
          options: stored.options,
          payload: stored.payload,
          ...(stored.nextRunAt ? { nextRunAt: stored.nextRunAt } : {}),
        }
      : undefined;
  }

  public subscribe(subscriber: Subscriber): Unsubscribe {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public setup(options: ScheduleSetupOptions = {}): Promise<void> {
    this.assertOpen();
    this.setupPromise ??= this.runSetup(options.consume ?? true);
    return this.setupPromise;
  }

  public shutdown(): Promise<void> {
    this.shutdownPromise ??= this.runShutdown();
    return this.shutdownPromise;
  }

  private async runSetup(consume: boolean): Promise<void> {
    this.state = 'setting-up';
    try {
      await this.backend.open();
      this.opened = true;
      for (const { job, payload } of this.pending.values()) {
        await this.upsert(job, payload);
      }
      this.pending.clear();
      if (consume) await this.backend.consume(this.runner);
      // shutdown() may have been called while this ran; it closes what was opened.
      if (this.state === 'setting-up') this.state = 'ready';
    } catch (error) {
      // A failed setup releases what it acquired and may be retried.
      if (this.state === 'setting-up') {
        this.setupPromise = undefined;
        this.state = 'created';
      }
      if (this.opened) {
        this.opened = false;
        await this.backend.close().catch((closeError: unknown) => {
          this.logger?.error(
            { error: closeError },
            'Failed to release schedule resources after a failed setup',
          );
        });
      }
      throw error;
    }
  }

  private async runShutdown(): Promise<void> {
    const setup = this.setupPromise;
    this.state = 'closed';
    if (setup) await setup.catch(() => undefined);
    if (this.opened) {
      this.opened = false;
      await this.backend.close();
    }
    this.pending.clear();
    this.handlers.clear();
    await this.delivery;
    this.subscribers.clear();
  }

  private async upsert(
    job: NormalizedScheduleJob,
    payload: unknown,
  ): Promise<ScheduleReceipt> {
    const existing = await this.backend.read(job.name);
    if (existing && this.unchanged(existing, job, payload)) {
      // An upsert would drop the firing already planned (even one that is due
      // and waiting), restart `limit` and fire `immediately` again.
      return upserted(job.name, existing.nextRunAt);
    }
    const scheduledAt = await this.backend.write({
      name: job.name,
      options: job.options,
      payload,
      settings: this.backend.settings,
      immediately: job.immediately && !existing,
    });
    return upserted(job.name, scheduledAt);
  }

  private unchanged(
    existing: StoredScheduleRule,
    job: NormalizedScheduleJob,
    payload: unknown,
  ): boolean {
    return (
      sameRule(existing.options, job.options) &&
      stableStringify(existing.payload) === stableStringify(payload) &&
      stableStringify(existing.settings) ===
        stableStringify(this.backend.settings)
    );
  }

  private async whenReady(operation: string): Promise<void> {
    this.assertOpen();
    if (this.state === 'setting-up') await this.setupPromise;
    if (this.state !== 'ready') {
      throw new Error(
        `Call setup() before ${operation}(): the schedule backend is not open yet.`,
      );
    }
  }

  private assertOpen(): void {
    if (this.state === 'closed') {
      throw new Error('The schedule executor has been shut down.');
    }
  }

  private readonly runner: ScheduleRunner = {
    run: async (run) => {
      const handler = this.handlers.get(run.jobName);
      if (!handler) throw new ScheduleHandlerNotRegisteredError(run.jobName);
      const context: ScheduleExecutionContext = {
        jobId: run.jobId,
        scheduledAt: run.scheduledAt,
        runAt: run.runAt,
        ...(run.nextRunAt ? { nextRunAt: run.nextRunAt } : {}),
        signal: run.signal,
      };
      await handler.execute(context);
    },
    hasHandler: (jobName) => this.handlers.has(jobName),
    emit: (event) => {
      const subscribers = [...this.subscribers];
      this.delivery = this.delivery.then(async () => {
        for (const subscriber of subscribers) {
          try {
            await subscriber(event);
          } catch (error) {
            this.logger?.error(
              { error, event: event.name, jobName: event.jobName },
              'A schedule event subscriber failed',
            );
          }
        }
      });
    },
  };
}
