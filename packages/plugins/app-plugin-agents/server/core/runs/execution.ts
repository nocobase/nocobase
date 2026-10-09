/** Updates execution facts in the same transaction as the claim, report or state transition. */
import type { DatabaseConnection } from '@nocobase/db';

import type { RunExecution, RunEffortReport } from '../../../shared/runs.js';
import {
  findRunRecord,
  runsRepo,
  toExecutions,
  type RunRecord,
} from './run.store.js';

export function executionHistory(
  run: RunRecord,
  execution: RunExecution,
): readonly RunExecution[] {
  return [...toExecutions(run.executionHistory), execution];
}

/** Only the primary tool identifies the run's model; a helper tool's model must not replace it. */
export async function recordActualModels(
  conn: DatabaseConnection,
  run: RunRecord,
  usage: readonly { readonly tool: string; readonly model?: string | null }[],
  _observedAt: string,
  effortReports: readonly RunEffortReport[] = [],
  locked = false,
): Promise<void> {
  const previous = toExecutions(run.executionHistory).find(
    (item) =>
      item.attempt === Number(run.attempt) && item.runnerId === run.runnerId,
  );
  if (!previous) return;
  const models = [
    ...new Set(
      usage
        .filter(
          (item) =>
            item.tool === (previous.tool ?? 'online') && item.model?.trim(),
        )
        .map((item) => item.model!.trim()),
    ),
  ];
  const hasEffortChange = (execution: RunExecution): boolean => {
    let last = execution.effortReports?.at(-1);
    return effortReports.some((report) => {
      if (last && report.at < last.at) return false;
      const changed =
        !last || last.effort !== report.effort || last.source !== report.source;
      last = report;
      return changed;
    });
  };
  if (
    models.every((model) => previous.actualModels.includes(model)) &&
    !hasEffortChange(previous)
  )
    return;
  // Lock only when there are new facts. Event batches already hold the row through their activity update.
  if (!locked)
    await runsRepo(conn).updateMany({
      filter: { id: run.id },
      values: { id: run.id },
    });
  const current = await findRunRecord(conn, run.id);
  if (!current) return;
  const executions = toExecutions(current.executionHistory);
  const index = executions.findIndex(
    (item) => item.attempt === Number(run.attempt),
  );
  const execution = executions[index];
  if (!execution || execution.runnerId !== run.runnerId) return;
  const actualModels = [...new Set([...execution.actualModels, ...models])];
  if (
    actualModels.length === execution.actualModels.length &&
    !hasEffortChange(execution)
  )
    return;
  const reports = [...(execution.effortReports ?? [])];
  for (const report of effortReports) {
    const last = reports.at(-1);
    if (last && report.at < last.at) continue;
    if (!last || last.effort !== report.effort || last.source !== report.source)
      reports.push(report);
  }
  const latest = reports.at(-1);
  executions[index] = {
    ...execution,
    actualModels,
    ...(latest
      ? {
          effortReports: reports,
          actualEffort: latest.effort,
          actualEffortSource: latest.source,
          actualEffortAt: latest.at,
        }
      : {}),
  };
  await runsRepo(conn).updateMany({
    filter: { id: run.id },
    values: { executionHistory: executions },
  });
}

/** Re-read after usage recording, so ending the attempt cannot overwrite its newly reported models. */
export async function endExecution(
  conn: DatabaseConnection,
  run: RunRecord,
  finishedAt: string,
  failureReason: string | null,
): Promise<void> {
  const current = await findRunRecord(conn, run.id);
  if (!current) return;
  const executions = toExecutions(current.executionHistory);
  const index = executions.findIndex(
    (item) => item.attempt === Number(run.attempt),
  );
  const execution = executions[index];
  if (!execution || execution.runnerId !== run.runnerId) return;
  executions[index] = { ...execution, finishedAt, failureReason };
  await runsRepo(conn).updateMany({
    filter: { id: run.id },
    values: { executionHistory: executions },
  });
}
