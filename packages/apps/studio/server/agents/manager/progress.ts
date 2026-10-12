/**
 * What an issue waits for now (`IssueProgress`, `shared/project-manager.ts`), worked out from what the system knows
 * rather than from what anybody wrote: an agent's run on it (working, or queued), else a linked open pull request whose
 * checks have not finished, else its status. The project manager's latest "Next" line (`texts.ts`) goes with it, and on
 * a blocked issue the question its latest comment asks. `handOver` says the project manager executes the open issue
 * but never worked on it (an issue an earlier version gave to an agent, say): someone may hand it over to go on.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { statusCategory } from '@nocobase/app-plugin-projects/shared/statuses';
import type { DatabaseConnection } from '@nocobase/db';

import {
  PROJECT_MANAGER_ID,
  type IssueProgress,
} from '../../../shared/project-manager.js';
import { pullRequestsOfIssue } from '../../git/store.js';
import { ISSUE_SUBJECT } from '../catalog/triggers.js';
import { AGENT_KIND } from '../tx.js';
import { commentGuards, commentGuardId } from '../comment-guard.js';
import { nextLineOf } from './texts.js';

/** How much of a step or a question the line carries. */
const LINE_LENGTH = 160;

/** The first line of a text that says something, without mention links and Markdown marks, cut to `LINE_LENGTH`. */
export function firstLineOf(text: string): string | null {
  for (const raw of text.split('\n')) {
    const line = raw
      .replace(/\[@([^\]]*)\]\(mention:\/\/[^)]*\)/gu, '')
      .replace(/^[#>*\-\s]+/u, '')
      .replace(/\s+/gu, ' ')
      .trim();
    if (!line) continue;
    return line.length > LINE_LENGTH
      ? `${line.slice(0, LINE_LENGTH - 1)}…`
      : line;
  }
  return null;
}

/** A comment's text without its "Next" line. */
function withoutNextLine(content: string): string {
  return nextLineOf(content) === null
    ? content
    : content.trimStart().split('\n').slice(1).join('\n');
}

const HELD = new Set(['dispatched', 'running']);

export async function issueProgress(
  deps: {
    readonly agents: Pick<Agents, 'runs' | 'agents' | 'runners' | 'claims'>;
    readonly projects: Pick<Projects, 'commentQueries'>;
  },
  conn: DatabaseConnection,
  issue: Issue,
  viewer?: { readonly userId: string; readonly seesMachines: boolean },
): Promise<IssueProgress> {
  const subject = { kind: ISSUE_SUBJECT, id: issue.id };
  const comments = await deps.projects.commentQueries.list(conn, issue.id);
  const managerComments = comments.filter(
    (comment) =>
      !comment.deleted &&
      comment.authorType === AGENT_KIND &&
      comment.authorId === PROJECT_MANAGER_ID,
  );
  const latest = managerComments.at(-1) ?? null;
  const next = latest ? nextLineOf(latest.content) : null;
  const category = statusCategory(issue.statusKey);
  const managed =
    issue.executor?.type === AGENT_KIND &&
    issue.executor.id === PROJECT_MANAGER_ID;
  const open =
    issue.statusKey !== 'backlog' &&
    category !== 'done' &&
    category !== 'closed';
  const managerRuns = managed
    ? await deps.agents.runs.list({
        subjectKind: ISSUE_SUBJECT,
        subjectId: issue.id,
        agentId: PROJECT_MANAGER_ID,
        limit: 1,
      })
    : [];
  const base: IssueProgress = {
    state: 'idle',
    agent: null,
    step: null,
    since: null,
    runner: null,
    pullRequest: null,
    question: null,
    next,
    handOver: managed && open && managerRuns.length === 0,
  };

  const runs = await deps.agents.runs.openOn(conn, subject);
  const held = runs.filter((run) => HELD.has(run.status));
  const queued = runs.filter((run) => run.status === 'queued');
  // An agent doing a step comes before the project manager arranging it.
  const pick = (list: readonly Run[]): Run | null =>
    list.find((run) => run.agentId !== PROJECT_MANAGER_ID) ?? list[0] ?? null;
  const run = pick(held) ?? pick(queued);
  if (run) {
    const selection =
      run.status === 'queued'
        ? await deps.agents.claims.selectionWait(run.id).catch(() => null)
        : null;
    const names = await deps.agents.agents.names(conn, [run.agentId]);
    const detail = await deps.agents.runs.detail(run.id).catch(() => null);
    const input = detail?.inputs.find((item) => item.text.trim() !== '');
    const runner =
      run.runnerId && HELD.has(run.status)
        ? ((await deps.agents.runners.find(conn, run.runnerId))?.name ?? null)
        : null;
    return {
      ...base,
      ...(selection
        ? {
            managerWait: {
              ...selection,
              entries: selection.entries.map((entry) => ({
                ...entry,
                runners: entry.runners
                  .filter(
                    (runner) =>
                      viewer?.seesMachines ||
                      runner.ownerUserId === viewer?.userId,
                  )
                  .map((runner) => runner.name),
                runnerLoads: entry.runners
                  .filter(
                    (runner) =>
                      viewer?.seesMachines ||
                      runner.ownerUserId === viewer?.userId,
                  )
                  .map(({ ownerUserId: _owner, ...runner }) => runner),
              })),
            },
          }
        : {}),
      state: HELD.has(run.status) ? 'working' : 'queued',
      agent: { id: run.agentId, name: names.get(run.agentId) ?? run.agentId },
      step:
        run.agentId === PROJECT_MANAGER_ID
          ? null
          : input
            ? firstLineOf(withoutNextLine(input.text))
            : null,
      since: run.startedAt ?? run.dispatchedAt ?? run.createdAt,
      runner,
    };
  }
  const continuation = await commentGuards(conn).findOne({
    filter: { id: commentGuardId(issue.id) },
  });
  if (continuation?.pendingToken && open)
    return { ...base, state: 'waitingForContinuation' };
  if (category === 'done' || category === 'closed')
    return { ...base, state: 'finished' };
  if (issue.statusKey === 'backlog') return { ...base, state: 'notStarted' };
  const pending = (await pullRequestsOfIssue(conn, issue.id))
    .map(({ pr }) => pr)
    .find((pr) => pr.state === 'open' && pr.ciState === 'pending');
  if (pending)
    return {
      ...base,
      state: 'checksPending',
      pullRequest: { number: pending.number, url: pending.url },
    };
  if (issue.statusKey === 'blocked')
    return {
      ...base,
      state: 'needsDecision',
      question: latest ? firstLineOf(withoutNextLine(latest.content)) : null,
    };
  if (issue.statusKey === 'in_review') return { ...base, state: 'inReview' };
  return base;
}
