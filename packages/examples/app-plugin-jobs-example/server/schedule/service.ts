import type { RealtimePublicTopic } from '@nocobase/app-server/realtime';
import type {
  ScheduleEvent,
  ScheduleExecutor,
  ScheduleJob,
  ScheduleJobOption,
} from '@nocobase/jobs';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import { JOBS_EXAMPLE_SCOPE } from '../scope.js';

/**
 * Tells open pages that a rule changed. It carries no data — rules are shared
 * by the whole application, so the page reloads them through the
 * authenticated route and an anonymous subscriber learns nothing.
 */
export const SCHEDULE_CHANGES_TOPIC: string = 'jobs-example:schedules';

export const HEARTBEAT_JOB: string = 'heartbeat';
export const HEARTBEAT_INTERVAL: number = 60_000;

/** The intervals the `interval` rule may switch between. */
export const INTERVAL_CHOICES: readonly number[] = [5_000, 10_000, 30_000];

export interface ScheduleSlot {
  readonly name: string;
  /** Written on every start and never stopped from the page. */
  readonly builtIn: boolean;
  readonly options: ScheduleJobOption;
}

/**
 * Every rule this plugin can ever hold. The set is fixed in code on purpose:
 * each handler has to be registered before `setup()` starts consuming, so a
 * rule a user started before a restart still finds its handler after it.
 */
export const SCHEDULE_SLOTS: readonly ScheduleSlot[] = [
  {
    name: HEARTBEAT_JOB,
    builtIn: true,
    options: { every: HEARTBEAT_INTERVAL },
  },
  { name: 'interval', builtIn: false, options: { every: 5_000 } },
  { name: 'limited', builtIn: false, options: { every: 3_000, limit: 5 } },
  { name: 'cron', builtIn: false, options: { cron: '* * * * *' } },
];

/** The runs kept per rule for the page; older ones are dropped. */
const MAX_RUNS = 10;

export interface ScheduleRun {
  readonly jobId: string;
  readonly scheduledAt: string;
  readonly runAt: string;
  readonly outcome: 'running' | 'succeeded' | 'failed';
  readonly reason?: string;
}

export type ScheduleRuleState = 'active' | 'ended' | 'stopped';

export interface ScheduleRuleView {
  readonly name: string;
  readonly builtIn: boolean;
  /** What the backend holds, or the slot's defaults while it is stopped. */
  readonly options: {
    readonly every?: number;
    readonly cron?: string;
    readonly limit?: number;
  };
  /** Active has a next firing; ended is a rule whose limit is spent. */
  readonly state: ScheduleRuleState;
  readonly nextRunAt?: string;
  /** Firings this instance ran since it started. */
  readonly firings: number;
  readonly runs: readonly ScheduleRun[];
}

export interface ScheduleExampleStatus {
  readonly scope: string;
  readonly rules: readonly ScheduleRuleView[];
}

export class ScheduleExampleError extends Error {
  public constructor(
    public readonly code: 'UNKNOWN_RULE' | 'BUILT_IN_RULE' | 'INVALID_INTERVAL',
    message: string,
  ) {
    super(message);
    this.name = 'ScheduleExampleError';
  }
}

export interface ScheduleExampleService {
  /** The executor job of a slot, with other options when it was changed. */
  job(name: string, options?: ScheduleJobOption): ScheduleJob;
  /** Writes a slot's rule; `every` switches the `interval` rule's interval. */
  startRule(name: string, every?: number): Promise<void>;
  /** Removes a slot's rule for every instance. */
  stopRule(name: string): Promise<void>;
  /** Records how a firing on this instance went, from the executor's events. */
  record(event: ScheduleEvent): void;
  status(): Promise<ScheduleExampleStatus>;
}

interface RuleHistory {
  firings: number;
  readonly runs: ScheduleRun[];
}

export class DefaultScheduleExampleService implements ScheduleExampleService {
  private readonly history = new Map<string, RuleHistory>(
    SCHEDULE_SLOTS.map((slot) => [slot.name, { firings: 0, runs: [] }]),
  );

  public constructor(
    private readonly executor: () => ScheduleExecutor | undefined,
    private readonly topic: () =>
      RealtimePublicTopic<{ readonly name: string }> | undefined,
  ) {}

  public job(name: string, options?: ScheduleJobOption): ScheduleJob {
    const slot = slotOf(name);
    return {
      name: slot.name,
      options: options ?? slot.options,
      payload: { rule: slot.name },
      // A schedule handler is a closure, unlike a JobExecutor job: it may use
      // this service directly. Keep it thin and key real work by `jobId`.
      execute: async ({ jobId, scheduledAt, runAt }) => {
        this.upsertRun(slot.name, jobId, scheduledAt, runAt, {});
        return Promise.resolve();
      },
    };
  }

  public async startRule(name: string, every?: number): Promise<void> {
    const slot = slotOf(name);
    if (slot.builtIn)
      throw new ScheduleExampleError(
        'BUILT_IN_RULE',
        `Rule "${name}" is built in and always runs.`,
      );
    if (
      every !== undefined &&
      !(slot.name === 'interval' && INTERVAL_CHOICES.includes(every))
    )
      throw new ScheduleExampleError(
        'INVALID_INTERVAL',
        `Rule "${name}" does not accept an interval of ${every} ms.`,
      );
    // An unchanged rule is left as it is; a changed interval rewrites it and
    // plans the next firing from the new one.
    await this.ready().addJob(
      this.job(slot.name, every === undefined ? undefined : { every }),
    );
    this.publish(slot.name);
  }

  public async stopRule(name: string): Promise<void> {
    const slot = slotOf(name);
    if (slot.builtIn)
      throw new ScheduleExampleError(
        'BUILT_IN_RULE',
        `Rule "${name}" is built in and always runs.`,
      );
    // The handler stays registered, so a firing already claimed still runs.
    await this.ready().removeJob(slot.name);
    this.publish(slot.name);
  }

  public record(event: ScheduleEvent): void {
    if (!this.history.has(event.jobName)) return;
    // Each attempt of a firing starts again; one firing keeps one entry.
    this.upsertRun(
      event.jobName,
      event.jobId,
      event.scheduledAt,
      event.runAt,
      event.name === 'ScheduleStart'
        ? {}
        : event.name === 'ScheduleEnd'
          ? { outcome: 'succeeded' }
          : {
              outcome: 'failed',
              ...(event.reason ? { reason: event.reason } : {}),
            },
    );
    this.publish(event.jobName);
  }

  public async status(): Promise<ScheduleExampleStatus> {
    const executor = this.executor();
    const rules = await Promise.all(
      SCHEDULE_SLOTS.map(async (slot): Promise<ScheduleRuleView> => {
        const stored = await executor?.getJob(slot.name);
        const options = stored?.options ?? slot.options;
        const history = this.history.get(slot.name)!;
        return {
          name: slot.name,
          builtIn: slot.builtIn,
          options: {
            ...(options.every !== undefined ? { every: options.every } : {}),
            ...(options.cron !== undefined ? { cron: options.cron } : {}),
            ...(options.limit !== undefined ? { limit: options.limit } : {}),
          },
          state: !stored ? 'stopped' : stored.nextRunAt ? 'active' : 'ended',
          ...(stored?.nextRunAt
            ? { nextRunAt: stored.nextRunAt.toISOString() }
            : {}),
          firings: history.firings,
          runs: [...history.runs],
        };
      }),
    );
    return { scope: JOBS_EXAMPLE_SCOPE, rules };
  }

  private ready(): ScheduleExecutor {
    const executor = this.executor();
    if (!executor) throw new Error('The jobs example has not started.');
    return executor;
  }

  private publish(name: string): void {
    this.topic()?.publish({ name });
  }

  private upsertRun(
    name: string,
    jobId: string,
    scheduledAt: Date,
    runAt: Date,
    change: Partial<ScheduleRun>,
  ): void {
    const history = this.history.get(name)!;
    const index = history.runs.findIndex((run) => run.jobId === jobId);
    if (index >= 0) {
      history.runs[index] = { ...history.runs[index], ...change };
      return;
    }
    history.firings += 1;
    history.runs.unshift({
      jobId,
      scheduledAt: scheduledAt.toISOString(),
      runAt: runAt.toISOString(),
      outcome: 'running',
      ...change,
    });
    history.runs.splice(MAX_RUNS);
  }
}

function slotOf(name: string): ScheduleSlot {
  const slot = SCHEDULE_SLOTS.find((candidate) => candidate.name === name);
  if (!slot)
    throw new ScheduleExampleError('UNKNOWN_RULE', `Unknown rule "${name}".`);
  return slot;
}

export const scheduleExampleServiceToken: ServiceToken<ScheduleExampleService> =
  createServiceToken<ScheduleExampleService>(
    '@nocobase/app-plugin-jobs-example/schedule',
  );
