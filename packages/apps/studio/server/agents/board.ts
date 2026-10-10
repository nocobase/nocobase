/**
 * What the agents are doing (`shared/agent-board.ts`), for the issues pages' Agent queue: Studio joins the agents plugin's
 * runs and queue, the projects plugin's issues, approvals and follows, and its own inbox's failed-run cards, since only Studio knows that a run on an
 * issue is an agent working on it. Each issue an agent is involved in is one row, in the section of the most pressing
 * thing an agent has on it; the other agents with something on it are named beside it.
 *
 * Reads, none per issue: the open runs on issues with the queue explained (`runs.workload`), the failed-run cards that
 * wait, then the issues the viewer sees within the page's filters that an agent executes (unfinished) or that one of
 * those name (`issueQueries.matching`), the pending approvals on them, what holds the agents' issues that wait for
 * others (`subtasks.visibleBlockers`), the agents, the newest ended run of each idle issue's agent
 * (`runs.lastEnded`), the people's names, and each project's statuses and workflow. An agent's
 * approval request shows on an issue that an agent executes or has a run on, which is where an agent asks for one; a
 * design proposal is its issue waiting in Proposal review. Operation plans are not here: they are decided in the
 * conversation that proposed them. An issue an agent executes that waits for unfinished issues is queued behind
 * them, since the agent is woken when they finish.
 *
 * An idle issue says why (`idleReasonOf`) and whether the viewer may start it; "Start" (`startAgentBoardIssue`) starts
 * the agent's work as handing it the issue with "Start now" answered does (`AgentWork.startNow`).
 *
 * Each row says whether the issue is the viewer's (they own, created or follow it), and the agents with nothing here
 * that the viewer may give work to are listed too, so the page shows idle agents.
 *
 * What the viewer sees: only the issues they may see; on those, a run's details (its id, runner, trigger and newest
 * activity) only when they could open the run itself (they started it or own it, or hold `agents.agents` read), as
 * the agents plugin's run API decides.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type {
  IssueMatches,
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  IssueListItem,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';
import { businessKey } from '@nocobase/app-plugin-projects/shared/access';
import {
  BACKLOG_STATUS,
  BUILTIN_STATUSES,
} from '@nocobase/app-plugin-projects/shared/workflows';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import {
  runnerEntries,
  type Agent,
} from '@nocobase/app-plugin-agents/shared/agents';
import type {
  AgentLoad,
  Run,
  WorkloadRun,
} from '@nocobase/app-plugin-agents/shared/runs';

import {
  AGENT_BOARD_STATES,
  AGENT_WAIT_KINDS,
  type AgentBoard,
  type AgentBoardAgent,
  type AgentBoardEntry,
  type AgentBoardIdle,
  type AgentBoardQuery,
  type AgentBoardRow,
  type AgentBoardRun,
  type AgentBoardStartResult,
  type AgentBoardState,
  type AgentBoardWaiting,
  type AgentWaitKind,
} from '../../shared/agent-board.js';
import type { OpenDecision } from '../inbox/service.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import {
  DESIGN_SECTION_ANCHOR,
  PROPOSAL_REVIEW_STATUS,
} from '../../shared/design.js';
import { INBOX_DECISIONS_PATH } from '../../shared/inbox.js';
import { RUN_FAILED_FINAL } from './notices.js';
import { RUN_AGENT } from './stage-rules.js';
import type { AgentWork } from './work.js';
import { AGENT_KIND } from './tx.js';

/** The most issues the view shows. */
export const AGENT_BOARD_ISSUES = 300;
/** The most open runs on issues the view reads. */
export const AGENT_BOARD_RUNS = 500;

/** The status an agent asks the owner with, and those it hands an issue over for review in. */
const QUESTION_STATUS = 'blocked';
const REVIEW_STATUSES = new Set(['in_review']);

export interface AgentBoardDeps {
  readonly projects: () => Pick<
    Projects,
    | 'issueQueries'
    | 'approvals'
    | 'subtasks'
    | 'subscriptions'
    | 'workflows'
    | 'tx'
  >;
  readonly agents: Pick<Agents, 'runs' | 'agents' | 'people' | 'tx'>;
  /** The decisions of a source and type that still wait (`StudioInbox.openDecisions`); none without an inbox. */
  readonly decisions: (source: string, type: string) => Promise<OpenDecision[]>;
  /** The projects plugin's source in the inbox, which carries the failed-run cards. */
  readonly decisionSource: string;
  readonly now?: () => Date;
}

export interface AgentBoardCaller {
  readonly viewer: Viewer;
  /** The viewer may read every run (`agents.agents` read). */
  readonly readsAllRuns: boolean;
}

const issuePath = (identifier: string): string =>
  `/issues/${encodeURIComponent(identifier)}`;

/** Whether the viewer could open the run through the agents plugin's API. */
function seesRun(run: WorkloadRun, caller: AgentBoardCaller): boolean {
  const { userId } = caller.viewer;
  return (
    caller.readsAllRuns ||
    run.actorUserId === userId ||
    run.ownerUserId === userId
  );
}

function runOf(run: WorkloadRun, visible: boolean): AgentBoardRun {
  const held = run.status !== 'queued';
  return {
    id: visible ? run.id : null,
    status: run.status as AgentBoardRun['status'],
    since: (held ? (run.startedAt ?? run.dispatchedAt) : null) ?? run.createdAt,
    trigger: visible ? run.trigger : null,
    runnerName: visible ? run.runnerName : null,
    tool: visible ? run.tool : null,
    model: visible ? run.model : null,
    lastActivity: visible ? run.lastActivity : null,
    attempt: run.attempt,
    maxAttempts: run.maxAttempts,
    priority: run.priority,
  };
}

function agentOf(agent: Agent, load: AgentLoad | undefined): AgentBoardAgent {
  return {
    id: agent.id,
    name: agent.name,
    nameText: agent.nameText,
    avatar: agent.avatar,
    // Only runner agents execute issues, so every agent here has a coding tool.
    tool: runnerEntries(agent)[0]?.tool ?? '',
    model: runnerEntries(agent)[0]?.model ?? null,
    models: runnerEntries(agent).map((entry) =>
      [entry.tool, entry.model, entry.effort].filter(Boolean).join(' · '),
    ),
    archived: agent.archivedAt !== null,
    online: load?.online ?? false,
    active: load?.active ?? 0,
    maxConcurrentRuns: agent.maxConcurrentRuns,
  };
}

/**
 * Why an agent is idle on an issue it executes (`AGENT_IDLE_REASONS`): in backlog; else its newest run there ended;
 * else the status starts no agent on entering it (`autoRuns` false); else it never ran.
 */
export function idleReasonOf(input: {
  readonly statusKey: string;
  readonly lastRun: Pick<Run, 'status' | 'finishedAt' | 'updatedAt'> | null;
  readonly autoRuns: boolean;
}): Omit<AgentBoardIdle, 'mayStart'> {
  const { lastRun } = input;
  if (input.statusKey === BACKLOG_STATUS)
    return { reason: 'backlog', lastRun: null };
  if (
    lastRun &&
    (lastRun.status === 'completed' ||
      lastRun.status === 'failed' ||
      lastRun.status === 'cancelled')
  )
    return {
      reason: 'lastRun',
      lastRun: {
        status: lastRun.status,
        at: lastRun.finishedAt ?? lastRun.updatedAt,
      },
    };
  return {
    reason: input.autoRuns ? 'neverRan' : 'noAutoRun',
    lastRun: null,
  };
}

const noCounts = (): Record<AgentBoardState, number> =>
  Object.fromEntries(AGENT_BOARD_STATES.map((state) => [state, 0])) as Record<
    AgentBoardState,
    number
  >;

/** A failed-run card's values: its run and agent. */
function failedRunOf(decision: OpenDecision): {
  readonly issueId: string;
  readonly agentId: string;
  readonly reason: string | null;
} | null {
  const data = decision.data ?? {};
  const agentId = typeof data.agentId === 'string' ? data.agentId : null;
  if (decision.subject?.type !== ISSUE_SUBJECT || !agentId) return null;
  return {
    issueId: decision.subject.id,
    agentId,
    reason: typeof data.failureReason === 'string' ? data.failureReason : null,
  };
}

export async function readAgentBoard(
  deps: AgentBoardDeps,
  caller: AgentBoardCaller,
  query: AgentBoardQuery,
): Promise<AgentBoard> {
  const { viewer } = caller;
  const projects = deps.projects();
  const workload = await deps.agents.runs.workload({
    subjectKind: ISSUE_SUBJECT,
    limit: AGENT_BOARD_RUNS,
  });
  const failed = (
    await deps.decisions(deps.decisionSource, RUN_FAILED_FINAL)
  ).flatMap((decision) => {
    const card = failedRunOf(decision);
    return card ? [{ ...card, decision }] : [];
  });

  // The issues: an agent executes them, or a run or a card names them; the viewer's, within the page's filters.
  const matches: IssueMatches = await projects.issueQueries.matching(
    viewer,
    {
      ...(query.q ? { q: query.q } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.labelId ? { labelId: query.labelId } : {}),
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.executorId ? { executorId: query.executorId } : {}),
    },
    {
      executorType: AGENT_KIND,
      issueIds: [
        ...workload.runs.map((run) => run.subject.id),
        ...failed.map((card) => card.issueId),
      ],
      limit: AGENT_BOARD_ISSUES,
    },
  );
  const issues = new Map(matches.issues.map((issue) => [issue.id, issue]));
  const issueIds = [...issues.keys()];
  const approvals = await projects.approvals.pendingOn(issueIds);
  const followed = await projects.subscriptions.followedBy(
    projects.tx.read(),
    viewer.userId,
    issueIds,
  );
  const mine = (issue: IssueListItem): boolean =>
    issue.ownerUserId === viewer.userId ||
    issue.createdById === viewer.userId ||
    followed.has(issue.id);

  // Each project's statuses, for the badges and to tell finished issues.
  const statuses: Record<string, readonly StatusDefinition[]> = {};
  for (const projectId of new Set(
    matches.issues.map((issue) => issue.projectId),
  )) {
    try {
      statuses[projectId ?? ''] = await projects.issueQueries.statuses(
        viewer,
        projectId,
      );
    } catch {
      // A project the viewer does not see, of an issue they own: its issues show by their status keys.
      statuses[projectId ?? ''] = BUILTIN_STATUSES;
    }
  }
  const finished = (issue: IssueListItem): boolean => {
    const category = statuses[issue.projectId ?? '']?.find(
      (status) => status.key === issue.statusKey,
    )?.category;
    return category === 'done' || category === 'closed';
  };
  // Work waits for its blockers only where it would start: not in backlog, where nothing runs.
  const waitsForBlockers = (issue: IssueListItem): boolean =>
    issue.blockedCount > 0 && issue.statusKey !== BACKLOG_STATUS;

  // Who is waited on: one read of the names.
  const people = await deps.agents.people.names(deps.agents.tx.read(), [
    ...failed.flatMap((card) => card.decision.userIds),
    ...matches.issues.map((issue) => issue.ownerUserId),
  ]);
  const person = (userId: string) => ({
    userId,
    name: people.get(userId) ?? null,
  });

  // Per issue and agent: the most pressing entry wins.
  const entries = new Map<string, Map<string, AgentBoardEntry>>();
  const rank = (state: AgentBoardState) => AGENT_BOARD_STATES.indexOf(state);
  const waitRank = (kind: AgentWaitKind) => AGENT_WAIT_KINDS.indexOf(kind);
  /** Whether `a` is more pressing than `b`. */
  const before = (a: AgentBoardEntry, b: AgentBoardEntry): boolean =>
    rank(a.state) < rank(b.state) ||
    (a.state === 'waiting' &&
      b.state === 'waiting' &&
      waitRank(a.waiting!.kind) < waitRank(b.waiting!.kind));
  const put = (issueId: string, entry: AgentBoardEntry) => {
    let byAgent = entries.get(issueId);
    if (!byAgent)
      entries.set(issueId, (byAgent = new Map<string, AgentBoardEntry>()));
    const known = byAgent.get(entry.agentId);
    if (!known || before(entry, known)) byAgent.set(entry.agentId, entry);
  };
  const waiting = (agentId: string, issueId: string, wait: AgentBoardWaiting) =>
    put(issueId, {
      agentId,
      state: 'waiting',
      run: null,
      queue: null,
      blockedBy: null,
      waiting: wait,
      idle: null,
    });

  // Open runs: held ones are work, queued ones the queue.
  const openOn = new Set<string>();
  for (const run of workload.runs) {
    const issue = issues.get(run.subject.id);
    if (!issue) continue;
    openOn.add(`${run.agentId}:${issue.id}`);
    const visible = seesRun(run, caller);
    const entry: AgentBoardEntry = {
      agentId: run.agentId,
      state: run.status === 'queued' ? 'queued' : 'working',
      run: runOf(run, visible),
      queue: run.wait
        ? {
            ...run.wait,
            detail: visible ? run.wait.detail : null,
            // Structured wait parameters must preserve the same run-detail visibility.
            ...(!visible && run.wait.params
              ? {
                  params: Object.fromEntries(
                    Object.entries(run.wait.params).filter(
                      ([name]) => name !== 'detail',
                    ),
                  ),
                }
              : {}),
          }
        : null,
      blockedBy: null,
      waiting: null,
      idle: null,
    };
    // Of two held or two queued runs of an agent on one issue, the one held longest or first in line shows.
    const known = entries.get(issue.id)?.get(run.agentId);
    if (
      known &&
      known.state === entry.state &&
      (known.run?.since ?? '') <= (entry.run?.since ?? '')
    )
      continue;
    put(issue.id, entry);
  }

  for (const card of failed) {
    const issue = issues.get(card.issueId);
    if (!issue) continue;
    const decides = card.decision.userIds.includes(viewer.userId);
    waiting(card.agentId, issue.id, {
      kind: 'failedRun',
      since: card.decision.createdAt,
      waitingFor: card.decision.userIds.map(person),
      viewerDecides: decides,
      path: decides ? INBOX_DECISIONS_PATH : issuePath(issue.identifier),
      detail: card.reason,
    });
  }

  for (const request of approvals) {
    const issue = issues.get(request.issueId);
    if (!issue || request.requestedByType !== AGENT_KIND) continue;
    const decides = request.approverUserIds.includes(viewer.userId);
    waiting(request.requestedById, issue.id, {
      kind: 'approval',
      since: request.createdAt,
      waitingFor: request.approverUserIds.map((userId, index) => ({
        userId,
        name: request.approverNames[index] ?? null,
      })),
      viewerDecides: decides,
      // Decided in the inbox; anyone else sees the request on the issue.
      path: decides ? INBOX_DECISIONS_PATH : issuePath(issue.identifier),
      detail: request.toStatus,
    });
  }

  // The issues an agent executes: waiting on the owner in Blocked or a review status, queued behind the unfinished
  // issues they wait for (the agent is woken when those finish), else idle.
  const executed = matches.issues.filter(
    (issue) =>
      issue.executor?.type === AGENT_KIND &&
      issue.executor.id &&
      !finished(issue),
  );
  // Idle or queued behind its blockers only without an open run of its agent; waiting on a person whatever the run
  // does, since the run that asked is often still closing.
  const quiet = (issue: IssueListItem) =>
    !openOn.has(`${issue.executor?.id ?? ''}:${issue.id}`);
  const blockers = await projects.subtasks.visibleBlockers(
    viewer,
    executed
      .filter((issue) => quiet(issue) && waitsForBlockers(issue))
      .map((issue) => issue.id),
  );
  const agents = new Map(
    (await deps.agents.agents.list({ includeArchived: true })).map((agent) => [
      agent.id,
      agent,
    ]),
  );
  // Why an idle one is idle: the agent's newest ended run there, and whether its status starts an agent on entering.
  const lastRuns = new Map(
    (
      await deps.agents.runs.lastEnded(
        ISSUE_SUBJECT,
        executed.filter(quiet).map((issue) => issue.id),
      )
    ).map((run) => [`${run.agentId}:${run.subject.id}`, run]),
  );
  const catalogs = new Map<
    string,
    Awaited<ReturnType<typeof projects.workflows.catalogs.forProject>>
  >();
  const autoRuns = async (issue: IssueListItem, agentId: string) => {
    const key = issue.projectId ?? '';
    let catalog = catalogs.get(key);
    if (!catalog)
      catalogs.set(
        key,
        (catalog = await projects.workflows.catalogs.forProject(
          projects.tx.read(),
          issue.projectId,
        )),
      );
    return (
      catalog.machine.states
        .find((state) => state.key === issue.statusKey)
        ?.rules?.some((rule) => {
          const named = rule.config?.agentId;
          return (
            rule.type === RUN_AGENT &&
            (typeof named !== 'string' || !named || named === agentId)
          );
        }) ?? false
    );
  };
  const editsIssues =
    viewer.permissions.scopes[businessKey('pm.issues', 'edit')] !== 'none';
  const idleOf = async (
    issue: IssueListItem,
    agentId: string,
  ): Promise<AgentBoardIdle> => {
    const agent = agents.get(agentId);
    const reason = idleReasonOf({
      statusKey: issue.statusKey,
      lastRun: lastRuns.get(`${agentId}:${issue.id}`) ?? null,
      autoRuns: await autoRuns(issue, agentId),
    });
    return {
      ...reason,
      mayStart:
        reason.reason !== 'backlog' &&
        editsIssues &&
        agent !== undefined &&
        agent.archivedAt === null &&
        deps.agents.agents.mayInvoke(agent, viewer.userId),
    };
  };
  for (const issue of executed) {
    if (issue.executor?.type !== AGENT_KIND || !issue.executor.id) continue;
    const agentId = issue.executor.id;
    const kind: AgentWaitKind | null =
      issue.statusKey === QUESTION_STATUS && issue.blockedCount === 0
        ? 'question'
        : issue.statusKey === PROPOSAL_REVIEW_STATUS
          ? 'proposal'
          : REVIEW_STATUSES.has(issue.statusKey)
            ? 'review'
            : null;
    if (kind)
      waiting(agentId, issue.id, {
        kind,
        since: issue.lastActivityAt,
        waitingFor: [person(issue.ownerUserId)],
        viewerDecides: issue.ownerUserId === viewer.userId,
        // A design proposal is decided where it is shown in full: the issue's design section.
        path:
          kind === 'proposal'
            ? `${issuePath(issue.identifier)}#${DESIGN_SECTION_ANCHOR}`
            : issuePath(issue.identifier),
        detail: null,
      });
    else if (quiet(issue))
      put(issue.id, {
        agentId,
        state: waitsForBlockers(issue) ? 'queued' : 'idle',
        run: null,
        queue: null,
        blockedBy: waitsForBlockers(issue)
          ? (blockers.get(issue.id) ?? []).map((blocker) => ({
              issueId: blocker.issueId,
              identifier: blocker.identifier,
              title: blocker.title,
            }))
          : null,
        waiting: null,
        idle: waitsForBlockers(issue) ? null : await idleOf(issue, agentId),
      });
  }

  // The rows: one per issue, its most pressing entry first, the issue's executor first among equals. Only work
  // agents: an online agent never executes an issue or runs on one, and an agent no longer there is left out.
  const loads = new Map(workload.agents.map((load) => [load.agentId, load]));
  const named = new Map<string, AgentBoardAgent>();
  const rows: AgentBoardRow[] = [];
  for (const [issueId, byAgent] of entries) {
    const issue = issues.get(issueId);
    if (!issue) continue;
    const executorId =
      issue.executor?.type === AGENT_KIND ? issue.executor.id : null;
    const ordered = [...byAgent.values()]
      .filter((entry) => agents.get(entry.agentId)?.type === 'runner')
      .sort(
        (a, b) =>
          (before(a, b) ? -1 : before(b, a) ? 1 : 0) ||
          Number(b.agentId === executorId) - Number(a.agentId === executorId),
      );
    const [first, ...others] = ordered;
    if (!first) continue;
    for (const entry of ordered)
      if (!named.has(entry.agentId))
        named.set(
          entry.agentId,
          agentOf(agents.get(entry.agentId)!, loads.get(entry.agentId)),
        );
    rows.push({ ...first, issue, others, mine: mine(issue) });
  }
  // The agents with nothing here the viewer may give work to, so the idle ones show too.
  for (const agent of agents.values())
    if (
      !named.has(agent.id) &&
      agent.type === 'runner' &&
      agent.archivedAt === null &&
      (caller.readsAllRuns ||
        deps.agents.agents.mayInvoke(agent, viewer.userId))
    )
      named.set(agent.id, agentOf(agent, loads.get(agent.id)));

  // Each section in its own order: the viewer's decisions and then the longest waiting; the longest working; the queue
  // in claim order; the most recently updated.
  const byPosition = (row: AgentBoardRow) =>
    row.queue?.position ?? Number.POSITIVE_INFINITY;
  rows.sort(
    (a, b) =>
      rank(a.state) - rank(b.state) ||
      (a.state === 'waiting'
        ? Number(b.waiting?.viewerDecides) - Number(a.waiting?.viewerDecides) ||
          (a.waiting?.since ?? '').localeCompare(b.waiting?.since ?? '')
        : a.state === 'working'
          ? (a.run?.since ?? '').localeCompare(b.run?.since ?? '')
          : a.state === 'queued'
            ? byPosition(a) - byPosition(b) ||
              (a.queue?.agentPosition ?? 0) - (b.queue?.agentPosition ?? 0) ||
              (a.run?.since ?? '').localeCompare(b.run?.since ?? '')
            : b.issue.updatedAt.localeCompare(a.issue.updatedAt)),
  );
  const summary = noCounts();
  for (const row of rows) summary[row.state] += 1;

  return {
    rows,
    agents: Object.fromEntries(named),
    summary: { ...summary, runners: workload.runners },
    statuses,
    truncated: matches.truncated || workload.truncated,
    generatedAt: (deps.now?.() ?? new Date()).toISOString(),
  };
}

/**
 * "Start" on an idle issue: the agent executing it starts its work, as when given the issue with "Start now"
 * answered (`AgentWork.startNow`), for the viewer, who must see the issue and may edit issues; waking the agent is
 * checked there. Nothing starts in backlog or while the issue waits for unfinished issues (`skipped`).
 */
export async function startAgentBoardIssue(
  deps: {
    readonly projects: () => Pick<Projects, 'issueQueries' | 'tx'>;
    readonly work: Pick<AgentWork, 'startNow'>;
  },
  viewer: Viewer,
  issueId: string,
): Promise<AgentBoardStartResult> {
  const projects = deps.projects();
  const issue = await projects.issueQueries.detail(viewer, issueId);
  if (issue.executor?.type !== AGENT_KIND)
    throw new ProtocolError('CONFLICT', 'No agent executes this issue.', {
      code: 'NO_AGENT_EXECUTOR',
    });
  if (viewer.permissions.scopes[businessKey('pm.issues', 'edit')] === 'none')
    throw new ProtocolError('FORBIDDEN', 'You may not change issues.', {
      code: 'ISSUE_EDIT_FORBIDDEN',
    });
  const attempt = await projects.tx.run((tx) =>
    deps.work.startNow(tx, issue, viewer.actor),
  );
  return { started: attempt.started, skipped: attempt.skipped ?? null };
}
