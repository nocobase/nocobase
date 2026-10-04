import type { ApiClient } from '@nocobase/app-client';

export type JobTaskStatus = 'queued' | 'running' | 'completed' | 'failed';

/** Mirrors the server's `JobTask`: the client does not import server code. */
export interface JobTask {
  readonly jobId: string;
  readonly status: JobTaskStatus;
  readonly progress: number;
  readonly attempt: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reason?: string;
}

/** The realtime topic that pushes the signed-in user's task changes. */
export const JOB_TASKS_TOPIC: string = 'jobs-example:tasks';

const path = 'jobsExample/tasks';

export async function listJobTasks(
  api: ApiClient,
): Promise<readonly JobTask[]> {
  return (await api.request<{ data: readonly JobTask[] }>({ path })).data;
}

export async function createJobTask(api: ApiClient): Promise<JobTask> {
  return (await api.request<{ data: JobTask }>({ method: 'POST', path })).data;
}

/** Keeps the newer of two versions of one task, newest task first. */
export function mergeJobTask(
  tasks: readonly JobTask[],
  task: JobTask,
): readonly JobTask[] {
  const current = tasks.find((item) => item.jobId === task.jobId);
  if (!current)
    return [task, ...tasks].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  // A push and a response can arrive in either order; the later write wins.
  if (current.updatedAt > task.updatedAt) return tasks;
  return tasks.map((item) => (item.jobId === task.jobId ? task : item));
}

export function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export type ScheduleRuleState = 'active' | 'ended' | 'stopped';

export interface ScheduleRun {
  readonly jobId: string;
  readonly scheduledAt: string;
  readonly runAt: string;
  readonly outcome: 'running' | 'succeeded' | 'failed';
  readonly reason?: string;
}

/** Mirrors the server's `ScheduleRuleView`. */
export interface ScheduleRule {
  readonly name: string;
  readonly builtIn: boolean;
  readonly options: {
    readonly every?: number;
    readonly cron?: string;
    readonly limit?: number;
  };
  readonly state: ScheduleRuleState;
  readonly nextRunAt?: string;
  readonly firings: number;
  readonly runs: readonly ScheduleRun[];
}

/** Carries only the changed rule's name; the page reloads the rules. */
export const SCHEDULE_CHANGES_TOPIC: string = 'jobs-example:schedules';

/** The intervals the `interval` rule may switch between. */
export const INTERVAL_CHOICES: readonly number[] = [5_000, 10_000, 30_000];

const rulesPath = 'jobsExample/rules';

export async function listScheduleRules(
  api: ApiClient,
): Promise<readonly ScheduleRule[]> {
  return (
    await api.request<{ data: readonly ScheduleRule[] }>({ path: rulesPath })
  ).data;
}

export async function startScheduleRule(
  api: ApiClient,
  name: string,
  every?: number,
): Promise<void> {
  await api.request({
    method: 'POST',
    path: `${rulesPath}/${encodeURIComponent(name)}/start`,
    ...(every === undefined ? {} : { json: { every } }),
  });
}

export async function stopScheduleRule(
  api: ApiClient,
  name: string,
): Promise<void> {
  await api.request({
    method: 'POST',
    path: `${rulesPath}/${encodeURIComponent(name)}/stop`,
  });
}
