/**
 * What an issue waits for now (`IssueProgress`, `shared/project-manager.ts`), worked out from what the system knows
 * rather than from what anybody wrote: an agent's run on it (working, or queued), else a linked open pull request whose
 * checks have not finished, else its status. The project manager's latest "Next" line (`texts.ts`) goes with it, and on
 * a blocked issue the Needs you line and explanation from the comment at its status transition. `handOver` says the project manager executes the open issue
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
import {
  issueExecutionIdentity,
  validIssueOwner,
} from '../execution-identity.js';
import { userName } from '../work.js';
import { readOwnerHandoff } from '../../issues/owner-handoff.js';

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

/**
 * How many of the project manager's newest comments up to an issue's blocking are searched for the one before it:
 * more than share its time.
 */
const BLOCKED_SOURCE_LOOKBACK = 20;

/** Lookups `issueProgress` shares across the issues of one read; one per read, never kept longer. */
export type ProgressMemo = Map<string, Promise<unknown>>;

export async function issueProgress(
  deps: {
    readonly agents: Pick<
      Agents,
      'runs' | 'agents' | 'runners' | 'claims' | 'availability'
    >;
    readonly projects: Pick<Projects, 'commentQueries' | 'issueContext'>;
  },
  conn: DatabaseConnection,
  issue: Issue,
  viewer?: { readonly userId: string; readonly seesMachines: boolean },
  /** Shared by the issues of one read (My follow-ups): what does not depend on the issue is looked up once. */
  memo?: ProgressMemo,
): Promise<IssueProgress> {
  const once = <T>(key: string, read: () => Promise<T>): Promise<T> => {
    if (!memo) return read();
    let found = memo.get(key) as Promise<T> | undefined;
    if (!found) {
      found = read();
      memo.set(key, found);
    }
    return found;
  };
  const nameOf = (userId: string) =>
    once(`user:${userId}`, () => userName(conn, userId));
  function waitingFor(
    agentId: string,
    userId: string,
  ): Promise<IssueProgress['waiting']> {
    return once(`waiting:${agentId}:${userId}`, () =>
      waitingForNow(agentId, userId),
    );
  }
  async function waitingForNow(
    agentId: string,
    userId: string,
  ): Promise<IssueProgress['waiting']> {
    const owner = userId ? { id: userId, name: await nameOf(userId) } : null;
    if (!userId || !(await validIssueOwner(conn, userId)))
      return { reason: 'noOwner', owner };
    const agent = await deps.agents.agents.findWorkable(conn, agentId);
    if (!agent || !agent.modelEntries.length)
      return { reason: 'notConfigured', owner };
    if (!deps.agents.agents.mayInvoke(agent, userId))
      return { reason: 'notAllowed', owner };
    const availability = (
      await deps.agents.availability(conn, [agent], userId)
    ).get(agentId);
    if (!availability || availability.online) return null;
    const reason =
      availability.runners.team + availability.runners.personal === 0
        ? 'noRunner'
        : availability.personalOnly && availability.runners.mine === 0
          ? 'ownerHasNoRunner'
          : 'notAllowed';
    return { reason, owner };
  }
  const subject = { kind: ISSUE_SUBJECT, id: issue.id };
  const manager = { type: AGENT_KIND, id: PROJECT_MANAGER_ID };
  const [latest] = await deps.projects.commentQueries.newestBy(
    conn,
    issue.id,
    manager,
    { live: true, limit: 1 },
  );
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
  let base: IssueProgress = {
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

  const handoff = await readOwnerHandoff(conn, issue.id);
  if (viewer?.userId && deps.agents.runs.requests) {
    const requests = await deps.agents.runs.requests.list({
      userId: viewer.userId,
      subject,
      limit: 50,
    });
    const personalRunnerRequests: NonNullable<
      IssueProgress['personalRunnerRequests']
    >[number][] = [];
    for (const request of requests) {
      if (
        request.purpose !== 'personalRunner' ||
        request.runId ||
        !request.commentRootRunId ||
        request.responsibleUserId !== issue.ownerUserId ||
        (request.commentOwnerKey ?? null) !==
          (handoff?.notificationKey ?? null) ||
        !['pending', 'rejected'].includes(request.status)
      )
        continue;
      if (request.status === 'pending' && request.commentRunId) {
        const target = await deps.agents.runs.identityInputs(
          conn,
          request.commentRunId,
        );
        if (target?.run.status !== 'queued') continue;
      }
      const origin = await deps.agents.runs.identityInputs(
        conn,
        request.commentRootRunId,
      );
      const input =
        origin?.inputs.find(
          (input) =>
            input.type === 'comment' &&
            (input.payload as Record<string, unknown> | null)
              ?.commentSourceSnapshot === true,
        ) ?? origin?.inputs.find((input) => input.type === 'comment');
      const payload =
        input?.payload && typeof input.payload === 'object'
          ? (input.payload as Record<string, unknown>)
          : {};
      if (!input || typeof payload.commentId !== 'string') continue;
      personalRunnerRequests.push({
        id: request.id,
        status: request.status as 'pending' | 'rejected',
        requestedBy: {
          id: request.requestedByUserId,
          name: request.requestedByName ?? input.actor.name,
        },
        commentId: payload.commentId,
        commentText: input.text,
        canDecide:
          !handoff?.waiting &&
          request.status === 'pending' &&
          viewer.userId === issue.ownerUserId,
        canRunAsMe:
          !handoff?.waiting && viewer.userId === request.requestedByUserId,
      });
    }
    base = { ...base, personalRunnerRequests };
  }

  if (issue.statusKey === 'blocked') {
    const transition = await conn
      .repository<{
        id: string;
        issueId: string;
        action: string;
        createdAt: string;
        details: { to?: string };
      }>('pmActivities')
      .findOne({
        filter: { issueId: issue.id, action: 'status_changed' },
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
      });
    // The project manager's last comment before the issue was blocked; deleted ones count, and then say nothing.
    const source =
      transition?.details?.to === 'blocked'
        ? (
            await deps.projects.commentQueries.newestBy(
              conn,
              issue.id,
              manager,
              {
                until: new Date(transition.createdAt).toISOString(),
                limit: BLOCKED_SOURCE_LOOKBACK,
              },
            )
          ).find(
            (comment) =>
              Date.parse(comment.createdAt) <
                Date.parse(transition.createdAt) ||
              (Date.parse(comment.createdAt) ===
                Date.parse(transition.createdAt) &&
                comment.id < transition.id),
          )
        : null;
    if (source && !source.deleted) {
      base = {
        ...base,
        blockedComment: { id: source.id, content: source.content },
        question:
          source.content
            .split('\n')
            .map((line) =>
              /^(?:需要你\s*[：:]|Needs you\s*:)(.*)$/iu
                .exec(line.trim())?.[1]
                ?.trim(),
            )
            .find(Boolean) ?? null,
      };
    }
  }

  if (
    handoff !== null &&
    (handoff.waiting || handoff.ownerUserId !== issue.ownerUserId)
  )
    return {
      ...base,
      handOver: false,
      waiting: {
        reason: 'waitingOwner',
        owner: {
          id: issue.ownerUserId,
          name: await nameOf(issue.ownerUserId),
        },
      },
    };
  const runs = await deps.agents.runs.openOn(conn, subject);
  const held = runs.filter((run) => HELD.has(run.status));
  const queued = runs.filter((run) => run.status === 'queued');
  // An agent doing a step comes before the project manager arranging it.
  const pick = (list: readonly Run[]): Run | null =>
    list.find((run) => run.agentId !== PROJECT_MANAGER_ID) ?? list[0] ?? null;
  const run = pick(held) ?? pick(queued);
  if (run) {
    const names = await deps.agents.agents.names(conn, [run.agentId]);
    const detail = await deps.agents.runs.detail(run.id).catch(() => null);
    const input = detail?.inputs.find((item) => item.text.trim() !== '');
    const runner =
      run.runnerId && HELD.has(run.status)
        ? ((await deps.agents.runners.find(conn, run.runnerId))?.name ?? null)
        : null;
    const identity =
      run.status === 'queued'
        ? await issueExecutionIdentity(deps.agents, () => deps.projects)(conn, {
            subjectId: issue.id,
            agentId: run.agentId,
            causedByRunId: run.retryOfRunId ?? undefined,
            inputs: detail?.inputs ?? [],
          })
        : undefined;
    const actorUserId =
      run.dispatchedAt || run.attempt > 1 || run.executions?.length
        ? run.actorUserId
        : (identity?.actorUserId ?? run.actorUserId);
    const agent = await deps.agents.agents.findWorkable(conn, run.agentId);
    const selection =
      run.status === 'queued' &&
      agent &&
      (!identity || identity.actorUserId) &&
      deps.agents.agents.mayInvoke(agent, actorUserId)
        ? await deps.agents.claims
            .diagnose(conn, { ...run, actorUserId }, agent)
            .catch(() => null)
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
      waiting:
        run.status === 'queued' && identity
          ? await waitingFor(
              run.agentId,
              run.dispatchedAt || run.attempt > 1 || run.executions?.length
                ? run.actorUserId
                : (identity.actorUserId ?? issue.ownerUserId),
            )
          : null,
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
  if (managed && open) {
    const waiting = await waitingFor(PROJECT_MANAGER_ID, issue.ownerUserId);
    if (waiting?.reason === 'noOwner' || waiting?.reason === 'notAllowed')
      return { ...base, state: 'queued', waiting };
  }
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
    };
  if (issue.statusKey === 'in_review') return { ...base, state: 'inReview' };
  return base;
}
