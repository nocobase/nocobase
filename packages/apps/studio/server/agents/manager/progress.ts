/**
 * What an issue waits for now (`IssueProgress`, `shared/project-manager.ts`), worked out from what the system knows
 * rather than from what anybody wrote: an agent's run on it (working, or queued), else a linked open pull request whose
 * checks have not finished, else its status. Structured needsYou and next fields go with it, with a link to the latest manager explanation. `handOver` says the project manager executes the open issue
 * but never worked on it (an issue an earlier version gave to an agent, say): someone may hand it over to go on.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { RunInput } from '@nocobase/agent-protocol';
import type {
  Run,
  RunRequestItem,
} from '@nocobase/app-plugin-agents/shared/runs';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { statusCategory } from '@nocobase/app-plugin-projects/shared/statuses';
import type { DatabaseConnection } from '@nocobase/db';

import {
  PROJECT_MANAGER_ID,
  type IssueProgress,
} from '../../../shared/project-manager.js';
import {
  pullRequestsOfIssue,
  pullRequestsOfIssues,
  type PullRequestRow,
} from '../../git/store.js';
import { ISSUE_SUBJECT } from '../catalog/triggers.js';
import { AGENT_KIND } from '../tx.js';
import {
  commentGuards,
  commentGuardId,
  type CommentGuard,
} from '../comment-guard.js';
import {
  issueExecutionIdentity,
  validIssueOwner,
} from '../execution-identity.js';
import { userName } from '../work.js';
import {
  OWNER_HANDOFFS,
  readOwnerHandoff,
  type OwnerHandoff,
} from '../../issues/owner-handoff.js';

/** How much of a running step the line carries. */
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

const HELD = new Set(['dispatched', 'running']);

/** Lookups `issueProgress` shares across the issues of one read; one per read, never kept longer. */
export type ProgressMemo = Map<string, Promise<unknown>>;

type AuthoredComment = Awaited<
  ReturnType<Projects['commentQueries']['newestBy']>
>[number];

interface ProgressDeps {
  readonly agents: Pick<
    Agents,
    'runs' | 'agents' | 'runners' | 'claims' | 'availability'
  >;
  readonly projects: Pick<Projects, 'commentQueries' | 'issueContext'>;
}

type ProgressViewer = {
  readonly userId: string;
  readonly seesMachines: boolean;
};

/**
 * What `issueProgress` reads about one issue: `progressReads` reads it for that issue alone, `prefetchProgressReads`
 * for many issues in a few queries.
 */
export interface ProgressReads {
  /** The project manager's newest live comment. */
  managerComment(issueId: string): Promise<AuthoredComment | null>;
  /** Whether the project manager ever had a run on the issue. */
  managerRan(issueId: string): Promise<boolean>;
  handoff(issueId: string): Promise<OwnerHandoff | null>;
  /** The viewer's run requests on the issue (the ones they answer for or asked), newest first; null when none are kept. */
  requests(issueId: string): Promise<readonly RunRequestItem[] | null>;
  /** The runs on the issue that have not ended, oldest first. */
  openRuns(issueId: string): Promise<readonly Run[]>;
  /** The text of the run's first input that has any, oldest first. */
  runText(runId: string): Promise<string | null>;
  continuation(issueId: string): Promise<CommentGuard | null>;
  pullRequests(issueId: string): Promise<readonly PullRequestRow[]>;
}

const MANAGER = { type: AGENT_KIND, id: PROJECT_MANAGER_ID } as const;
const REQUESTS_PER_ISSUE = 50;

/** A run's inputs, oldest first, as its detail lists them; none when it is gone. */
async function inputsOf(
  deps: ProgressDeps,
  conn: DatabaseConnection,
  runId: string,
): Promise<readonly RunInput[]> {
  const found = await deps.agents.runs
    .identityInputs(conn, runId)
    .catch(() => null);
  return [...(found?.inputs ?? [])].sort(
    (a, b) =>
      Date.parse(a.at) - Date.parse(b.at) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/** What `issueProgress` reads, one issue at a time. */
export function progressReads(
  deps: ProgressDeps,
  conn: DatabaseConnection,
  viewer?: ProgressViewer,
): ProgressReads {
  const subject = (id: string) => ({ kind: ISSUE_SUBJECT, id });
  return {
    async managerComment(issueId) {
      const [latest] = await deps.projects.commentQueries.newestBy(
        conn,
        issueId,
        MANAGER,
        { live: true, limit: 1 },
      );
      return latest ?? null;
    },
    async managerRan(issueId) {
      return (
        (
          await deps.agents.runs.list({
            subjectKind: ISSUE_SUBJECT,
            subjectId: issueId,
            agentId: PROJECT_MANAGER_ID,
            limit: 1,
          })
        ).length > 0
      );
    },
    handoff: (issueId) => readOwnerHandoff(conn, issueId),
    async requests(issueId) {
      if (!viewer?.userId || !deps.agents.runs.requests) return null;
      return deps.agents.runs.requests.list({
        userId: viewer.userId,
        subject: subject(issueId),
        limit: REQUESTS_PER_ISSUE,
      });
    },
    openRuns: (issueId) => deps.agents.runs.openOn(conn, subject(issueId)),
    async runText(runId) {
      return (
        (await inputsOf(deps, conn, runId)).find(
          (item) => item.text.trim() !== '',
        )?.text ?? null
      );
    },
    async continuation(issueId) {
      return (
        (await commentGuards(conn).findOne({
          filter: { id: commentGuardId(issueId) },
        })) ?? null
      );
    },
    async pullRequests(issueId) {
      return (await pullRequestsOfIssue(conn, issueId)).map(({ pr }) => pr);
    },
  };
}

/** Groups `rows` by `key`, keeping their order. */
function groupBy<T>(
  rows: readonly T[],
  key: (row: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    const group = groups.get(id);
    if (group) group.push(row);
    else groups.set(id, [row]);
  }
  return groups;
}

/**
 * What `issueProgress` reads about each of `issues`, read up front in a few queries rather than a few per issue; an
 * issue outside them is read on its own.
 */
export async function prefetchProgressReads(
  deps: ProgressDeps,
  conn: DatabaseConnection,
  issues: readonly Issue[],
  viewer?: ProgressViewer,
): Promise<ProgressReads> {
  const single = progressReads(deps, conn, viewer);
  const ids = [...new Set(issues.map((issue) => issue.id))];
  if (ids.length === 0) return single;
  const known = new Set(ids);
  const managedOpen = issues
    .filter(
      (issue) =>
        issue.executor?.type === AGENT_KIND &&
        issue.executor.id === PROJECT_MANAGER_ID,
    )
    .map((issue) => issue.id);
  const requestService = viewer?.userId ? deps.agents.runs.requests : undefined;

  async function readRequests(): Promise<Map<string, RunRequestItem[]>> {
    if (!requestService || !viewer?.userId) return new Map();
    // Only pending and rejected requests are shown; read all of them, a page at a time.
    const all: RunRequestItem[] = [];
    let cursor: { createdAt: string; id: string } | undefined;
    for (;;) {
      const page = await requestService.list({
        userId: viewer.userId,
        subject: { kind: ISSUE_SUBJECT },
        subjectIds: ids,
        statuses: ['pending', 'rejected'],
        limit: 200,
        ...(cursor ? { cursor } : {}),
      });
      all.push(...page);
      const last = page.at(-1);
      if (page.length < 200 || !last) break;
      cursor = { createdAt: last.createdAt, id: last.id };
    }
    return groupBy(all, (request) => request.subject.id);
  }

  const [managerComments, ran, handoffs, requests, open, guards, pullRequests] =
    await Promise.all([
      deps.projects.commentQueries.newestByEach(conn, ids, MANAGER, {
        live: true,
      }),
      managedOpen.length === 0
        ? Promise.resolve(new Set<string>())
        : conn.query
            .selectFrom('agRuns')
            .select(['subjectId'])
            .distinct()
            .where('agentId', '=', PROJECT_MANAGER_ID)
            .where('subjectKind', '=', ISSUE_SUBJECT)
            .where('subjectId', 'in', managedOpen)
            .execute<{ subjectId: string }>()
            .then((rows) => new Set(rows.map((row) => row.subjectId))),
      conn
        .repository<OwnerHandoff>(OWNER_HANDOFFS)
        .findMany({
          filter: (f) => f.or(ids.map((id) => f.string('issueId').eq(id))),
        })
        .then((rows) => new Map(rows.map((row) => [row.issueId, row]))),
      readRequests(),
      deps.agents.runs
        .openOnEach(conn, ISSUE_SUBJECT, ids)
        .then((runs) => groupBy(runs, (run) => run.subject.id)),
      commentGuards(conn)
        .findMany({
          filter: (f) =>
            f.or(ids.map((id) => f.string('id').eq(commentGuardId(id)))),
        })
        .then((rows) => new Map(rows.map((row) => [row.issueId, row]))),
      pullRequestsOfIssues(conn, ids),
    ]);

  const runIds = [...open.values()].flat().map((run) => run.id);
  const runTexts = new Map<string, string>();
  if (runIds.length > 0)
    for (const input of await conn
      .repository<{ id: string; runId: string; text: string }>('agRunInputs')
      .findMany({
        filter: (f) => f.or(runIds.map((id) => f.string('runId').eq(id))),
        select: (select) => select.fields('id', 'runId', 'text'),
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      }))
      if (!runTexts.has(input.runId) && input.text.trim() !== '')
        runTexts.set(input.runId, input.text);
  const openRunIds = new Set(runIds);

  return {
    managerComment: async (issueId) =>
      known.has(issueId)
        ? (managerComments.get(issueId) ?? null)
        : single.managerComment(issueId),
    managerRan: async (issueId) =>
      managedOpen.includes(issueId)
        ? ran.has(issueId)
        : single.managerRan(issueId),
    handoff: async (issueId) =>
      known.has(issueId)
        ? (handoffs.get(issueId) ?? null)
        : single.handoff(issueId),
    requests: async (issueId) =>
      !requestService
        ? null
        : known.has(issueId)
          ? (requests.get(issueId) ?? [])
          : single.requests(issueId),
    openRuns: async (issueId) =>
      known.has(issueId) ? (open.get(issueId) ?? []) : single.openRuns(issueId),
    runText: async (runId) =>
      openRunIds.has(runId)
        ? (runTexts.get(runId) ?? null)
        : single.runText(runId),
    continuation: async (issueId) =>
      known.has(issueId)
        ? (guards.get(issueId) ?? null)
        : single.continuation(issueId),
    pullRequests: async (issueId) =>
      known.has(issueId)
        ? (pullRequests.get(issueId) ?? []).map(({ pr }) => pr)
        : single.pullRequests(issueId),
  };
}

export async function issueProgress(
  deps: ProgressDeps,
  conn: DatabaseConnection,
  issue: Issue,
  viewer?: ProgressViewer,
  /** Shared by the issues of one read (My follow-ups): what does not depend on the issue is looked up once. */
  memo?: ProgressMemo,
  options: {
    /** What to read with; `progressReads` by default. */
    readonly reads?: ProgressReads;
    /**
     * For a row of a list: queued work says which agent it waits for and since when, but not why no runner has
     * claimed it (`waiting`, `managerWait`), which takes the claim analysis the issue's own progress does.
     */
    readonly list?: boolean;
  } = {},
): Promise<IssueProgress> {
  const reads = options.reads ?? progressReads(deps, conn, viewer);
  // Without a memo of the read, one of its own: one issue's progress looks some things up twice.
  const cache: ProgressMemo = memo ?? new Map<string, Promise<unknown>>();
  const once = <T>(key: string, read: () => Promise<T>): Promise<T> => {
    let found = cache.get(key) as Promise<T> | undefined;
    if (!found) {
      found = read();
      cache.set(key, found);
    }
    return found;
  };
  const workable = (agentId: string) =>
    once(`workable:${agentId}`, () =>
      deps.agents.agents.findWorkable(conn, agentId),
    );
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
    const agent = await workable(agentId);
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
  const latest = await reads.managerComment(issue.id);
  const category = statusCategory(issue.statusKey);
  const managed =
    issue.executor?.type === AGENT_KIND &&
    issue.executor.id === PROJECT_MANAGER_ID;
  const open =
    issue.statusKey !== 'backlog' &&
    category !== 'done' &&
    category !== 'closed';
  const managerRan = managed && open && (await reads.managerRan(issue.id));
  let base: IssueProgress = {
    state: 'idle',
    agent: null,
    step: null,
    since: null,
    runner: null,
    pullRequest: null,
    needsYou: issue.needsYou,
    explanationCommentId: latest?.id ?? null,
    next: issue.next,
    handOver: managed && open && !managerRan,
  };

  const handoff = await reads.handoff(issue.id);
  const requests = viewer?.userId ? await reads.requests(issue.id) : null;
  if (viewer?.userId && requests) {
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
  const runs = await reads.openRuns(issue.id);
  const held = runs.filter((run) => HELD.has(run.status));
  const queued = runs.filter((run) => run.status === 'queued');
  // An agent doing a step comes before the project manager arranging it.
  const pick = (list: readonly Run[]): Run | null =>
    list.find((run) => run.agentId !== PROJECT_MANAGER_ID) ?? list[0] ?? null;
  const run = pick(held) ?? pick(queued);
  if (run) {
    const names = await once(`agentName:${run.agentId}`, () =>
      deps.agents.agents.names(conn, [run.agentId]),
    );
    const runnerId = run.runnerId;
    const runner =
      runnerId && HELD.has(run.status)
        ? ((
            await once(`runner:${runnerId}`, () =>
              deps.agents.runners.find(conn, runnerId),
            )
          )?.name ?? null)
        : null;
    const stepOf = (text: string | undefined) =>
      run.agentId === PROJECT_MANAGER_ID
        ? null
        : text
          ? firstLineOf(text)
          : null;
    if (options.list)
      return {
        ...base,
        state: HELD.has(run.status) ? 'working' : 'queued',
        agent: { id: run.agentId, name: names.get(run.agentId) ?? run.agentId },
        step: stepOf((await reads.runText(run.id)) ?? undefined),
        since: run.startedAt ?? run.dispatchedAt ?? run.createdAt,
        runner,
        waiting: null,
      };
    const inputs = await inputsOf(deps, conn, run.id);
    const input = inputs.find((item) => item.text.trim() !== '');
    const identity =
      run.status === 'queued'
        ? await issueExecutionIdentity(deps.agents, () => deps.projects)(conn, {
            subjectId: issue.id,
            agentId: run.agentId,
            causedByRunId: run.retryOfRunId ?? undefined,
            inputs,
          })
        : undefined;
    const actorUserId =
      run.dispatchedAt || run.attempt > 1 || run.executions?.length
        ? run.actorUserId
        : (identity?.actorUserId ?? run.actorUserId);
    const agent = await workable(run.agentId);
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
      step: stepOf(input?.text),
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
  const continuation = await reads.continuation(issue.id);
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
  const pending = (await reads.pullRequests(issue.id)).find(
    (pr) => pr.state === 'open' && pr.ciState === 'pending',
  );
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
