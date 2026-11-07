import type {
  AppSummary,
  RuntimeStatus,
  SharedHostView,
} from '../../shared/releases.js';

/**
 * An App's runtime as its state badge words it (a `ui.state.*` key), a deployment in progress aside: a refused start
 * says what it waits for, a hibernating App says so.
 */
export function runtimeStateKey(runtime: RuntimeStatus): string {
  const { state, waiting } = runtime;
  if (
    waiting &&
    state !== 'running' &&
    state !== 'starting' &&
    state !== 'failed'
  )
    return `waiting${waiting[0].toUpperCase()}${waiting.slice(1)}`;
  return state;
}

/**
 * Why the App is in its state, as translation keys: what holds it on its runtime, what its start waits for, or that it
 * runs idle and is stopped first when room is needed.
 */
export function runtimeReasons(runtime: RuntimeStatus): readonly string[] {
  const holds = runtime.holds ?? [];
  if (holds.length)
    return holds
      .filter(
        // `busy` only adds something when nothing more specific explains it.
        (hold) => hold !== 'busy' || holds.every((other) => other === 'busy'),
      )
      .map((hold) => `ui.runtime.holds.${hold}`);
  if (runtime.waiting && runtime.state !== 'running')
    return [`ui.runtime.waiting.${runtime.waiting}`];
  if (runtime.state === 'running') return ['ui.runtime.idle'];
  return [];
}

/** Where the environments page shows a shared host, so an App's page links to it. */
export function sharedHostAnchor(hostId: string): string {
  return `shared-host-${hostId}`;
}

/**
 * Why the App's own page mentions its shared host, as a translation key: it waits for a slot, memory or a restart, the
 * host restarted and could not put this App back, or the host restarts or is to restart. Null when the host does not
 * affect it, and for an App on no shared host.
 *
 * A failed start alone says nothing of the host: a wrong database password or a broken archive fails it too, and the
 * App's own error shows that. Only structured fields count — `runtime.waiting`, `runtime.unrestored` (which the driver
 * sets for this App alone; the host's `failedEnvironments` names whole environments, whose other Apps may be back on
 * the host and fail on their own) and `recycling`.
 */
export function hostNoticeOf(summary: AppSummary): string | null {
  if (!summary.host) return null;
  const { state, waiting } = summary.runtime;
  if (waiting && state !== 'running' && state !== 'starting')
    return `ui.runtime.waiting.${waiting}`;
  if (state === 'failed' && summary.runtime.unrestored)
    return 'ui.sharedHost.failed';
  if (summary.host.recycling)
    return `ui.sharedHost.recycling.${summary.host.recycling}`;
  return null;
}

/** The Apps list showing what the card counts: running or starting Apps of the host's environments. */
export function hostAppsSearch(host: SharedHostView): string {
  const params = new URLSearchParams();
  for (const environment of host.environments)
    params.append('environmentId', environment.id);
  params.append('runtimeState', 'running');
  params.append('runtimeState', 'starting');
  return `?${params.toString()}`;
}
