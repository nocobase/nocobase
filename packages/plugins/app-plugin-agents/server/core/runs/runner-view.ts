/**
 * Agent runs as the runner pages see them: how many runs each runner holds (its slots count them beside its jobs),
 * which agents each runner may run (`takes`), which runs one holds (`held`) and its latest runs (`recent`), without the
 * subject's link of a private kind's run the viewer is not part of. `runnerForViewer` leaves out what identifies a
 * runner's machine for those who may not see it.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import {
  runnerTakesAgent,
  type Runner,
  type RunnerHeldItem,
  type RunnerRecentRun,
  type RunnerWorkTarget,
} from '../../../shared/runners.js';
import type { Run } from '../../../shared/runs.js';
import type { AgentService } from '../agents/agent.service.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { SubjectRegistry } from './ports.js';

import { ACTIVE, runsRepo, toRun } from './run.store.js';

/** How many runs each of `runnerIds` holds now; they take its slots. */
export async function runsHeldBy(
  conn: DatabaseConnection,
  runnerIds: readonly string[],
): Promise<ReadonlyMap<string, number>> {
  const counts = new Map<string, number>();
  if (runnerIds.length === 0) return counts;
  const held = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.or(runnerIds.map((id) => f.string('runnerId').eq(id))),
        f.or(ACTIVE.map((status) => f.string('status').eq(status))),
      ]),
  });
  for (const run of held)
    if (run.runnerId)
      counts.set(run.runnerId, (counts.get(run.runnerId) ?? 0) + 1);
  return counts;
}

/**
 * The runs `runnerId` holds now, by the coding tool each runs with (set when it was claimed); a tool it runs nothing of
 * is left out. A tool's limit (`Runner.toolSlots`) counts them.
 */
export async function runsHeldByTool(
  conn: DatabaseConnection,
  runnerId: string,
): Promise<Partial<Record<AgentTool, number>>> {
  const held = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('runnerId').eq(runnerId),
        f.or(ACTIVE.map((status) => f.string('status').eq(status))),
      ]),
  });
  const counts: Partial<Record<AgentTool, number>> = {};
  for (const run of held) {
    const tool = run.tool as AgentTool | null;
    if (tool) counts[tool] = (counts[tool] ?? 0) + 1;
  }
  return counts;
}

/** How many of a runner's latest runs its page shows. */
export const RECENT_RUNS = 10;

/** What a runner shows its viewer of its machine. */
export interface RunnerMachineView {
  readonly hostname: string | null;
  readonly tools: Runner['tools'];
}

/**
 * The runner as `seesMachine` decides: its host name and where its tools are installed name the machine and, through
 * home directories, its user. Its owner, the managers of runners and those who may wake an agent see them (the routes
 * decide); everyone else sees neither.
 */
export function runnerForViewer<T extends Runner>(
  runner: T,
  seesMachine: boolean,
): Omit<T, 'hostname' | 'tools'> & RunnerMachineView {
  if (seesMachine) return runner;
  return {
    ...runner,
    hostname: null,
    tools: runner.tools.map(({ path: _path, ...tool }) => tool),
  };
}

export interface RunnerView {
  /** What each of `runners` takes work for: the agents it may run, by what people configured and what it reported. */
  takes(
    runners: readonly Runner[],
  ): Promise<ReadonlyMap<string, readonly RunnerWorkTarget[]>>;
  /** For a runner's page: the runs it holds now, as `viewerUserId` may see them. */
  held(runner: Runner, viewerUserId: string): Promise<RunnerHeldItem[]>;
  /** For a runner's page: its latest runs, newest first, as `viewerUserId` may see them. */
  recent(runner: Runner, viewerUserId: string): Promise<RunnerRecentRun[]>;
}

export function createRunnerView(deps: {
  readonly agents: Pick<AgentService, 'list'>;
  readonly subjects: Pick<SubjectRegistry, 'get'>;
  readonly tx: TxRunner;
}): RunnerView {
  const agentNames = async (): Promise<ReadonlyMap<string, string>> =>
    new Map(
      (await deps.agents.list({ includeArchived: true })).map((agent) => [
        agent.id,
        agent.name,
      ]),
    );
  /** The subject's link of `run`, or null when it has none or the viewer is not part of a private kind's run. */
  const pathOf = (run: Run, viewerUserId: string): string | null => {
    const binding = deps.subjects.get(run.subject.kind);
    const hidden =
      binding?.private === true &&
      run.actorUserId !== viewerUserId &&
      run.ownerUserId !== viewerUserId;
    return !hidden && binding?.path
      ? binding.path.replaceAll('{id}', encodeURIComponent(run.subject.id))
      : null;
  };
  return {
    async takes(runners) {
      const agents = (await deps.agents.list()).filter(
        (agent) => agent.type === 'runner',
      );
      return new Map(
        runners.map((runner) => [
          runner.id,
          agents
            .filter((agent) => runnerTakesAgent(runner, agent))
            .map((agent) => ({ id: agent.id, name: agent.name })),
        ]),
      );
    },
    async held(runner, viewerUserId) {
      const records = await runsRepo(deps.tx.read()).findMany({
        filter: (f) =>
          f.and([
            f.string('runnerId').eq(runner.id),
            f.or(ACTIVE.map((status) => f.string('status').eq(status))),
          ]),
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
      const names = await agentNames();
      return records.map(toRun).map((run) => ({
        id: run.id,
        kind: 'run' as const,
        title: names.get(run.agentId) ?? run.agentId,
        status: run.status === 'running' ? 'running' : 'dispatched',
        startedAt: run.startedAt ?? run.dispatchedAt,
        path: pathOf(run, viewerUserId),
      }));
    },
    async recent(runner, viewerUserId) {
      const records = await runsRepo(deps.tx.read()).findMany({
        filter: (f) => f.string('runnerId').eq(runner.id),
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
        limit: RECENT_RUNS,
      });
      const names = await agentNames();
      return records.map(toRun).map((run) => ({
        id: run.id,
        title: names.get(run.agentId) ?? run.agentId,
        status: run.status,
        startedAt: run.startedAt ?? run.dispatchedAt,
        finishedAt: run.finishedAt,
        createdAt: run.createdAt,
        path: pathOf(run, viewerUserId),
      }));
    },
  };
}
