import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { canEditIssues } from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { useNotify } from '../../access/notify.js';

interface PendingStageRun {
  readonly token: string;
  readonly statusKey: string;
  readonly maxRuns: number;
  readonly windowHours: number;
}

export interface StageRunControl {
  readonly pending: PendingStageRun | null;
  readonly ready: boolean;
  readonly submitting: boolean;
  readonly continueStageRun: (token: string) => void;
}

export function useIssueStageRunLimit({
  issue,
  onContinued,
}: {
  readonly issue: IssueDetail;
  readonly onContinued?: () => void;
}): StageRunControl {
  const api = useApiClient();
  const viewer = useViewer();
  const { t } = useTranslation();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const continuingRef = useRef(false);
  const allowed = canEditIssues(viewer);
  const key = [
    'studio',
    'stageRunLimit',
    issue.id,
    issue.statusKey,
    issue.revision,
  ];
  const pending = useQuery({
    queryKey: key,
    enabled: allowed,
    queryFn: async () =>
      (
        await api.request<{ data: PendingStageRun | null }>({
          path: `issueStageRuns/${encodeURIComponent(issue.id)}`,
        })
      ).data,
    retry: false,
  });
  const continuation = useMutation({
    mutationFn: (token: string) =>
      api.request({
        method: 'POST',
        path: `issueStageRuns/${encodeURIComponent(issue.id)}/continue`,
        json: { token },
      }),
    onSuccess: () => {
      queryClient.setQueryData(key, null);
      notify.success(t('studioAgents.stageRules.continued'));
      onContinued?.();
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'STAGE_CONTINUE_STALE'
      ) {
        queryClient.setQueryData(key, null);
      }
      notify.error(
        null,
        t(
          error instanceof ApiClientError &&
            error.reason === 'STAGE_CONTINUE_STALE'
            ? 'studioAgents.stageRules.continueStale'
            : 'studioAgents.stageRules.continueFailed',
        ),
      );
    },
    onSettled: async () => {
      continuingRef.current = false;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['studio', 'stageRunLimit', issue.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['pm', 'issue'] }),
      ]);
    },
  });
  const continueStageRun = useCallback(
    (token: string): void => {
      if (continuingRef.current) return;
      continuingRef.current = true;
      continuation.mutate(token);
    },
    [continuation],
  );
  return {
    pending: pending.data ?? null,
    ready:
      allowed && pending.isSuccess && !pending.isError && !pending.isFetching,
    submitting: continuation.isPending,
    continueStageRun,
  };
}
