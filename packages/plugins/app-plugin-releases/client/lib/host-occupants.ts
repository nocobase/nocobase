import type { AppSummary, HostOccupantView } from '../../shared/releases.js';

/** The occupant's state as its badge words it: a refused start says what it waits for. */
export function occupantState(occupant: HostOccupantView): string {
  if (
    occupant.waiting &&
    occupant.state !== 'running' &&
    occupant.state !== 'starting'
  )
    return `waiting${occupant.waiting[0].toUpperCase()}${occupant.waiting.slice(1)}`;
  return occupant.state;
}

/** Why the occupant is listed: what holds it, what it waits for, or that it is idle. */
export function occupantReasons(occupant: HostOccupantView): readonly string[] {
  if (occupant.holds.length)
    return occupant.holds
      .filter(
        // `busy` only adds something when nothing more specific explains it.
        (hold) =>
          hold !== 'busy' || occupant.holds.every((other) => other === 'busy'),
      )
      .map((hold) => `ui.sharedHost.holds.${hold}`);
  if (occupant.waiting) return [`ui.sharedHost.waiting.${occupant.waiting}`];
  if (occupant.state === 'running') return ['ui.sharedHost.idle'];
  return [];
}

/** Where the environments page shows a shared host, so an App's page links to it. */
export function sharedHostAnchor(hostId: string): string {
  return `shared-host-${hostId}`;
}

/**
 * Why the App's own page mentions its shared host, as a translation key: it waits for a slot, memory or a restart, it
 * failed, or the host restarts or is to restart. Null when the host does not affect it, and for an App on no shared host.
 */
export function hostNoticeOf(summary: AppSummary): string | null {
  if (!summary.host) return null;
  const { state, waiting } = summary.runtime;
  if (waiting && state !== 'running' && state !== 'starting')
    return `ui.sharedHost.waiting.${waiting}`;
  if (state === 'failed') return 'ui.sharedHost.failed';
  if (summary.host.recycling)
    return `ui.sharedHost.recycling.${summary.host.recycling}`;
  return null;
}
