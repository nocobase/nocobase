import type {
  ScheduleEvent,
  ScheduleExecutor,
  ScheduleJob,
} from '@nocobase/jobs';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

/** The plugin's scope on the schedule service: its package name, and its alone. */
export const SCHEDULE_EXAMPLE_SCOPE: string =
  '@nocobase/app-plugin-schedule-example';
export const HEARTBEAT_JOB: string = 'heartbeat';
export const HEARTBEAT_INTERVAL: number = 60_000;

/** The runs kept for the status route; older ones are dropped. */
const MAX_RUNS = 20;

export interface HeartbeatPayload {
  readonly message: string;
}

export interface HeartbeatRun {
  readonly jobId: string;
  readonly scheduledAt: string;
  readonly runAt: string;
  readonly outcome: 'running' | 'succeeded' | 'failed';
  readonly message?: string;
  readonly reason?: string;
}

export interface ScheduleExampleStatus {
  readonly scope: string;
  readonly job: string;
  readonly every: number;
  readonly nextRunAt?: string;
  readonly runs: readonly HeartbeatRun[];
}

export interface ScheduleExampleService {
  /** The job the provider registers. Its handler is the work each firing does. */
  heartbeatJob(): ScheduleJob<HeartbeatPayload>;
  /** Records how a firing on this instance went, from the executor's events. */
  record(event: ScheduleEvent): void;
  status(): Promise<ScheduleExampleStatus>;
}

export class DefaultScheduleExampleService implements ScheduleExampleService {
  private readonly runs: HeartbeatRun[] = [];

  public constructor(
    private readonly executor: () => ScheduleExecutor | undefined,
  ) {}

  public heartbeatJob(): ScheduleJob<HeartbeatPayload> {
    const payload: HeartbeatPayload = {
      message: 'Heartbeat from the Schedule example plugin',
    };
    return {
      name: HEARTBEAT_JOB,
      options: { every: HEARTBEAT_INTERVAL },
      payload,
      // Keep a handler thin: real work belongs in a service it calls, and
      // `jobId` is the key that makes that work safe to repeat.
      execute: async ({ jobId, scheduledAt, runAt }) => {
        // Events are delivered after the fact, so the handler records from
        // its own context rather than counting on ScheduleStart to be in.
        this.upsert(jobId, scheduledAt, runAt, { message: payload.message });
        return Promise.resolve();
      },
    };
  }

  public record(event: ScheduleEvent): void {
    if (event.jobName !== HEARTBEAT_JOB) return;
    // Each attempt of a firing starts again; one firing keeps one entry.
    this.upsert(
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
  }

  public async status(): Promise<ScheduleExampleStatus> {
    const rule = await this.executor()?.getJob(HEARTBEAT_JOB);
    return {
      scope: SCHEDULE_EXAMPLE_SCOPE,
      job: HEARTBEAT_JOB,
      every: HEARTBEAT_INTERVAL,
      ...(rule?.nextRunAt ? { nextRunAt: rule.nextRunAt.toISOString() } : {}),
      runs: [...this.runs],
    };
  }

  private upsert(
    jobId: string,
    scheduledAt: Date,
    runAt: Date,
    change: Partial<HeartbeatRun>,
  ): void {
    const index = this.runs.findIndex((run) => run.jobId === jobId);
    if (index >= 0) {
      this.runs[index] = { ...this.runs[index], ...change };
      return;
    }
    this.runs.unshift({
      jobId,
      scheduledAt: scheduledAt.toISOString(),
      runAt: runAt.toISOString(),
      outcome: 'running',
      ...change,
    });
    this.runs.splice(MAX_RUNS);
  }
}

export const scheduleExampleServiceToken: ServiceToken<ScheduleExampleService> =
  createServiceToken<ScheduleExampleService>(
    '@nocobase/app-plugin-schedule-example/service',
  );
