import type { SessionLink, SessionLinkIcon } from '../../shared/api.js';

export type Tone = NonNullable<SessionLink['status']>['tone'];

/** The colour of each standing, for a link its application gives no icon (older data). */
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

/** The shape standing in for a link without an icon. */
const TONE_ICON: Readonly<Record<Tone, SessionLinkIcon>> = {
  done: 'done',
  active: 'started',
  attention: 'review',
  idle: 'backlog',
};

/** A link's status shape: the application's, else its tone's. */
export function linkIcon(link: Pick<SessionLink, 'status'>): SessionLinkIcon {
  return link.status?.icon ?? TONE_ICON[link.status?.tone ?? 'idle'];
}

/** Whether the link waits for the viewer, as its application says. */
export function linkNeedsYou(link: Pick<SessionLink, 'status'>): boolean {
  return link.status
    ? link.status.icon
      ? Boolean(link.status.needsYou)
      : link.status.tone === 'attention'
    : false;
}

/** Each shape's ink, as text colour. */
export const ICON_TEXT: Readonly<Record<SessionLinkIcon, string>> = {
  backlog: 'text-zinc-400 dark:text-zinc-500',
  started: 'text-blue-600 dark:text-blue-400',
  blocked: 'text-amber-500 dark:text-amber-400',
  review: 'text-violet-600 dark:text-violet-400',
  done: 'text-emerald-600 dark:text-emerald-400',
  closed: 'text-slate-500 dark:text-slate-400',
};

/** Each shape's ink as a fill, for the bar. */
export const ICON_FILL: Readonly<Record<SessionLinkIcon, string>> = {
  backlog: 'bg-zinc-300 dark:bg-zinc-600',
  started: 'bg-blue-600 dark:bg-blue-400',
  blocked: 'bg-amber-500 dark:bg-amber-400',
  review: 'bg-violet-600 dark:bg-violet-400',
  done: 'bg-emerald-600 dark:bg-emerald-400',
  closed: 'bg-slate-500 dark:bg-slate-400',
};

/** The bar's order: done, closed, in review, started, blocked, not started. */
export const ICON_ORDER: readonly SessionLinkIcon[] = [
  'done',
  'closed',
  'review',
  'started',
  'blocked',
  'backlog',
];

/** The links in the bar's order. */
export function byIcon<T extends Pick<SessionLink, 'status'>>(
  links: readonly T[],
): T[] {
  return [...links].sort(
    (a, b) => ICON_ORDER.indexOf(linkIcon(a)) - ICON_ORDER.indexOf(linkIcon(b)),
  );
}

/** The session's records, those waiting for the viewer first. */
export function waitingFirst(links: readonly SessionLink[]): SessionLink[] {
  return [...links].sort(
    (a, b) => Number(linkNeedsYou(b)) - Number(linkNeedsYou(a)),
  );
}
