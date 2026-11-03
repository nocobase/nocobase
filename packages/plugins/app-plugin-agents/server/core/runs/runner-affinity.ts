import type { RunExecutionSnapshot } from '../../../shared/runs.js';
import type { Runner } from '../../../shared/runners.js';

export const UPGRADE_RECOVERY_MS: number = 5 * 60_000;

/** Only an actual upgrade interruption reserves a run; heartbeat changes never extend it. */
export function upgradeReservation(
  executions: readonly RunExecutionSnapshot[],
  runners: readonly Runner[],
  now: number,
): string | null {
  const last = executions.at(-1);
  const interruptedAt = last?.finishedAt
    ? Date.parse(last.finishedAt)
    : Number.NaN;
  if (
    last?.failureReason !== 'runnerUpgrade' ||
    !last.finishedAt ||
    !Number.isFinite(interruptedAt) ||
    now >= interruptedAt + UPGRADE_RECOVERY_MS
  )
    return null;
  const runner = runners.find((item) => item.id === last.runnerId);
  return runner && runner.status !== 'revoked' ? runner.id : null;
}
