import type { SessionLink } from '../../shared/api.js';

export type Tone = NonNullable<SessionLink['status']>['tone'];

/** The color of each standing: finished, going on, waiting for the viewer, not started. */
export const TONE_CLASS: Readonly<Record<Tone, string>> = {
  done: 'bg-emerald-500',
  active: 'bg-primary',
  attention: 'bg-amber-400',
  idle: 'bg-muted-foreground/50',
};

/** Standings in the order a session's bar and legend show them. */
export const TONE_ORDER: readonly Tone[] = [
  'done',
  'active',
  'attention',
  'idle',
];
