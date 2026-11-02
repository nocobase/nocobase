import { ApiClientError } from '@nocobase/api-client';

/** A snapshot from the existing query observer, never a second cache. */
export interface ListSnapshot {
  readonly data?: unknown;
  readonly error?: unknown;
  readonly isPending?: boolean;
  readonly isFetching?: boolean;
  readonly isPlaceholderData?: boolean;
}

export type ListState =
  | 'loading'
  | 'empty'
  | 'no-results'
  | 'forbidden'
  | 'unauthenticated'
  | 'failed'
  | 'refresh-failed'
  | 'ready';

/** Only successful data belonging to this query may survive a refresh failure. */
export function resolveListState(
  snapshot: ListSnapshot,
  rowCount: number,
  filtered: boolean = false,
): ListState {
  const { error } = snapshot;
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'unauthenticated';
    if (error.status === 403) return 'forbidden';
  }
  const hasData = snapshot.data !== undefined && !snapshot.isPlaceholderData;
  if (error) return hasData ? 'refresh-failed' : 'failed';
  if (!hasData || snapshot.isPending) return 'loading';
  if (rowCount > 0) return 'ready';
  return filtered ? 'no-results' : 'empty';
}

export function listStateShowsData(state: ListState): boolean {
  return state === 'ready' || state === 'refresh-failed';
}
