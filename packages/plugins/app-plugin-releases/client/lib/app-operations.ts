import type { AppSummary } from '../../shared/releases.js';

export type AppOperation = 'start' | 'stop' | 'restart';

export type OperationDisabledReason =
  | 'busy'
  | 'unavailable'
  | 'deploying'
  | 'starting'
  | 'notDeployed'
  | 'alreadyRunning'
  | 'notRunning';

/** Permission controls visibility; runtime state controls whether a visible operation is useful. */
export function operationDisabledReason(
  summary: AppSummary,
  operation: AppOperation,
  busy: boolean,
  stale: boolean,
): OperationDisabledReason | undefined {
  if (busy) return 'busy';
  if (
    stale ||
    !summary.runtime.available ||
    summary.runtime.state === 'unknown'
  )
    return 'unavailable';
  if (summary.hasPendingDeployment) return 'deploying';
  if (!summary.app.currentDeploymentId) return 'notDeployed';
  const state = summary.runtime.state;
  if (state === 'pending' || state === 'starting') return 'starting';
  if (operation === 'start')
    return state === 'running' ? 'alreadyRunning' : undefined;
  return state === 'running' ? undefined : 'notRunning';
}

export function appRefreshDelay(summary: AppSummary | undefined): number {
  return summary?.hasPendingDeployment ||
    summary?.runtime.state === 'starting' ||
    summary?.runtime.state === 'pending'
    ? 1500
    : 5000;
}
