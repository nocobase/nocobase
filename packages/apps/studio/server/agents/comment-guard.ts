/**
 * The guard of the runs agents' comments start on an issue (`commentGuardId`), kept across restarts, and a read-only
 * projection of runs and their inputs on the change's connection to count them. The guards live in
 * `studioStageRunGuards`, where earlier versions also kept a guard per issue and workflow stage.
 */
import type { ActorRef, FailureReason } from '@nocobase/agent-protocol';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { DatabaseConnection } from '@nocobase/db';
import { jsonObject } from './values.js';

export const COMMENT_GUARDS = 'studioStageRunGuards';
export interface CommentGuard {
  readonly id: string;
  readonly issueId: string;
  readonly statusKey: string;
  readonly resetAt: string | null;
  readonly pendingToken: string | null;
  readonly agentId: string | null;
  readonly fromStatus: string | null;
  readonly ruleConfig: Readonly<Record<string, unknown>> | null;
}

/** The announcement of a comment the limit held back, for `commentRunNoticeRule`. */
export const COMMENT_RUNS_NOTICE_KIND = 'agent.commentRuns';

/**
 * An agent's comment the limit held back, kept in its guard's `ruleConfig` until a person continues it: what it says,
 * whom it would have woken and why (`mention`, `reply`), and the limit it reached.
 */
export interface HeldCommentWake {
  readonly pendingWakes?: readonly Omit<HeldCommentWake, 'pendingWakes'>[];
  readonly commentId: string;
  readonly parentId: string | null;
  readonly content: string;
  readonly actor: ActorRef;
  readonly targets: readonly {
    readonly agentId: string;
    readonly triggerType: string;
  }[];
  readonly limit: number;
}

/** The guard of the runs agents' comments start on an issue; its `statusKey` is no status key. */
export const COMMENT_GUARD = '@comments';
export const commentGuardId = (issueId: string): string =>
  guardIdOf(issueId, COMMENT_GUARD);

/** A guard row's id: the issue and what it guards. */
export const guardIdOf = (issueId: string, key: string): string =>
  `${issueId}:${key}`;

export const commentGuards = (conn: DatabaseConnection) =>
  conn.repository<CommentGuard>(COMMENT_GUARDS);

/** These failures describe the execution environment or network, rather than work the agent finished attempting. */
const ENVIRONMENT_FAILURES: ReadonlySet<FailureReason> = new Set([
  'runnerOffline',
  'leaseExpired',
  'startTimeout',
  'setupFailed',
  'checkoutFailed',
  'cliUnavailable',
  'toolAuth',
  'toolQuota',
  'toolRateLimit',
  'toolNetwork',
  'prepareNetwork',
  'workspaceBusy',
  'queuedExpired',
  'modelUnavailable',
  'policyRefused',
  'cancelled',
]);

export function countsAsRun(
  run: Pick<
    Run,
    'status' | 'startedAt' | 'failureReason' | 'cancelRequestedAt'
  >,
): boolean {
  return (
    Boolean(run.startedAt) &&
    run.status !== 'cancelled' &&
    run.cancelRequestedAt === null &&
    (run.status === 'running' ||
      run.status === 'completed' ||
      (run.status === 'failed' &&
        (!run.failureReason || !ENVIRONMENT_FAILURES.has(run.failureReason))))
  );
}

interface RunRow extends Pick<
  Run,
  'id' | 'status' | 'startedAt' | 'failureReason' | 'cancelRequestedAt'
> {
  readonly payload: unknown;
}

/**
 * The agents service's inputsSince projection omits run ids and outcomes. Read these two collections without writing
 * them so Studio can count actual executions, once per run, using the same transaction snapshot as the change: the
 * runs of the issue that took an input `counts` keeps since the guard's reset, within the window.
 */
async function recentRunCount(
  conn: DatabaseConnection,
  issueId: string,
  guardId: string,
  windowHours: number,
  counts: (payload: Readonly<Record<string, unknown>>) => boolean,
): Promise<number> {
  const guard = await commentGuards(conn).findOne({ filter: { id: guardId } });
  const since = new Date(
    Math.max(
      Date.now() - windowHours * 3_600_000,
      guard?.resetAt ? new Date(guard.resetAt).getTime() : 0,
    ),
  );
  const rows = await conn.query
    .selectFrom('agRuns as run')
    .innerJoin('agRunInputs as input', 'input.runId', 'run.id')
    .select([
      'run.id as id',
      'run.status as status',
      'run.startedAt as startedAt',
      'run.failureReason as failureReason',
      'run.cancelRequestedAt as cancelRequestedAt',
      'input.payload as payload',
    ])
    .where('run.subjectKind', '=', 'issue')
    .where('run.subjectId', '=', issueId)
    .where('run.startedAt', 'is not', null)
    .where('input.createdAt', '>=', since)
    .where('input.deliveredAt', 'is not', null)
    .execute<RunRow>();
  return new Set(
    rows
      .filter((row) => countsAsRun(row) && counts(jsonObject(row.payload)))
      .map((row) => row.id),
  ).size;
}

/** The runs agents' comments started on the issue (their input's `byAgent`). */
export function recentCommentRunCount(
  conn: DatabaseConnection,
  issueId: string,
  windowHours: number,
): Promise<number> {
  return recentRunCount(
    conn,
    issueId,
    commentGuardId(issueId),
    windowHours,
    (payload) => payload.byAgent === true,
  );
}
