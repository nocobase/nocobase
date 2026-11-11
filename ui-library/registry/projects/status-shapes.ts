/** The status shapes and their colours (`status-icon.tsx` draws them). */
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';

/** The shapes, named as the agent sessions plugin names them (`SessionLinkIcon`). */
export type StatusShape =
  'backlog' | 'started' | 'blocked' | 'review' | 'done' | 'closed';

const SHAPE_OF_KEY: Readonly<Record<string, StatusShape>> = {
  backlog: 'backlog',
  in_progress: 'started',
  blocked: 'blocked',
  in_review: 'review',
  done: 'done',
  cancelled: 'closed',
};

/** The shape of a status, by its key, else by its category among the fixed statuses. */
export function statusShape(statusKey: string): StatusShape {
  const shape = SHAPE_OF_KEY[statusKey];
  if (shape) return shape;
  const category = FIXED_STATUSES.find(
    (status) => status.key === statusKey,
  )?.category;
  return category === 'started'
    ? 'started'
    : category === 'done'
      ? 'done'
      : category === 'closed'
        ? 'closed'
        : 'backlog';
}

/** The ink of each shape, as text colour (the icon draws in `currentColor`). */
export const STATUS_SHAPE_TEXT: Readonly<Record<StatusShape, string>> = {
  backlog: 'text-zinc-400 dark:text-zinc-500',
  started: 'text-blue-600 dark:text-blue-400',
  blocked: 'text-amber-500 dark:text-amber-400',
  review: 'text-violet-600 dark:text-violet-400',
  done: 'text-emerald-600 dark:text-emerald-400',
  closed: 'text-slate-500 dark:text-slate-400',
};

/** The ink of each shape as a fill, for bars. */
export const STATUS_SHAPE_FILL: Readonly<Record<StatusShape, string>> = {
  backlog: 'bg-zinc-300 dark:bg-zinc-600',
  started: 'bg-blue-600 dark:bg-blue-400',
  blocked: 'bg-amber-500 dark:bg-amber-400',
  review: 'bg-violet-600 dark:bg-violet-400',
  done: 'bg-emerald-600 dark:bg-emerald-400',
  closed: 'bg-slate-500 dark:bg-slate-400',
};

/** The order a progress bar lays its segments out in: finished first, then in review, going on, stuck, not started. */
export const STATUS_BAR_ORDER: readonly StatusShape[] = [
  'done',
  'closed',
  'review',
  'started',
  'blocked',
  'backlog',
];
