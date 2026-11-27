/**
 * What the page says about a Schedule, derived from the fields the API returns: its state, and why it needs attention.
 */
import type { OccurrenceStatus, Schedule } from './api.js';

/**
 * - `removed`: the definition is gone from code and `scheduler sync --finalize` deactivated it; it cannot be resumed.
 * - `paused`: an administrator switched it off.
 * - `unavailable`: its target is missing, invalid or disabled, so each firing is recorded as skipped.
 * - `running`: enabled, defined and its target ready.
 */
export type ScheduleState = 'running' | 'paused' | 'unavailable' | 'removed';

export function scheduleState(schedule: Schedule): ScheduleState {
  if (schedule.lifecycleState === 'inactive') return 'removed';
  if (!schedule.enabled) return 'paused';
  if (schedule.targetState !== 'ready') return 'unavailable';
  return 'running';
}

/** How long a run may wait for its result before the page points it out. */
export const LONG_WAIT_MS: number = 60 * 60 * 1000;

export type AttentionKind = 'target' | 'waiting' | 'failed';

export interface Attention {
  readonly kind: AttentionKind;
  readonly schedule: Schedule;
}

const UNFINISHED = new Set<OccurrenceStatus>(['pending', 'running', 'waiting']);
const FAILED = new Set<OccurrenceStatus>(['failed', 'timed_out']);

/**
 * What needs someone to look at a Schedule that is switched on and still defined: an unavailable target, a latest run
 * waiting for its result longer than `LONG_WAIT_MS`, or a latest run that failed or timed out.
 */
export function attentionOf(
  schedule: Schedule,
  now: number,
): Attention | undefined {
  const state = scheduleState(schedule);
  if (state === 'removed' || state === 'paused') return undefined;
  if (state === 'unavailable') return { kind: 'target', schedule };
  const status = schedule.lastRun?.status;
  if (!status) return undefined;
  if (FAILED.has(status)) return { kind: 'failed', schedule };
  if (
    UNFINISHED.has(status) &&
    schedule.lastRunAt !== undefined &&
    now - Date.parse(schedule.lastRunAt) > LONG_WAIT_MS
  )
    return { kind: 'waiting', schedule };
  return undefined;
}

/** The result filters of the Runs tab, each a set of occurrence states. */
export type ResultGroup =
  'all' | 'failed' | 'waiting' | 'skipped' | 'succeeded';

export const RESULT_GROUPS: Readonly<
  Record<ResultGroup, readonly OccurrenceStatus[]>
> = {
  all: [],
  failed: ['failed', 'timed_out'],
  waiting: ['pending', 'running', 'waiting'],
  skipped: ['skipped'],
  succeeded: ['succeeded'],
};

export type StatusTone = 'success' | 'danger' | 'warning' | 'muted' | 'info';

export function statusTone(status: OccurrenceStatus): StatusTone {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'failed':
    case 'timed_out':
      return 'danger';
    case 'waiting':
      return 'warning';
    case 'running':
    case 'pending':
      return 'info';
    default:
      return 'muted';
  }
}
