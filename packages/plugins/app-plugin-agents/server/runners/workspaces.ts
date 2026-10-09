/**
 * A runner's working directories (`RUNNER_ROUTES.workspaces`): the runner reports each one with the last run that
 * worked in it, and is told which may go. A run tells its subject, and the subject's binding tells whether the work on
 * it is over (`SubjectBinding.workspaces.settled`); a kind without that member never counts as over. Only the runner's
 * own runs are answered for, so a runner cannot learn about, or have removed, what another runner worked on.
 *
 * The report is kept on the runner (`agRunners.workspaceUsage`) for the runtimes pages, with what was decided for each
 * directory and the free space on the disk holding them. Whether a branch was merged is never judged here; the binding decides from the application's own records,
 * so a branch merged with a squash counts once its subject's work is over.
 */
import {
  TERMINAL_RUN_STATUSES,
  WORKSPACE_REPORT_INTERVAL_MS,
  type WorkspaceReport,
  type WorkspaceReporting,
  type WorkspacesRequest,
  type WorkspacesResponse,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Runner,
  RunnerWorkspace,
  RunnerWorkspaceUsage,
} from '../../shared/runners.js';
import type { SubjectRegistry } from '../core/runs/ports.js';
import { runsRepo } from '../core/runs/run.store.js';
import type { Clock } from '../kernel/clock.js';
import type { TxRunner } from '../kernel/tx.js';
import { runnersRepo } from './runner.store.js';

export interface RunnerWorkspaces {
  /** What a heartbeat answer announces: this application accepts workspace reports. */
  readonly reporting: WorkspaceReporting;
  /** Decides which of the runner's reported directories may go, and keeps the report for the runtimes pages. */
  report(
    runner: Runner,
    request: WorkspacesRequest,
  ): Promise<WorkspacesResponse>;
}

export interface RunnerWorkspacesDeps {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly subjects: SubjectRegistry;
  /** How often runners report; `WORKSPACE_REPORT_INTERVAL_MS` by default. */
  readonly intervalMs?: number;
}

/** How many runs one query reads. */
const CHUNK = 200;

interface RunSubject {
  readonly subjectKind: string;
  readonly subjectId: string;
}

/** Of `runIds`, the ones `runnerId` worked on, with their subjects. */
async function ownRuns(
  conn: DatabaseConnection,
  runnerId: string,
  runIds: readonly string[],
): Promise<Map<string, RunSubject>> {
  const found = new Map<string, RunSubject>();
  for (let start = 0; start < runIds.length; start += CHUNK) {
    const chunk = runIds.slice(start, start + CHUNK);
    const records = await runsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.or(chunk.map((id) => f.string('id').eq(id))),
          f.string('runnerId').eq(runnerId),
        ]),
    });
    for (const record of records)
      found.set(record.id, {
        subjectKind: record.subjectKind,
        subjectId: record.subjectId,
      });
  }
  return found;
}

/** Of `subjectIds` of `kind`, the ones a run has not finished on (queued, dispatched or running, on any runner). */
async function busySubjects(
  conn: DatabaseConnection,
  kind: string,
  subjectIds: readonly string[],
): Promise<Set<string>> {
  const busy = new Set<string>();
  for (let start = 0; start < subjectIds.length; start += CHUNK) {
    const chunk = subjectIds.slice(start, start + CHUNK);
    const records = await runsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.string('subjectKind').eq(kind),
          f.or(chunk.map((id) => f.string('subjectId').eq(id))),
          ...TERMINAL_RUN_STATUSES.map((status) =>
            f.string('status').ne(status),
          ),
        ]),
    });
    for (const record of records) busy.add(record.subjectId);
  }
  return busy;
}

/**
 * For each subject kind, the subjects whose work is over; a kind whose binding cannot say is absent. A subject a run
 * has not finished on is never over, whatever its binding says: work on it goes on somewhere.
 */
async function settledSubjects(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  runs: ReadonlyMap<string, RunSubject>,
): Promise<Map<string, ReadonlySet<string>>> {
  const byKind = new Map<string, Set<string>>();
  for (const run of runs.values()) {
    const ids = byKind.get(run.subjectKind) ?? new Set<string>();
    ids.add(run.subjectId);
    byKind.set(run.subjectKind, ids);
  }
  const settled = new Map<string, ReadonlySet<string>>();
  for (const [kind, ids] of byKind) {
    const binding = subjects.get(kind)?.workspaces;
    if (binding === undefined) continue;
    const over = [...(await binding.settled(conn, [...ids]))].filter((id) =>
      ids.has(id),
    );
    const busy = await busySubjects(conn, kind, over);
    settled.set(kind, new Set(over.filter((id) => !busy.has(id))));
  }
  return settled;
}

export function createRunnerWorkspaces(
  deps: RunnerWorkspacesDeps,
): RunnerWorkspaces {
  const { tx, clock, subjects } = deps;
  return {
    reporting: { intervalMs: deps.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS },

    async report(runner, request) {
      const reported = new Map<string, WorkspaceReport>();
      for (const workspace of request.workspaces)
        reported.set(workspace.runId, workspace);
      const runIds = [...reported.keys()];
      const conn = tx.read();
      const runs = await ownRuns(conn, runner.id, runIds);
      const settled = await settledSubjects(conn, subjects, runs);
      const remove: string[] = [];
      const keep: string[] = [];
      const workspaces: RunnerWorkspace[] = [];
      for (const workspace of request.workspaces) {
        const run = runs.get(workspace.runId);
        const kind =
          run === undefined ? undefined : settled.get(run.subjectKind);
        const ended =
          run === undefined || kind === undefined
            ? null
            : kind.has(run.subjectId);
        if (ended === true) remove.push(workspace.runId);
        else if (ended === false) keep.push(workspace.runId);
        workspaces.push({
          runId: workspace.runId,
          workDir: workspace.workDir,
          unpushed: workspace.unpushed,
          lastUsedAt: workspace.lastUsedAt,
          subjectKind: run?.subjectKind ?? null,
          subjectId: run?.subjectId ?? null,
          settled: ended,
        });
      }
      workspaces.sort(
        (a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt),
      );
      const usage: RunnerWorkspaceUsage = {
        disk:
          request.disk === undefined
            ? null
            : {
                freeBytes: request.disk.freeBytes,
                totalBytes: request.disk.totalBytes,
                minFreeBytes: request.disk.minFreeBytes ?? null,
              },
        count: workspaces.length,
        unpushedCount: workspaces.filter((workspace) => workspace.unpushed)
          .length,
        measuredAt: clock.now().toISOString(),
        workspaces,
      };
      await tx.run(async ({ conn: write, emit }) => {
        await runnersRepo(write).updateMany({
          filter: { id: runner.id },
          values: { workspaceUsage: usage },
        });
        emit({ type: 'runner.changed', runnerId: runner.id });
      });
      return { remove, keep };
    },
  };
}
