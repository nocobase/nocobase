import type { HostOccupantView } from '../../shared/releases.js';

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
