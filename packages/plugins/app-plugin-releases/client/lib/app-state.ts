import type { AppSummary } from '../../shared/releases.js';
import { messageText } from './errors.js';

/**
 * The state an App's badge shows, one at a time. A pending deployment comes first, whatever the runtime last did; one
 * that reports a queue position is queued, and waits for the recycle while its shared runtime is recycling
 * (`deploymentWaitOf`). Otherwise a stopped App whose last start was refused says what it waits for, and a stopped
 * on-demand App says that a visit starts it.
 */
export function appStateOf(summary: AppSummary): string {
  if (summary.hasPendingDeployment) {
    const pending = summary.pendingDeployment;
    const wait = pending
      ? deploymentWaitOf(pending, summary.host?.recycling)
      : null;
    if (wait) return wait === 'recycle' ? 'waitingRecycle' : 'queued';
    return pending?.status ?? 'deploying';
  }
  const state = summary.runtime.state;
  if (state !== 'running' && state !== 'starting' && summary.runtime.waiting)
    return WAITING_STATE[summary.runtime.waiting];
  if (
    state === 'stopped' &&
    summary.app.activation === 'onDemand' &&
    summary.app.currentDeploymentId
  )
    return 'stoppedOnDemand';
  return state;
}

/**
 * What a pending deployment waits for: `recycle` while it has a queue position and its shared runtime is recycling
 * (a deployment refused for capacity waits for exactly that before its one retry), `queue` for any other queue
 * position, including that retry queued behind other work once the recycle is over; null when it is not waiting.
 * Only the single-App read carries the runtime (`AppSummary.host`), so a list without it says `queue`.
 */
export function deploymentWaitOf(
  deployment: {
    readonly status: string;
    readonly queueAhead?: number | null;
  },
  recycling: 'pending' | 'restarting' | null | undefined,
): 'recycle' | 'queue' | null {
  if (
    deployment.queueAhead == null ||
    !['queued', 'deploying'].includes(deployment.status)
  )
    return null;
  return recycling ? 'recycle' : 'queue';
}

const WAITING_STATE = {
  capacity: 'waitingCapacity',
  memory: 'waitingMemory',
  recycle: 'waitingRecycle',
} as const;

/** What explains an App's state (`appStateOf`) in words, or null when nothing does. */
export function appStateDetail(
  t: (key: string, options?: Record<string, unknown>) => string,
  summary: AppSummary,
  state: string = appStateOf(summary),
): string | null {
  if (summary.hasPendingDeployment && state === 'waitingRecycle')
    return t('ui.errors.messages.recycleWait');
  const error = summary.runtime.error;
  if (!error) return null;
  return summary.hasPendingDeployment
    ? t('ui.apps.lastFailure', { detail: messageText(t, error) })
    : messageText(t, error);
}
