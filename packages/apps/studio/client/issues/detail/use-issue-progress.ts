/** What an issue waits for (`GET /api/issueProgress/:issueId`), shared by the "Now" line and the issue summary. */
import { useApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { IssueProgress } from '../../../shared/project-manager.js';
import { issueProgressKey } from './progress-text.js';

/**
 * Refetches on its own too, as a fallback: changes to the issue, its runs and its pull requests are announced and read
 * again at once (`issues/live/realtime-refresh.ts`, `git/api.ts`).
 */
const PROGRESS_POLL_MS = 60_000;

/** What the issue waits for, read again whenever `refresh` changes; `fallback` shows until the first answer. */
export function useIssueProgress(
  issueId: string,
  refresh: string,
  fallback?: IssueProgress | null,
): UseQueryResult<IssueProgress> {
  const api = useApiClient();
  return useQuery({
    queryKey: [...issueProgressKey(issueId), refresh],
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: IssueProgress }>({
          path: `issueProgress/${encodeURIComponent(issueId)}`,
          signal,
        })
      ).data,
    placeholderData: (previous) => previous ?? fallback ?? undefined,
    refetchInterval: PROGRESS_POLL_MS,
  });
}
