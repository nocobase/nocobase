import type { Activity } from '../../../../shared/issues.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { useOlderPages } from './use-older-pages.js';

export interface OlderActivities {
  readonly activities: readonly Activity[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly loadMore: () => void;
}

/**
 * Older activities on demand: the detail brings the newest ones and `activitiesNextCursor`; "Load older" pages on
 * from there. The query sits under `pmKeys.issue(id)`, so refreshing the issue refetches the loaded pages. Nothing is
 * requested until asked.
 */
export function useOlderActivities(
  issueId: string,
  firstCursor: string | null,
  newestBoundaryId: string | null,
): OlderActivities {
  const api = usePmApi();
  const history = useOlderPages(
    issueId,
    'activities',
    firstCursor,
    newestBoundaryId,
    (cursor) => api.activities(issueId, cursor),
    (activity) => activity.id,
  );
  return {
    activities: history.items,
    hasMore: history.hasMore,
    loading: history.loading,
    loadMore: history.loadMore,
  };
}
