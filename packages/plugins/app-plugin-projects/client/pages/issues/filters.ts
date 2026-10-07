import {
  ISSUE_SORTS,
  type IssueListQuery,
  type IssueSort,
} from '../../../shared/issues.js';

/** What the toolbar filters and sorts by; the rest of `IssueListQuery` is paging. */
export type IssueFilters = Pick<
  IssueListQuery,
  | 'q'
  | 'statusKey'
  | 'projectId'
  | 'labelId'
  | 'ownerUserId'
  | 'executorId'
  | 'sort'
  | 'direction'
  | 'deleted'
>;

/**
 * The issue list and board keep their view and filters in the query string, so a refresh, going back or a
 * shared link restores them. These are the parameter names; the values are the ids the API filters by.
 */
/** `list`, `board`, or a view of the page that composes them (such as an application's Agent view). */
export type IssueView = string;

export const BUILT_IN_ISSUE_VIEWS: readonly IssueView[] = ['list', 'board'];

export type IssueFilterKey = Exclude<
  keyof IssueFilters,
  'sort' | 'direction' | 'deleted'
>;

export const ISSUE_FILTER_PARAMS: Readonly<Record<IssueFilterKey, string>> = {
  q: 'q',
  statusKey: 'status',
  projectId: 'project',
  labelId: 'label',
  ownerUserId: 'owner',
  executorId: 'executor',
};

export function readIssueView(params: URLSearchParams): IssueView {
  return params.get('view') === 'board' ? 'board' : 'list';
}

/**
 * The view to show: `?view=` when the URL names one of `available`, else the person's last choice on this page when it
 * is still available, else `fallback` (the board unless the page says otherwise).
 */
export function resolveIssueView(
  params: URLSearchParams,
  stored: IssueView | null,
  available: readonly IssueView[] = BUILT_IN_ISSUE_VIEWS,
  fallback: IssueView = 'board',
): IssueView {
  const value = params.get('view');
  if (value && available.includes(value)) return value;
  if (stored && available.includes(stored)) return stored;
  return fallback;
}

const VIEW_STORAGE_PREFIX = 'pm:issues-view:';

/** The last view chosen on `page` (`issues`, `my-issues`), or null when none is saved or storage is unavailable. */
export function readStoredIssueView(page: string): IssueView | null {
  try {
    const value = window.localStorage.getItem(VIEW_STORAGE_PREFIX + page);
    return value && /^[a-z][a-z0-9-]{0,31}$/u.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remembers the view for `page`; a private window or blocked storage just forgets it. */
export function storeIssueView(page: string, view: IssueView): void {
  try {
    window.localStorage.setItem(VIEW_STORAGE_PREFIX + page, view);
  } catch {
    // The choice is a convenience; the URL still carries it for this visit.
  }
}

/**
 * Filters and the order from the query string. The search term is trimmed for the request; the status filter and
 * the order do not apply to the board, whose columns are the statuses.
 */
export function readIssueFilters(
  params: URLSearchParams,
  view: IssueView = readIssueView(params),
): IssueFilters {
  const value = (key: IssueFilterKey): string | undefined =>
    params.get(ISSUE_FILTER_PARAMS[key])?.trim() || undefined;
  const sort = ISSUE_SORTS.find((item) => item === params.get('sort'));
  return {
    q: value('q'),
    statusKey: view === 'list' ? value('statusKey') : undefined,
    projectId: value('projectId'),
    labelId: value('labelId'),
    ownerUserId: value('ownerUserId'),
    executorId: value('executorId'),
    ...(view === 'list' && sort ? { sort } : {}),
    ...(view === 'list' && params.get('direction') === 'asc'
      ? { direction: 'asc' as const }
      : {}),
    ...(view === 'list' && params.get('deleted') === '1'
      ? { deleted: true }
      : {}),
  };
}

/** A copy of `params` showing deleted issues instead of live ones, or back; deleted issues only list. */
export function withDeleted(
  params: URLSearchParams,
  deleted: boolean,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (deleted) {
    next.set('deleted', '1');
    next.set('view', 'list');
  } else next.delete('deleted');
  return next;
}

/** A copy of `params` ordered by `sort` in `direction`; the default order leaves both out. */
export function withIssueSort(
  params: URLSearchParams,
  sort: IssueSort,
  direction: 'asc' | 'desc',
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (sort === 'updated') next.delete('sort');
  else next.set('sort', sort);
  if (direction === 'desc') next.delete('direction');
  else next.set('direction', direction);
  return next;
}

/** A copy of `params` with one filter set, or removed when `value` is empty. */
export function withIssueFilter(
  params: URLSearchParams,
  key: IssueFilterKey,
  value: string | null | undefined,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (value) next.set(ISSUE_FILTER_PARAMS[key], value);
  else next.delete(ISSUE_FILTER_PARAMS[key]);
  return next;
}

export function withIssueView(
  params: URLSearchParams,
  view: IssueView,
): URLSearchParams {
  // Always explicit: without `view` the page falls back to the remembered choice, which may be the other one.
  const next = new URLSearchParams(params);
  next.set('view', view);
  return next;
}

/** A copy of `params` without any filter, keeping the view. */
export function withoutIssueFilters(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of Object.values(ISSUE_FILTER_PARAMS)) next.delete(name);
  return next;
}

/** Whether anything narrows the issues; the order does not. */
export function hasIssueFilters(filters: IssueFilters): boolean {
  return (Object.keys(ISSUE_FILTER_PARAMS) as IssueFilterKey[]).some(
    (key) => filters[key] !== undefined,
  );
}
