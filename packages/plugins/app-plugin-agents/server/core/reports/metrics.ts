/**
 * The arithmetic of the run figures: percentiles, and how the runs went (failures, claim latency, duration, runs
 * lost). Pure, so it is tested without a database.
 */
import type { RunFigures } from '../../../shared/reports.js';

/** The run figures about how runs went. */
export type RunReliability = Pick<
  RunFigures,
  | 'runs'
  | 'completedRuns'
  | 'failedRuns'
  | 'failuresByReason'
  | 'claimLatencyP50Ms'
  | 'claimLatencyP95Ms'
  | 'runDurationP50Ms'
  | 'lostRuns'
>;
/** A run held by a runner that reported nothing for this long is lost. */
export const LOST_AFTER_MS: number = 3 * 3600 * 1000;

/** The nearest-rank percentile (`p` from 0 to 1), or null without values. */
export function percentile(
  values: readonly number[],
  p: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(p * sorted.length) - 1),
  );
  return sorted[index] ?? null;
}

/** What the reliability figures read of a run. */
export interface RunFacts {
  readonly status: string;
  readonly failureReason: string | null;
  readonly createdAt: string;
  readonly dispatchedAt: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly lastActivityAt: string | null;
}

const at = (value: string | null): number | null =>
  value ? Date.parse(value) : null;

function elapsed(start: string | null, end: string | null): number | null {
  const a = at(start);
  const b = at(end);
  return a !== null && b !== null ? Math.max(0, b - a) : null;
}

export function reliability(
  runs: readonly RunFacts[],
  now: Date,
): RunReliability {
  const failuresByReason: Record<string, number> = {};
  const latencies: number[] = [];
  const durations: number[] = [];
  let completed = 0;
  let failed = 0;
  let lost = 0;
  for (const run of runs) {
    if (run.status === 'completed') completed += 1;
    if (run.status === 'failed') {
      failed += 1;
      const reason = run.failureReason ?? 'unknown';
      failuresByReason[reason] = (failuresByReason[reason] ?? 0) + 1;
    }
    const latency = elapsed(run.createdAt, run.dispatchedAt);
    if (latency !== null) latencies.push(latency);
    if (run.status === 'completed' || run.status === 'failed') {
      const duration = elapsed(run.startedAt, run.finishedAt);
      if (duration !== null) durations.push(duration);
    }
    if (run.status === 'dispatched' || run.status === 'running') {
      const progress =
        at(run.lastActivityAt) ??
        at(run.startedAt) ??
        at(run.dispatchedAt) ??
        at(run.createdAt);
      if (progress !== null && now.getTime() - progress > LOST_AFTER_MS)
        lost += 1;
    }
  }
  return {
    runs: runs.length,
    completedRuns: completed,
    failedRuns: failed,
    failuresByReason,
    claimLatencyP50Ms: percentile(latencies, 0.5),
    claimLatencyP95Ms: percentile(latencies, 0.95),
    runDurationP50Ms: percentile(durations, 0.5),
    lostRuns: lost,
  };
}
