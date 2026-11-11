import type { AppSummary } from '../../shared/releases.js';

/**
 * The state an App's badge shows: deploying while a deployment is pending; a stopped App whose last start was refused
 * says what it waits for; a stopped on-demand App says that a visit starts it.
 */
export function appStateOf(summary: AppSummary): string {
  if (summary.hasPendingDeployment)
    return summary.pendingDeployment?.status ?? 'deploying';
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
