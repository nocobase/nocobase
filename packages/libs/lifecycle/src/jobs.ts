import {
  Job,
  type JobClass,
  type JobExecutionContext,
  type JobExecutor,
  type ScheduleExecutor,
} from '@nocobase/jobs';

import type {
  EffectDispatcher,
  LifecycleLogger,
  LifecycleRuntime,
} from './runtime.js';

/** What the effect job carries: the run's state lives in the store. */
export interface EffectJobPayload {
  readonly effectRunId: string;
}

export interface LifecycleJobsOptions {
  /** The executor effects run on, such as `executors.getJobExecutor(scope)`. */
  readonly jobs: JobExecutor;
  /** The executor the sweep runs on, such as `executors.getScheduleExecutor(scope)`. */
  readonly schedule: ScheduleExecutor;
  /** Stored with every queued task, so keep it stable: `<package>/effect`, say. */
  readonly jobName: string;
  /** The sweep rule's name within its scope. Defaults to `lifecycle-sweep`. */
  readonly sweepName?: string;
  /** How often triggers are swept and expired attempts taken back. Defaults to a minute. */
  readonly sweepEveryMs?: number;
  /** Work each sweep does after the triggers, such as pruning finished runs. */
  readonly onSweep?: () => Promise<void>;
  readonly logger?: LifecycleLogger;
  /** The runtime's clock, so a backoff is measured on the same time. */
  readonly clock?: () => Date;
}

/**
 * The runtime's dispatcher when effects run on `@nocobase/jobs`. Pass it to
 * `new LifecycleRuntime({ dispatcher })`, then `start(runtime)` once the
 * lifecycles are registered and `shutdown()` with the application.
 */
export interface LifecycleJobs extends EffectDispatcher {
  /**
   * Registers the effect job, opens both executors, schedules the sweep and
   * runs `runtime.recover()`, so what an earlier process left queued runs.
   */
  start(runtime: LifecycleRuntime): Promise<void>;
  shutdown(): Promise<void>;
}

const silent: LifecycleLogger = { warn: () => {}, error: () => {} };

class JobsEffectDispatcher implements LifecycleJobs {
  private runtime: LifecycleRuntime | undefined;
  private effectJob: JobClass<EffectJobPayload> | undefined;
  private open = false;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly logger: LifecycleLogger;

  public constructor(private readonly options: LifecycleJobsOptions) {
    this.logger = options.logger ?? silent;
  }

  public async start(runtime: LifecycleRuntime): Promise<void> {
    if (this.runtime)
      throw new Error('The lifecycle jobs have already started.');
    this.runtime = runtime;
    const { jobs, schedule, jobName } = this.options;
    const effectJob = class LifecycleEffectJob extends Job<EffectJobPayload> {
      public static readonly jobName: string = jobName;

      public async execute({ signal }: JobExecutionContext): Promise<void> {
        await runtime.runEffect(this.payload.effectRunId, signal);
      }
    };
    this.effectJob = effectJob;
    // Registered before setup(): a run queued by an earlier process must find it.
    jobs.registerJob(effectJob);
    await jobs.setup();
    await schedule.addJob({
      name: this.options.sweepName ?? 'lifecycle-sweep',
      options: { every: this.options.sweepEveryMs ?? 60_000 },
      payload: {},
      execute: () => this.sweep(runtime),
    });
    await schedule.setup();
    this.open = true;
    await runtime.recover();
  }

  public async shutdown(): Promise<void> {
    this.open = false;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    await this.options.schedule.shutdown();
    await this.options.jobs.shutdown();
    this.runtime = undefined;
    this.effectJob = undefined;
  }

  /**
   * The JobExecutor has no delay, so a retry with backoff waits here first.
   * A process that stops while it waits loses only the timer: the run is
   * still queued, and `recover()` hands it over on the next start.
   */
  public async dispatch(
    runId: string,
    { runAfter }: { readonly runAfter: string | null },
  ): Promise<void> {
    const delay =
      runAfter === null
        ? 0
        : Date.parse(runAfter) -
          (this.options.clock ?? (() => new Date()))().getTime();
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.dispatch(runId, { runAfter: null }).catch((error: unknown) => {
          this.logger.error(
            `Effect run "${runId}" could not be dispatched after its backoff; reclaim() or recover() will hand it over.`,
            { error },
          );
        });
      }, delay);
      timer.unref();
      this.timers.add(timer);
      return;
    }
    const EffectJob = this.effectJob;
    if (!this.open || !EffectJob)
      throw new Error(
        'The lifecycle jobs have not started; recover() hands the run over once they have.',
      );
    await this.options.jobs.addJob(new EffectJob({ effectRunId: runId }));
  }

  /** Expired attempts first, so a run stuck in `running` is back before the triggers need it. */
  private async sweep(runtime: LifecycleRuntime): Promise<void> {
    const failures: unknown[] = [];
    const steps: (() => Promise<unknown>)[] = [
      () => runtime.reclaim(),
      () => runtime.runTriggers(),
      ...(this.options.onSweep ? [this.options.onSweep] : []),
    ];
    for (const step of steps)
      try {
        await step();
      } catch (error) {
        failures.push(error);
      }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1)
      throw new AggregateError(
        failures,
        `${failures.length} sweep steps failed.`,
      );
  }
}

/**
 * Runs a runtime's effects as jobs and its sweep as a schedule rule on the
 * application's jobs service. Effects are retried with their backoff through
 * an in-process timer, runs nobody is working on are reclaimed on every sweep, and a
 * start recovers what the previous process left queued.
 */
export function createLifecycleJobs(
  options: LifecycleJobsOptions,
): LifecycleJobs {
  return new JobsEffectDispatcher(options);
}
