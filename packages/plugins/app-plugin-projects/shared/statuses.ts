/**
 * The six statuses every issue moves through. They are fixed: no project adds, renames or removes one.
 *
 * - `backlog`: waiting; nothing starts there.
 * - `in_progress`: being worked on. Creating an issue there, or moving it there, starts the work its executor was given.
 * - `blocked`: waiting for a person to decide something; its owner is told.
 * - `in_review`: done and waiting to be accepted; its owner is told.
 * - `done` and `cancelled`: finished.
 *
 * People move an issue between any two of them. Other kinds of principal move it only where their kind allows
 * (`PrincipalKind.moves`), and the system only along a status event another plugin registered
 * (`projectsStatusEventsToken`), such as a merged pull request.
 */
import type { StatusCategory, StatusDefinition } from './issues.js';

export const STATUS_CATEGORIES: readonly StatusCategory[] = [
  'unstarted',
  'started',
  'done',
  'closed',
];

export const BACKLOG_STATUS = 'backlog';
export const IN_PROGRESS_STATUS = 'in_progress';
export const BLOCKED_STATUS = 'blocked';
export const IN_REVIEW_STATUS = 'in_review';
export const DONE_STATUS = 'done';
export const CANCELLED_STATUS = 'cancelled';

/** The fixed statuses, in order. Names are English; the browser shows each in the viewer's language. */
export const FIXED_STATUSES: readonly StatusDefinition[] = [
  {
    key: BACKLOG_STATUS,
    name: 'Backlog',
    category: 'unstarted',
    color: 'gray',
  },
  {
    key: IN_PROGRESS_STATUS,
    name: 'In progress',
    category: 'started',
    color: 'yellow',
  },
  { key: BLOCKED_STATUS, name: 'Blocked', category: 'started', color: 'red' },
  {
    key: IN_REVIEW_STATUS,
    name: 'In review',
    category: 'started',
    color: 'purple',
  },
  { key: DONE_STATUS, name: 'Done', category: 'done', color: 'green' },
  {
    key: CANCELLED_STATUS,
    name: 'Cancelled',
    category: 'closed',
    color: 'gray',
  },
];

export const STATUS_KEYS: readonly string[] = FIXED_STATUSES.map(
  (status) => status.key,
);

/** The statuses a new issue may start in: right away, or later. */
export const START_STATUSES: readonly string[] = [
  IN_PROGRESS_STATUS,
  BACKLOG_STATUS,
];

/** Where a new issue starts when its creator names no status: nothing starts. */
export const DEFAULT_START_STATUS: string = BACKLOG_STATUS;

/** The owner is told when an issue enters one of these. */
export const OWNER_NOTIFIED_STATUSES: readonly string[] = [
  BLOCKED_STATUS,
  IN_REVIEW_STATUS,
];

export function isFixedStatus(key: string): boolean {
  return STATUS_KEYS.includes(key);
}

export function statusCategory(key: string): StatusCategory | null {
  return FIXED_STATUSES.find((status) => status.key === key)?.category ?? null;
}

export function statusOf(key: string): StatusDefinition | null {
  return FIXED_STATUSES.find((status) => status.key === key) ?? null;
}

export function isTerminalCategory(category: StatusCategory | null): boolean {
  return category === 'done' || category === 'closed';
}

/** Whether a status still has its fixed English name, so the interface shows the translation instead. */
export function hasDefaultName(status: {
  readonly key: string;
  readonly name: string;
}): boolean {
  return FIXED_STATUSES.some(
    (fixed) => fixed.key === status.key && fixed.name === status.name,
  );
}

/** A status event's key: dotted, its plugin's prefix first, such as `acme.merged`. */
export const STATUS_EVENT_PATTERN: RegExp =
  /^[a-z][a-zA-Z0-9]{0,31}(\.[a-z][a-zA-Z0-9]{0,63}){1,3}$/u;
