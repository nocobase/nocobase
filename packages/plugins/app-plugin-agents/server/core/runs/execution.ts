/** Updates execution facts in the same transaction as the claim, report or state transition. */
import type { DatabaseConnection } from '@nocobase/db';

import type { RunExecution } from '../../../shared/runs.js';
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
  observedAt: string,
): Promise<void> {
  if (usage.length === 0) return;
  // Serialize concurrent reports before reading and replacing the JSON snapshot.
  await runsRepo(conn).updateMany({
    filter: { id: run.id },
    values: { lastActivityAt: observedAt },
  });
  const current = await findRunRecord(conn, run.id);
  if (!current) return;
  const executions = toExecutions(current.executionHistory);
  const index = executions.findIndex(
    (item) => item.attempt === Number(run.attempt),
  );
  const execution = executions[index];
  if (!execution || execution.runnerId !== run.runnerId) return;
  const primary = execution.tool ?? 'online';
  const actualModels = [
    ...new Set([
      ...execution.actualModels,
      ...usage
        .filter((item) => item.tool === primary && item.model?.trim())
        .map((item) => item.model!.trim()),
    ]),
  ];
  if (actualModels.length === execution.actualModels.length) return;
  executions[index] = { ...execution, actualModels };
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
