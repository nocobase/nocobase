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
    queryKey: ['studio', 'commentRunLimit', issue.id, issue.revision],
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
