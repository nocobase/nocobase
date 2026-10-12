/**
 * The loop guard of agents' comments (`work.ts`): once they started as many runs on an issue as the project manager's
 * settings allow (`commentRunLimit`, 20 by default), the owner is told, and a person who may edit the issue continues
 * the comment held back once, which restarts the count.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  NoticeRule,
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { businessKey } from '@nocobase/app-plugin-projects/shared/access';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';

import { COMMENT_RUN_WINDOW_HOURS } from '../../shared/project-manager.js';
import { studioError } from '../http/errors.js';
import {
  COMMENT_RUNS_NOTICE_KIND,
  commentGuardId,
  commentGuards,
  type HeldCommentWake,
} from './comment-guard.js';
import { createAgentWork } from './work.js';

/** The notice type of the owner's card. */
export const COMMENT_RUNS_LIMITED = 'comment_runs_limited';

interface CommentRunsNotice {
  readonly issue: Pick<Issue, 'id' | 'identifier' | 'title' | 'ownerUserId'>;
  readonly agentName: string;
  readonly agentId: string;
  readonly commentId: string;
  readonly limit: number;
  readonly windowHours: number;
  readonly continueToken: string;
  /** Tells notices of separate comments apart. */
  readonly at: string;
}

/** Tells the owner, in the comment's transaction, that an agent's comment woke nobody. Worded in English. */
export function commentRunNoticeRule(): NoticeRule {
  return (context) =>
    Promise.resolve(
      context.events.flatMap((event) => {
        if (
          event.type !== 'work.announced' ||
          event.kind !== COMMENT_RUNS_NOTICE_KIND
        )
          return [];
        const notice = event.payload as CommentRunsNotice;
        const { issue } = notice;
        return [
          {
            key: `agents:comment-runs:${issue.id}:${notice.at}`,
            kind: 'info' as const,
            type: COMMENT_RUNS_LIMITED,
            issue: {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
            },
            userIds: [issue.ownerUserId],
            actor: { type: 'system', id: null, name: 'Studio' },
            slot: 'change' as const,
            params: {
              title: `Agent comments on ${issue.identifier} reached their limit`,
              body: `Agents' comments started ${notice.limit} runs on ${issue.identifier} within ${notice.windowHours} hours, so a comment of ${notice.agentName} started nothing. Continue on the issue to wake the agents it names and reset the count.`,
              identifier: issue.identifier,
              agentName: notice.agentName,
              agentId: notice.agentId,
              commentId: notice.commentId,
              limit: String(notice.limit),
              windowHours: String(notice.windowHours),
              continueToken: notice.continueToken,
            },
          },
        ];
      }),
    );
}

/** A person who may change the issue; `detail` has already answered 404 when they may not see it. */
const mayContinue = (viewer: Viewer): boolean =>
  viewer.actor.type === 'user' &&
  viewer.permissions.scopes[businessKey('pm.issues', 'edit')] !== 'none';

export async function pendingCommentRun(
  projects: Projects,
  viewer: Viewer,
  issueId: string,
): Promise<{
  readonly token: string;
  readonly maxRuns: number;
  readonly windowHours: number;
} | null> {
  const issue = await projects.issueQueries.detail(viewer, issueId);
  if (!mayContinue(viewer)) return null;
  const guard = await commentGuards(projects.tx.read()).findOne({
    filter: { id: commentGuardId(issue.id) },
  });
  if (!guard?.pendingToken) return null;
  const held = guard.ruleConfig as HeldCommentWake | null;
  return {
    token: guard.pendingToken,
    maxRuns: Number(held?.limit),
    windowHours: COMMENT_RUN_WINDOW_HOURS,
  };
}

/** Consumes the token, restarts the count and wakes the held comment's agents for the person continuing it. */
export async function continueCommentRun(
  projects: Projects,
  agents: Agents,
  viewer: Viewer,
  issueId: string,
  token: string,
): Promise<{ readonly runIds: readonly string[] }> {
  return projects.tx.unit(async (tx) => {
    const issue = await projects.issueQueries.detail(viewer, issueId);
    if (!mayContinue(viewer))
      throw studioError(
        'PERMISSION_DENIED',
        'COMMENT_CONTINUE_FORBIDDEN',
        'Only a person who may edit the issue may continue this comment.',
      );
    const id = commentGuardId(issue.id);
    const stale = () =>
      studioError(
        'FAILED_PRECONDITION',
        'COMMENT_CONTINUE_STALE',
        'This comment no longer waits to continue.',
      );
    const guard = await commentGuards(tx.conn).findOne({ filter: { id } });
    if (!guard || guard.pendingToken !== token || !guard.ruleConfig)
      throw stale();
    const consumed = await commentGuards(tx.conn).updateMany({
      filter: { id, pendingToken: token },
      values: { pendingToken: null, resetAt: new Date().toISOString() },
    });
    if (consumed.updatedCount !== 1) throw stale();
    const attempts = await createAgentWork({
      agents,
      projects: () => projects,
    }).resumeComment(
      tx,
      issue,
      guard.ruleConfig as unknown as HeldCommentWake,
      viewer.userId,
      token,
    );
    const runIds = attempts.flatMap((attempt) =>
      attempt.started && attempt.runId ? [attempt.runId] : [],
    );
    if (runIds.length === 0)
      throw studioError(
        'FAILED_PRECONDITION',
        'COMMENT_CONTINUE_UNAVAILABLE',
        'The agents of this comment cannot be woken now.',
        {
          metadata: {
            reasons: attempts.map((attempt) => attempt.skipped ?? 'unknown'),
          },
        },
      );
    tx.emit({ type: 'issue.changed', issueId: issue.id });
    return { runIds };
  });
}
