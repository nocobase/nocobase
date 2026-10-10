/**
 * The open runs on one kind of subject as a board of work shows them (`RunService.workload`): the runs held, with the
 * runner and the newest thing each reported, and the runs queued, with their place in the claim order and what holds
 * each, worked out by the claim's own rules (`claim.ts`) without claiming anything.
 *
 * Bounded reads, none per subject: the open runs of the kind, every queued run (for the claim order), every held run
 * (for the agents' and runners' counts and the busy subjects), the runners, the active jobs, the agents, the open
 * runs' inputs, and the newest event of each held run of the kind (at most one per runner slot).
 */
import type { AgentTool, RunnerFeature } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import { entryTools, type Agent } from '../../../shared/agents.js';
import { runsTool, toolLimit, type Runner } from '../../../shared/runners.js';
import {
  RUN_ACTIVITY_TEXT_MAX,
  type AgentLoad,
  type RunActivity,
  type RunWait,
  type Workload,
  type WorkloadQuery,
  type WorkloadRun,
} from '../../../shared/runs.js';
import type { Clock } from '../../kernel/clock.js';
import { covers } from '../../kernel/values.js';
import { variableRefs } from '../variables/index.js';
import { listAgents } from '../agents/index.js';
import {
  ACTIVE,
  eventsRepo,
  inputsRepo,
  runsRepo,
  toRun,
  type RunRecord,
} from './run.store.js';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
/** Queued runs read for the claim order, of every kind. */
const QUEUE_SCAN = 2000;
/** The event types a "last activity" line is made of. */
const ACTIVITY_TYPES = ['text', 'toolUse', 'status', 'error'] as const;

const time = (value: string | Date | null): number | null =>
  value === null ? null : new Date(value).getTime();

const iso = (value: string | Date | null): string | null =>
  value === null ? null : new Date(value).toISOString();

/** Claim order: the more urgent first, then the oldest, then by id. */
export function claimOrder(
  a: Pick<RunRecord, 'priority' | 'createdAt' | 'id'>,
  b: Pick<RunRecord, 'priority' | 'createdAt' | 'id'>,
): number {
  return (
    Number(a.priority) - Number(b.priority) ||
    (time(a.createdAt) ?? 0) - (time(b.createdAt) ?? 0) ||
    a.id.localeCompare(b.id)
  );
}

/** What `explainWait` needs to know about everything but the run itself. */
export interface WaitContext {
  readonly now: Date;
  readonly agent: Agent | null;
  /** Online runners. */
  readonly runners: readonly Runner[];
  /** Runs and jobs each runner holds now, by runner id. */
  readonly runnerUsed: ReadonlyMap<string, number>;
  /** The runs each runner holds now by coding tool, by runner id; absent for a runner that holds none. */
  readonly runnerToolUsed?: ReadonlyMap<
    string,
    Readonly<Partial<Record<AgentTool, number>>>
  >;
  /** Runs the agent holds now. */
  readonly agentActive: number;
  /** Whether a run of the same (agent, subject, thread) is held now. */
  readonly sameWorkActive: boolean;
}

type WaitFacts = Pick<
  RunRecord,
  'actorUserId' | 'availableAt' | 'claimFailures' | 'failureDetail'
> &
  Partial<Pick<RunRecord, 'teamOnlyVariables'>> & {
    readonly requires: readonly RunnerFeature[];
  };

const wait = (
  reason: RunWait['reason'],
  extra: Partial<Omit<RunWait, 'reason' | 'position' | 'agentPosition'>> = {},
): Omit<RunWait, 'position' | 'agentPosition'> => ({
  reason,
  until: null,
  tool: null,
  missing: [],
  detail: null,
  variables: [],
  ...extra,
});

/**
 * Why a queued run has not been taken, by the claim's rules in the claim's order (`RUN_WAIT_REASONS`); the first rule
 * that holds it answers.
 */
export function explainWait(
  run: WaitFacts,
  context: WaitContext,
): Omit<RunWait, 'position' | 'agentPosition'> {
  const { agent } = context;
  if (!agent || agent.archivedAt) return wait('agentArchived');
  const availableAt = time(run.availableAt);
  if (availableAt !== null && availableAt > context.now.getTime()) {
    const until = iso(run.availableAt);
    return wait('delayed', { until, params: until ? { until } : {} });
  }
  // An online run needs no runner: the application takes it as soon as an instance looks.
  if (agent.type === 'online') return wait('next');
  const tools = entryTools(agent);
  const tool = tools[0] ?? null;
  let fitting = context.runners;
  if (fitting.length === 0) return wait('noRunnerOnline');
  if (agent.runnerIds.length > 0) {
    fitting = fitting.filter((runner) => agent.runnerIds.includes(runner.id));
    if (fitting.length === 0) return wait('runnersOffline');
  }
  fitting = fitting.filter((runner) =>
    tools.some((each) => runsTool(runner, each)),
  );
  if (fitting.length === 0)
    return wait('toolUnavailable', { tool, params: tool ? { tool } : {} });
  fitting = fitting.filter(
    (runner) =>
      runner.trust === 'team' || runner.ownerUserId === run.actorUserId,
  );
  if (fitting.length === 0) return wait('noSharedRunner');
  const withFeatures = fitting.filter((runner) =>
    covers(runner.features, run.requires),
  );
  if (withFeatures.length === 0) {
    const offered = new Set(fitting.flatMap((runner) => runner.features));
    const missing = run.requires.filter((feature) => !offered.has(feature));
    return wait('missingFeatures', { missing, params: { features: missing } });
  }
  // Variables for team runners only, as the last claim by a personal runner found them (`claim.ts`).
  const teamOnly = variableRefs(run.teamOnlyVariables);
  const trusted =
    teamOnly.length > 0
      ? withFeatures.filter((runner) => runner.trust === 'team')
      : withFeatures;
  if (trusted.length === 0)
    return wait('secretsNotAllowed', {
      variables: teamOnly,
      params: { variables: [...new Set(teamOnly.map((each) => each.name))] },
    });
  if (context.sameWorkActive) return wait('sameWorkActive');
  if (context.agentActive >= agent.maxConcurrentRuns)
    return wait('concurrencyFull', {
      params: { active: context.agentActive, limit: agent.maxConcurrentRuns },
    });
  const free = trusted.filter(
    (runner) => (context.runnerUsed.get(runner.id) ?? 0) < runner.slots,
  );
  if (free.length === 0)
    return wait('runnersBusy', { params: { runners: trusted.length } });
  // A tool has room on a runner below its limit here and while the runner last said it could take more of it.
  const hasRoom = (runner: Runner, each: AgentTool): boolean =>
    (context.runnerToolUsed?.get(runner.id)?.[each] ?? 0) <
      toolLimit(runner, each) && (runner.toolLoad?.[each]?.free ?? 1) > 0;
  if (
    free.every(
      (runner) =>
        !tools.some((each) => runsTool(runner, each) && hasRoom(runner, each)),
    )
  ) {
    const full =
      tools.find((each) => free.some((runner) => runsTool(runner, each))) ??
      null;
    // The runner that runs it with the fewest of its slots taken: the one closest to room.
    const closest = full
      ? free
          .filter((runner) => runsTool(runner, full))
          .map((runner) => ({
            used: context.runnerToolUsed?.get(runner.id)?.[full] ?? 0,
            limit: toolLimit(runner, full),
          }))
          .sort((a, b) => a.used - a.limit - (b.used - b.limit))[0]
      : undefined;
    return wait('toolSlotsFull', {
      tool: full,
      params: full ? { tool: full, ...(closest ? closest : {}) } : {},
    });
  }
  if (Number(run.claimFailures) > 0)
    return wait('setupRetrying', {
      detail: run.failureDetail,
      params: run.failureDetail ? { detail: run.failureDetail } : {},
    });
  return wait('next');
}

const keyOf = (
  run: Pick<RunRecord, 'agentId' | 'subjectKind' | 'subjectId' | 'threadScope'>,
): string =>
  JSON.stringify([
    run.agentId,
    run.subjectKind,
    run.subjectId,
    run.threadScope,
  ]);

function triggerOf(payload: unknown): string | null {
  const value: unknown =
    typeof payload === 'string'
      ? (() => {
          try {
            return JSON.parse(payload) as unknown;
          } catch {
            return null;
          }
        })()
      : payload;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const trigger = (value as Record<string, unknown>).trigger;
    if (typeof trigger === 'string' && trigger !== '') return trigger;
  }
  return null;
}

function cut(text: string | null): string | null {
  if (!text) return null;
  const line = text.replace(/\s+/gu, ' ').trim();
  if (line === '') return null;
  return line.length > RUN_ACTIVITY_TEXT_MAX
    ? `${line.slice(0, RUN_ACTIVITY_TEXT_MAX - 1)}…`
    : line;
}

/** What a workload reads of the runners: every runner, and the jobs each holds (they take its slots). */
export interface WorkloadRunners {
  all(conn: DatabaseConnection): Promise<Runner[]>;
  jobsByRunner(conn: DatabaseConnection): Promise<ReadonlyMap<string, number>>;
}

export async function readWorkload(
  conn: DatabaseConnection,
  clock: Clock,
  runnerSource: WorkloadRunners,
  query: WorkloadQuery,
): Promise<Workload> {
  const now = clock.now();
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const open = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('subjectKind').eq(query.subjectKind),
        f.or(
          ['queued', ...ACTIVE].map((status) => f.string('status').eq(status)),
        ),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    limit: limit + 1,
  });
  const truncated = open.length > limit;
  const mine = open.slice(0, limit);

  const queued = (
    await runsRepo(conn).findMany({
      filter: { status: 'queued' },
      limit: QUEUE_SCAN,
    })
  ).sort(claimOrder);
  const held = await runsRepo(conn).findMany({
    filter: (f) => f.or(ACTIVE.map((status) => f.string('status').eq(status))),
  });
  const runners = await runnerSource.all(conn);
  const online = runners.filter((runner) => runner.status === 'online');
  const jobs = await runnerSource.jobsByRunner(conn);
  const agents = await listAgents(conn, true);
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  const runnerUsed = new Map<string, number>();
  const runnerToolUsed = new Map<string, Partial<Record<AgentTool, number>>>();
  const agentActive = new Map<string, number>();
  const busyKeys = new Set<string>();
  for (const run of held) {
    if (run.runnerId) {
      runnerUsed.set(run.runnerId, (runnerUsed.get(run.runnerId) ?? 0) + 1);
      const tool = run.tool as AgentTool | null;
      if (tool) {
        const counts = runnerToolUsed.get(run.runnerId) ?? {};
        counts[tool] = (counts[tool] ?? 0) + 1;
        runnerToolUsed.set(run.runnerId, counts);
      }
    }
    agentActive.set(run.agentId, (agentActive.get(run.agentId) ?? 0) + 1);
    busyKeys.add(keyOf(run));
  }
  for (const [runnerId, count] of jobs)
    runnerUsed.set(runnerId, (runnerUsed.get(runnerId) ?? 0) + count);

  // Places in the claim order: among the runs claimable now, and among each agent's queued runs.
  const position = new Map<string, number>();
  const agentPosition = new Map<string, number>();
  const agentQueued = new Map<string, number>();
  let claimable = 0;
  for (const run of queued) {
    const at = time(run.availableAt);
    if (at === null || at <= now.getTime())
      position.set(run.id, (claimable += 1));
    const count = (agentQueued.get(run.agentId) ?? 0) + 1;
    agentQueued.set(run.agentId, count);
    agentPosition.set(run.id, count);
  }

  // The newest input's trigger, per open run.
  const ids = mine.map((run) => run.id);
  const triggers = new Map<string, string>();
  if (ids.length > 0) {
    const inputs = await inputsRepo(conn).findMany({
      filter: (f) => f.or(ids.map((id) => f.string('runId').eq(id))),
      sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
    });
    for (const input of inputs) {
      if (triggers.has(input.runId)) continue;
      const trigger = triggerOf(input.payload);
      if (trigger) triggers.set(input.runId, trigger);
    }
  }

  // The newest activity of each held run: at most one per runner slot.
  const activity = new Map<string, RunActivity>();
  for (const run of mine) {
    if (!ACTIVE.includes(run.status)) continue;
    const event = await eventsRepo(conn).findOne({
      filter: (f) =>
        f.and([
          f.string('runId').eq(run.id),
          f.or(ACTIVITY_TYPES.map((type) => f.string('type').eq(type))),
        ]),
      sort: (sort) => sort.field('seq').desc(),
    });
    if (event)
      activity.set(run.id, {
        at: iso(event.at) ?? event.at,
        type: event.type as RunActivity['type'],
        tool: event.tool,
        text: cut(event.content ?? event.output),
      });
  }

  const runnerName = new Map(runners.map((runner) => [runner.id, runner.name]));
  const runs: WorkloadRun[] = mine.map((record) => {
    const run = toRun(record);
    const isQueued = record.status === 'queued';
    return {
      ...run,
      trigger: triggers.get(run.id) ?? null,
      runnerName: run.runnerId ? (runnerName.get(run.runnerId) ?? null) : null,
      lastActivity: activity.get(run.id) ?? null,
      wait: isQueued
        ? {
            ...explainWait(
              { ...record, requires: run.requires },
              {
                now,
                agent: agentById.get(run.agentId) ?? null,
                runners: online,
                runnerUsed,
                runnerToolUsed,
                agentActive: agentActive.get(run.agentId) ?? 0,
                sameWorkActive: busyKeys.has(keyOf(record)),
              },
            ),
            position: position.get(run.id) ?? null,
            agentPosition: agentPosition.get(run.id) ?? 1,
          }
        : null,
    };
  });
  // Held runs first, the longest-running first; then queued ones in claim order.
  const order = new Map(queued.map((run, index) => [run.id, index]));
  runs.sort((a, b) => {
    const aQueued = a.status === 'queued';
    const bQueued = b.status === 'queued';
    if (aQueued !== bQueued) return aQueued ? 1 : -1;
    if (aQueued)
      return (
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      );
    return 0;
  });

  const loads: AgentLoad[] = [];
  const agentsWithRuns = new Set(mine.map((run) => run.agentId));
  for (const agent of agents) {
    if (agent.archivedAt && !agentsWithRuns.has(agent.id)) continue;
    loads.push({
      agentId: agent.id,
      active: agentActive.get(agent.id) ?? 0,
      queued: agentQueued.get(agent.id) ?? 0,
      maxConcurrentRuns: agent.maxConcurrentRuns,
      // An online agent needs no runner; whether its model is offered is the availability's business.
      online:
        !agent.archivedAt &&
        (agent.type === 'online' ||
          online.some(
            (runner) =>
              entryTools(agent).some((tool) => runsTool(runner, tool)) &&
              (agent.runnerIds.length === 0 ||
                agent.runnerIds.includes(runner.id)),
          )),
    });
  }

  return {
    runs,
    truncated,
    agents: loads,
    runners: {
      online: online.length,
      busy: online.filter((runner) => (runnerUsed.get(runner.id) ?? 0) > 0)
        .length,
      slots: online.reduce((sum, runner) => sum + runner.slots, 0),
      used: online.reduce(
        (sum, runner) =>
          sum + Math.min(runnerUsed.get(runner.id) ?? 0, runner.slots),
        0,
      ),
    },
  };
}
