import type { RealtimeUserTopic } from '@nocobase/app-server/realtime';
import type { JobEvent, JobExecutor } from '@nocobase/jobs';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import { JOBS_EXAMPLE_SCOPE } from '../scope.js';
import { ProgressJob } from './progress-job.js';

/** Pushes each changed task to the user who created it, and only to them. */
export const JOB_TASKS_TOPIC: string = 'jobs-example:tasks';

/** The tasks kept per user for the page; older ones are dropped. */
const MAX_TASKS = 20;

export type JobTaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface JobTask {
  readonly jobId: string;
  readonly status: JobTaskStatus;
  /** 0 to 100, as the latest attempt reported it. */
  readonly progress: number;
  /** The latest execution start this instance observed; 0 before the first. */
  readonly attempt: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reason?: string;
}

export interface JobExampleStatus {
  readonly scope: string;
  readonly job: string;
  readonly tasks: readonly JobTask[];
}

export interface JobExampleService {
  /** Submits one task for `userId` and returns once the backend accepted it. */
  create(userId: string): Promise<JobTask>;
  /** Updates a task from the executor's events and pushes the change. */
  record(event: JobEvent): void;
  status(userId: string): JobExampleStatus;
}

interface OwnedTask {
  readonly userId: string;
  task: JobTask;
}

export class DefaultJobExampleService implements JobExampleService {
  // Records live in memory: they are this example's view of its tasks, so a
  // restart clears them while the jobs service still recovers pending tasks.
  private readonly tasks = new Map<string, OwnedTask>();
  // Events that arrive before the receipt names the task's owner.
  private readonly early = new Map<string, JobEvent[]>();

  public constructor(
    private readonly executor: () => JobExecutor | undefined,
    private readonly topic: () => RealtimeUserTopic<JobTask> | undefined,
  ) {}

  public async create(userId: string): Promise<JobTask> {
    const executor = this.executor();
    if (!executor) throw new Error('The jobs example has not started.');
    const receipt = await executor.addJob(new ProgressJob({}));
    const createdAt = receipt.enqueuedAt.toISOString();
    const owned: OwnedTask = {
      userId,
      task: {
        jobId: receipt.jobId,
        status: 'queued',
        progress: 0,
        attempt: 0,
        createdAt,
        updatedAt: createdAt,
      },
    };
    this.tasks.set(receipt.jobId, owned);
    this.prune(userId);
    // A fast backend can start the task before `addJob` resolves.
    for (const event of this.early.get(receipt.jobId) ?? [])
      owned.task = next(owned.task, event);
    this.early.delete(receipt.jobId);
    this.publish(owned);
    return owned.task;
  }

  public record(event: JobEvent): void {
    if (event.jobName !== ProgressJob.jobName) return;
    const owned = this.tasks.get(event.jobId);
    if (!owned) {
      // Kept only briefly: a task recovered after a restart has no owner left
      // to show it to, so its events are dropped once they pile up.
      const events = this.early.get(event.jobId) ?? [];
      events.push(event);
      this.early.set(event.jobId, events);
      if (this.early.size > MAX_TASKS)
        this.early.delete(this.early.keys().next().value!);
      return;
    }
    owned.task = next(owned.task, event);
    this.publish(owned);
  }

  public status(userId: string): JobExampleStatus {
    return {
      scope: JOBS_EXAMPLE_SCOPE,
      job: ProgressJob.jobName,
      tasks: this.owned(userId).map((owned) => owned.task),
    };
  }

  /** Newest first. */
  private owned(userId: string): OwnedTask[] {
    return [...this.tasks.values()]
      .filter((owned) => owned.userId === userId)
      .reverse();
  }

  private prune(userId: string): void {
    for (const owned of this.owned(userId).slice(MAX_TASKS))
      this.tasks.delete(owned.task.jobId);
  }

  private publish(owned: OwnedTask): void {
    this.topic()?.publishFor(owned.userId, owned.task);
  }
}

function next(task: JobTask, event: JobEvent): JobTask {
  const { reason: _previousReason, ...rest } = task;
  const base = {
    ...rest,
    attempt: event.attempt,
    updatedAt: new Date().toISOString(),
  };
  switch (event.name) {
    case 'JobStart':
      // Every start, a retry included, works through the steps again.
      return { ...base, status: 'running', progress: 0 };
    case 'JobProgress':
      return { ...base, status: 'running', progress: event.progress };
    case 'JobEnd':
      return { ...base, status: 'completed', progress: 100 };
    case 'JobError':
      return {
        ...base,
        // An interrupted attempt goes back to waiting and runs again.
        status: event.reason === 'interrupted' ? 'queued' : 'failed',
        reason: event.reason,
      };
  }
}

export const jobExampleServiceToken: ServiceToken<JobExampleService> =
  createServiceToken<JobExampleService>(
    '@nocobase/app-plugin-jobs-example/job',
  );
