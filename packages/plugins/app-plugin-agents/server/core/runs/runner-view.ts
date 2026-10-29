/**
 * Agent runs as the runner pages see them: how many runs each runner holds (its slots count them beside its jobs),
 * which agents each runner may run (`takes`), which runs one holds (`held`) and its latest runs (`recent`), without the
 * subject's link of a private kind's run the viewer is not part of. `runnerForViewer` leaves out what identifies a
 * runner's machine for those who may not see it.
 */
import type { Clock } from '../../kernel/clock.js';

import type { AgentTool } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import {
  runnerTakesAgent,
  type Runner,
  type RunnerHeldItem,
  type RunnerRunsPage,
  type RunnerRunsCursor,
  type RunnerWorkTarget,
} from '../../../shared/runners.js';
import type { Run } from '../../../shared/runs.js';
import type { AgentService } from '../agents/agent.service.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { SubjectRegistry } from './ports.js';

import { ACTIVE, runsRepo, toRun, type RunRecord } from './run.store.js';

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
  return (await runsHeldSnapshot(conn, runnerId)).byTool;
}

/** Total occupancy includes runs whose tool has not been recorded. */
export async function runsHeldSnapshot(
  conn: DatabaseConnection,
  runnerId: string,
): Promise<{ runs: number; byTool: Partial<Record<AgentTool, number>> }> {
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
  return { runs: held.length, byTool: counts };
}

/** How many of a runner's latest runs its page shows. */
export const RECENT_RUNS = 20;

/** What a runner shows its viewer of its machine. */
export interface RunnerMachineView {
  readonly canSeeMachine: boolean;
  readonly hostname: string | null;
  readonly tools: Runner['tools'];
}

/**
 * The runner as `seesMachine` decides: its host name, where its tools are installed and where its working directories
 * are name the machine and, through home directories, its user. Its owner, the managers of runners and those who may
 * wake an agent see them (the routes decide); everyone else sees none of them, and of the working directories only
 * their totals.
 */
/** Internal quota revisions never cross a user-facing runtime boundary. */
export function runnerPublicData<T extends Runner>(
  runner: T,
): Omit<T, 'quotaRevision'> {
  const { quotaRevision: _revision, ...visible } = runner;
  return visible;
}

export function runnerForViewer(
  runner: Runner,
  seesMachine: boolean,
): Omit<Runner, 'hostname' | 'tools' | 'quotaRevision'> & RunnerMachineView {
  const visible = runnerPublicData(runner);
  if (seesMachine) return { ...visible, canSeeMachine: true };
  return {
    ...visible,
    canSeeMachine: false,
    hostname: null,
    tools: runner.tools.map(({ path: _path, ...tool }) => tool),
    ...(runner.workspaceUsage
      ? { workspaceUsage: { ...runner.workspaceUsage, workspaces: [] } }
      : {}),
  };
}

export interface RunnerView {
  recentCount(runnerId: string): Promise<number>;
  /** What each of `runners` takes work for: the agents it may run, by what people configured and what it reported. */
  takes(
    runners: readonly Runner[],
  ): Promise<ReadonlyMap<string, readonly RunnerWorkTarget[]>>;
  /** For a runner's page: the runs it holds now, as `viewerUserId` may see them. */
  held(runner: Runner, viewerUserId: string): Promise<RunnerHeldItem[]>;
  /** For a runner's page: its latest runs, newest first, as `viewerUserId` may see them. */
  recent(
    runner: Runner,
    viewerUserId: string,
    cursor?: RunnerRunsCursor,
  ): Promise<RunnerRunsPage>;
}

export function createRunnerView(deps: {
  readonly clock: Clock;
  readonly agents: Pick<AgentService, 'list' | 'names'>;
  readonly subjects: Pick<SubjectRegistry, 'get'>;
  readonly tx: TxRunner;
}): RunnerView {
  const agentNames = (
    runs: readonly { readonly agentId: string }[],
  ): Promise<ReadonlyMap<string, string>> =>
    deps.agents.names(
      deps.tx.read(),
      runs.map((run) => run.agentId),
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
  const subjectLabels = async (
    runs: readonly Run[],
    viewerUserId: string,
  ): Promise<Map<string, string>> => {
    const labels = new Map<string, string>();
    const byKind = new Map<string, string[]>();
    for (const run of runs)
      if (pathOf(run, viewerUserId))
        byKind.set(run.subject.kind, [
          ...(byKind.get(run.subject.kind) ?? []),
          run.subject.id,
        ]);
    for (const [kind, ids] of byKind) {
      const facts = await deps.subjects
        .get(kind)
        ?.reports?.describe(deps.tx.read(), viewerUserId, [...new Set(ids)]);
      for (const [id, fact] of facts ?? [])
        if (fact.visible) labels.set(`${kind}:${id}`, fact.label);
    }
    return labels;
  };
  return {
    async recentCount(runnerId) {
      return (
        await runsRepo(deps.tx.read()).findMany({
          filter: { runnerId },
          select: (s) => s.fields('id'),
          limit: RECENT_RUNS + 1,
        })
      ).length;
    },
    async takes(runners) {
      const now = deps.clock.now().getTime();
      const agents = (await deps.agents.list()).filter(
        (agent) => agent.status === 'enabled',
      );
      return new Map(
        runners.map((runner) => [
          runner.id,
          agents
            .filter((agent) => runnerTakesAgent(runner, agent, now))
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
      const names = await agentNames(records);
      const runs = records.map(toRun);
      const labels = await subjectLabels(runs, viewerUserId);
      return runs.map((run) => ({
        subjectLabel:
          labels.get(`${run.subject.kind}:${run.subject.id}`) ?? null,
        failureReason: run.failureReason,
        id: run.id,
        kind: 'run' as const,
        title: names.get(run.agentId) ?? run.agentId,
        status: run.status === 'running' ? 'running' : 'dispatched',
        startedAt: run.startedAt ?? run.dispatchedAt,
        path: pathOf(run, viewerUserId),
      }));
    },
    async recent(runner, viewerUserId, cursor) {
      const query = deps.tx
        .read()
        .query.selectFrom('agRuns')
        .selectAll()
        .where('runnerId', '=', runner.id);
      const records: RunRecord[] = [];
      // Separate index ranges avoid scanning all preceding pages or sorting NULLs
      // differently across dialects. Never-started runs follow dated runs.
      if (cursor?.startedAt) {
        records.push(
          ...(await query
            .where('startedAt', '=', cursor.startedAt)
            .where('id', '<', cursor.id)
            .orderBy('id', 'desc')
            .limit(RECENT_RUNS + 1)
            .execute<RunRecord>()),
        );
      }
      if (
        (!cursor || cursor.startedAt !== null) &&
        records.length < RECENT_RUNS + 1
      ) {
        const older = cursor
          ? query.where('startedAt', '<', cursor.startedAt)
          : query.where('startedAt', 'is not', null);
        records.push(
          ...(await older
            .orderBy('startedAt', 'desc')
            .orderBy('id', 'desc')
            .limit(RECENT_RUNS + 1 - records.length)
            .execute<RunRecord>()),
        );
      }
      if (records.length < RECENT_RUNS + 1) {
        const undated = query.where('startedAt', 'is', null);
        records.push(
          ...(await (
            cursor?.startedAt === null
              ? undated.where('id', '<', cursor.id)
              : undated
          )
            .orderBy('id', 'desc')
            .limit(RECENT_RUNS + 1 - records.length)
            .execute<RunRecord>()),
        );
      }
      const hasMore = records.length > RECENT_RUNS;
      records.length = Math.min(records.length, RECENT_RUNS);
      const last = records.at(-1);
      const nextCursor =
        hasMore && last
          ? Buffer.from(
              JSON.stringify({
                startedAt:
                  last.startedAt === null
                    ? null
                    : new Date(last.startedAt).toISOString(),
                id: last.id,
              }),
            ).toString('base64url')
          : null;
      const names = await agentNames(records);
      const runs = records.map(toRun);
      const labels = await subjectLabels(runs, viewerUserId);
      return {
        meta: { nextCursor },
        data: runs.map((run) => ({
          subjectLabel:
            labels.get(`${run.subject.kind}:${run.subject.id}`) ?? null,
          failureReason: run.failureReason,
          id: run.id,
          title: names.get(run.agentId) ?? run.agentId,
          status: run.status,
          startedAt: run.startedAt ?? run.dispatchedAt,
          finishedAt: run.finishedAt,
          createdAt: run.createdAt,
          path: pathOf(run, viewerUserId),
        })),
      };
    },
  };
}
