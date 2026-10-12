/**
 * Every run an agent's comment started leaves a comment by its agent (`work.ts`): once it commits, a run that completed
 * without commenting on its issue since it started answers in the thread of the comment that started it with its final
 * output, and a run that failed for good says there that it failed and why. A cancelled run says nothing. The comment
 * goes through the comment triggers like any agent comment, for the person the run acted for, so it wakes the issue's
 * executing agent (the coordinator) and counts toward the workflow's `commentRunLimit`. Once per run: a guard row keyed
 * by the run (`stage-run-guard.ts`) is written with the comment.
 */
import { redactPatterns } from '@nocobase/agent-protocol';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { stageGuardId, stageGuards } from './stage-run-guard.js';
import { AGENT_KIND } from './tx.js';
import { jsonObject } from './values.js';

/** The guard row's `statusKey`, which is no status key. */
const REPORT_GUARD = '@report';

/** At most this many characters of a run's output, and of its failure detail, go into the comment. */
export const REPORT_OUTPUT_MAX = 4000;
export const REPORT_DETAIL_MAX = 500;

/** Output that says nothing a reader could use. */
const TRIVIAL = /^(?:done|ok|okay|completed?|finished)[.!]?$/iu;

const bounded = (text: string, max: number) => {
  const clean = redactPatterns(text.trim());
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

/** What the run's comment says, or null when it says nothing. */
export function reportText(
  run: Pick<Run, 'status' | 'summary' | 'failureReason' | 'failureDetail'>,
): string | null {
  if (run.status === 'completed') {
    const output = run.summary?.trim() ?? '';
    return output && !TRIVIAL.test(output)
      ? bounded(output, REPORT_OUTPUT_MAX)
      : null;
  }
  if (run.status !== 'failed') return null;
  const detail = run.failureDetail?.trim();
  return `The run failed (${run.failureReason ?? 'unknown'})${detail ? `: ${bounded(detail, REPORT_DETAIL_MAX)}` : '.'}`;
}

/** Reports each ended run an agent's comment started; returns what stops it. */
export function reportCommentRuns(
  agents: Pick<Agents, 'events' | 'runs'>,
  projects: () => Pick<Projects, 'tx' | 'comments' | 'commentQueries'>,
  onError: (error: unknown) => void,
): () => void {
  return agents.events.on('run.changed', (event) => {
    if (event.status !== 'completed' && event.status !== 'failed') return;
    void reportRun(agents, projects(), event.runId).catch(onError);
  });
}

export async function reportRun(
  agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'tx' | 'comments' | 'commentQueries'>,
  runId: string,
): Promise<boolean> {
  const { inputs, ...run } = await agents.runs.detail(runId);
  if (run.subject.kind !== ISSUE_SUBJECT) return false;
  const started = inputs
    .map((input) => jsonObject(input.payload))
    .find((payload) => payload.byAgent === true);
  if (!started) return false;
  const content = reportText(run);
  if (!content) return false;
  const issueId = run.subject.id;
  return projects.tx.run(async (tx) => {
    const since = run.startedAt ?? run.createdAt;
    if (run.status === 'completed') {
      const own = (
        await projects.commentQueries.list(tx.conn, issueId, { since })
      ).some(
        (comment) =>
          comment.authorType === AGENT_KIND &&
          comment.authorId === run.agentId &&
          !comment.deleted,
      );
      if (own) return false;
    }
    const id = stageGuardId(issueId, `${REPORT_GUARD}:${run.id}`);
    if (await stageGuards(tx.conn).findOne({ filter: { id } })) return false;
    // A second delivery of the same end waits on this row and then fails, posting nothing.
    await stageGuards(tx.conn).createOne({
      values: {
        id,
        issueId,
        statusKey: REPORT_GUARD,
        resetAt: null,
        pendingToken: null,
        agentId: run.agentId,
        fromStatus: null,
        ruleConfig: null,
      },
    });
    const parentId =
      typeof started.commentId === 'string' ? started.commentId : null;
    const parent = parentId
      ? await tx.conn
          .repository<{ id: string; issueId: string; deletedAt: unknown }>(
            'pmComments',
          )
          .findOne({ filter: { id: parentId, issueId } })
      : null;
    await projects.comments.post(
      { type: AGENT_KIND, id: run.agentId },
      issueId,
      {
        content,
        ...(parent && !parent.deletedAt ? { parentId: parent.id } : {}),
      },
      {
        outer: tx,
        origin: { runId: run.id, report: run.status },
        forUserId: run.actorUserId,
      },
    );
    return true;
  });
}
