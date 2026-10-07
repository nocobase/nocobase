import {
  ACTIVE_RUN_STATUSES,
  TERMINAL_RUN_STATUSES,
  type RunStatus,
} from '@nocobase/agent-protocol';

import type { Run } from '../../shared/runs.js';
import type { Tone } from '../components/ag-tag.js';

export const RUN_STATUS_TONE: Readonly<Record<RunStatus, Tone>> = {
  queued: 'grey',
  dispatched: 'blue',
  running: 'blue',
  completed: 'green',
  failed: 'red',
  cancelled: 'slate',
};

/** Still waiting or working: a run that may still change, and may be cancelled. */
export function isOpen(run: Pick<Run, 'status'>): boolean {
  return !TERMINAL_RUN_STATUSES.includes(run.status);
}

/** Held by a runner right now. */
export function isActive(run: Pick<Run, 'status'>): boolean {
  return ACTIVE_RUN_STATUSES.includes(run.status);
}

/** A finished run that did not complete can be run again. */
export function canRetry(run: Pick<Run, 'status'>): boolean {
  return run.status === 'failed' || run.status === 'cancelled';
}
