import { useApiClient } from '@nocobase/app-client';
import { canEditIssues } from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useQuery } from '@tanstack/react-query';

interface PendingRun {
  readonly token: string;
  readonly maxRuns: number;
  readonly windowHours: number;
}

export function usePendingCommentRun(issue: IssueDetail) {
  const api = useApiClient();
  const viewer = useViewer();
  return useQuery({
    // Announcements about the issue read it again (`issues/live/realtime-refresh.ts`), so its revision is no part of it.
    queryKey: ['studio', 'commentRunLimit', issue.id],
    enabled:
      canEditIssues(viewer) &&
      viewer?.userId === issue.ownerUserId &&
      !['done', 'cancelled'].includes(issue.statusKey),
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: PendingRun | null }>({
          path: `issueCommentRuns/${encodeURIComponent(issue.id)}`,
          signal,
        })
      ).data,
    retry: false,
  });
}
