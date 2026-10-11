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
  WorkspaceCommitEvidenceSchema,
  type WorkspaceDecision,
  type WorkspaceDirectoryReport,
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
import { runsRepo, toExecutions } from '../core/runs/run.store.js';
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
      filter: (f) => f.and([f.or(chunk.map((id) => f.string('id').eq(id)))]),
    });
    for (const record of records) {
      if (
        record.runnerId !== runnerId &&
        !toExecutions(record.executionHistory).some(
          (execution) => execution.runnerId === runnerId,
        )
      )
        continue;
      found.set(record.id, {
        subjectKind: record.subjectKind,
        subjectId: record.subjectId,
      });
    }
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
    reporting: {
      intervalMs: deps.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS,
      decisions: true,
    },

    async report(runner, request) {
      if (request.diagnostics === true && request.directories === undefined)
        return {
          remove: [],
          keep: [],
          reporting: {
            intervalMs: deps.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS,
            decisions: true,
          },
        };
      const conn = tx.read();
      const reports: readonly WorkspaceDirectoryReport[] =
        request.directories ??
        request.workspaces.map((workspace) => ({
          ...workspace,
          subjectKey: '',
        }));
      const runs = await ownRuns(
        conn,
        runner.id,
        reports.flatMap((workspace) =>
          workspace.runId === undefined ? [] : [workspace.runId],
        ),
      );
      const legacy = new Map<string, RunSubject>();
      const failures = new Map<string, WorkspaceDecision['reason']>();
      for (const workspace of reports) {
        if (workspace.runId !== undefined) continue;
        if (
          !subjects
            .list()
            .some((binding) => binding.workspaces?.resolveKeys !== undefined)
        ) {
          failures.set(workspace.workDir, 'bindingUnavailable');
          continue;
        }
        const candidates: RunSubject[] = [];
        for (const binding of subjects.list()) {
          const ids =
            (
              await binding.workspaces?.resolveKeys?.(conn, [
                workspace.subjectKey,
              ])
            )?.get(workspace.subjectKey) ?? [];
          for (const subjectId of ids)
            candidates.push({ subjectKind: binding.kind, subjectId });
        }
        if (candidates.length !== 1) {
          failures.set(
            workspace.workDir,
            candidates.length > 1 ? 'ambiguousSubject' : 'subjectUnknown',
          );
          continue;
        }
        const candidate = candidates[0];
        const records = await runsRepo(conn).findMany({
          filter: {
            subjectKind: candidate.subjectKind,
            subjectId: candidate.subjectId,
          },
        });
        if (
          !records.some(
            (record) =>
              record.runnerId === runner.id ||
              toExecutions(record.executionHistory).some(
                (execution) => execution.runnerId === runner.id,
              ),
          )
        ) {
          failures.set(workspace.workDir, 'ownershipUnknown');
          continue;
        }
        legacy.set(workspace.workDir, candidate);
      }
      const settled = await settledSubjects(
        conn,
        subjects,
        new Map([...runs, ...legacy]),
      );
      const remove: string[] = [];
      const keep: string[] = [];
      const decisions: WorkspaceDecision[] = [];
      const workspaces: RunnerWorkspace[] = [];
      for (const workspace of reports) {
        const run =
          workspace.runId === undefined
            ? legacy.get(workspace.workDir)
            : runs.get(workspace.runId);
        const kind =
          run === undefined ? undefined : settled.get(run.subjectKind);
        const ended =
          run === undefined || kind === undefined
            ? null
            : kind.has(run.subjectId);
        let reason: WorkspaceDecision['reason'] =
          ended === true
            ? 'settled'
            : ended === false
              ? 'active'
              : 'bindingUnavailable';
        if (run === undefined) {
          reason = failures.get(workspace.workDir) ?? 'runNotFound';
          if (
            workspace.runId !== undefined &&
            (await runsRepo(conn).findOne({ filter: { id: workspace.runId } }))
          )
            reason = 'ownershipUnknown';
        }
        const evidence =
          ended === true && run !== undefined
            ? ((
                await subjects
                  .get(run.subjectKind)
                  ?.workspaces?.commits?.(conn, [run.subjectId])
              )?.get(run.subjectId) ?? [])
            : [];
        const commits = evidence.filter(
          (item) => WorkspaceCommitEvidenceSchema.safeParse(item).success,
        );
        if (workspace.runId !== undefined) {
          if (ended === true) remove.push(workspace.runId);
          else if (ended === false) keep.push(workspace.runId);
        }
        const decision: WorkspaceDecision = {
          reportId: request.reportId ?? '',
          workDir: workspace.workDir,
          ...(workspace.runId === undefined ? {} : { runId: workspace.runId }),
          lastUsedAt: workspace.lastUsedAt,
          settled: ended,
          reason,
          commits,
        };
        if (request.reportId !== undefined) decisions.push(decision);
        const previous = runner.workspaceUsage?.workspaces.find(
          (item) => item.workDir === workspace.workDir,
        );
        const cleanup =
          ended === true &&
          workspace.cleanup !== undefined &&
          previous?.decision !== undefined &&
          previous.subjectKind === run?.subjectKind &&
          previous.subjectId === run?.subjectId &&
          workspace.cleanup.reportId === previous.decision.reportId &&
          previous.runId === workspace.runId &&
          previous.lastUsedAt === workspace.lastUsedAt &&
          previous.settled === ended &&
          JSON.stringify(previous.decision.commits) === JSON.stringify(commits)
            ? workspace.cleanup
            : undefined;
        workspaces.push({
          ...(workspace.runId === undefined ? {} : { runId: workspace.runId }),
          workDir: workspace.workDir,
          unpushed: workspace.unpushed,
          lastUsedAt: workspace.lastUsedAt,
          subjectKind: run?.subjectKind ?? null,
          subjectId: run?.subjectId ?? null,
          settled: ended,
          ...(request.reportId === undefined ? {} : { decision }),
          ...(cleanup === undefined ? {} : { cleanup }),
        });
      }
      workspaces.sort(
        (a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt),
      );
      const usage: RunnerWorkspaceUsage = {
        intervalMs: deps.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS,
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
      return {
        remove,
        keep,
        ...(request.diagnostics === true
          ? {
              reporting: {
                intervalMs: deps.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS,
                decisions: true,
              },
            }
          : {}),
        ...(request.reportId === undefined ? {} : { decisions }),
      };
    },
  };
}
