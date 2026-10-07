import type { AppSummary } from '../../shared/releases.js';

/**
 * The state an App's badge shows: deploying while a deployment is pending; a stopped on-demand App says that a visit
 * starts it.
 */
export function appStateOf(summary: AppSummary): string {
  if (summary.hasPendingDeployment) return 'deploying';
  const state = summary.runtime.state;
  if (
    state === 'stopped' &&
    summary.app.activation === 'onDemand' &&
    summary.app.currentDeploymentId
  )
    return 'stoppedOnDemand';
  return state;
}
