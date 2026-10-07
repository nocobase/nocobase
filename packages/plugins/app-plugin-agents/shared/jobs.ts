/**
 * Jobs as the browser, the admin API and the application exchange them. A job is a deterministic step a runner
 * executes without a model (`@nocobase/agent-protocol`'s `jobs.ts`): a build. It is not a run: no agent,
 * no brief, and it never wakes one.
 */
import type {
  JobEventType,
  JobFailureReason,
  JobKind,
  JobStatus,
} from '@nocobase/agent-protocol';

/** How a job was started: by a person, by a rule a person configured, by an agent (on behalf of who woke it). */
export const JOB_VIAS = ['human', 'rule', 'agent', 'system'] as const;

export type JobVia = (typeof JOB_VIAS)[number];

export interface Job {
  readonly id: string;
  /** The kind the application registered. */
  readonly kind: string;
  /** What the runner executes for it. */
  readonly executor: JobKind;
  readonly status: JobStatus;
  readonly title: string | null;
  /** What the job is for, as the application names it. */
  readonly subject: { readonly kind: string; readonly id: string } | null;
  readonly actorUserId: string;
  readonly via: JobVia;
  readonly priority: number;
  readonly attempt: number;
  readonly maxAttempts: number;
  /** The runners it may run on; null for any runner that fits. */
  readonly runnerIds: readonly string[] | null;
  readonly runnerId: string | null;
  /** What the runner reported on completion (`JobResult`), or null. */
  readonly result: unknown;
  /** The command's exit code and the commit, as far as the runner got. */
  readonly exitCode: number | null;
  readonly sha: string | null;
  readonly failureReason: JobFailureReason | null;
  readonly failureDetail: string | null;
  readonly cancelRequestedAt: string | null;
  readonly cancelledById: string | null;
  readonly availableAt: string | null;
  readonly dispatchedAt: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A job in the admin list: with names for people. */
export interface JobSummary extends Job {
  readonly actorName: string | null;
  readonly runnerName: string | null;
  /** The viewer may cancel it. */
  readonly canCancel: boolean;
}

/** One line of a job's log. */
export interface JobEventView {
  readonly seq: number;
  readonly at: string;
  readonly type: JobEventType;
  readonly stream: 'stdout' | 'stderr' | 'runner' | null;
  readonly phase: string | null;
  readonly content: string | null;
  readonly truncated: boolean;
}

/** What `agents.jobs.list` filters by. */
export interface JobFilter {
  readonly status?: JobStatus;
  readonly kind?: string;
  readonly runnerId?: string;
  readonly subjectKind?: string;
  readonly subjectId?: string;
  readonly limit?: number;
}
