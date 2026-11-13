import type { AppSummary } from '../../shared/releases.js';
import { messageText } from './errors.js';

/**
 * The state an App's badge shows, one at a time. A pending deployment comes first, whatever the runtime last did: a
 * started deployment that reports a queue position again was refused for capacity and waits for the shared runtime to
 * recycle memory before its retry. Otherwise a stopped App whose last start was refused says what it waits for, and a
 * stopped on-demand App says that a visit starts it.
 */
export function appStateOf(summary: AppSummary): string {
  if (summary.hasPendingDeployment) {
    const pending = summary.pendingDeployment;
    if (pending?.status === 'deploying' && pending.queueAhead != null)
      return 'waitingRecycle';
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
