/** A person who may edit the issue can continue the current suppressed stage action once; the server checks and consumes its token. */
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { canEditIssues } from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TriangleAlertIcon } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNotify } from '../../access/notify.js';

interface PendingStageRun {
  readonly token: string;
  readonly statusKey: string;
  readonly maxRuns: number;
  readonly windowHours: number;
}

export function IssueStageRunLimit({
  issue,
  onContinued,
}: {
  readonly issue: IssueDetail;
  readonly onContinued?: () => void;
}): ReactElement | null {
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
    onError: (error) =>
      notify.error(
        null,
        t(
          error instanceof ApiClientError &&
            error.reason === 'STAGE_CONTINUE_STALE'
            ? 'studioAgents.stageRules.continueStale'
            : 'studioAgents.stageRules.continueFailed',
        ),
      ),
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
  const blocked = pending.data;
  if (!allowed || !blocked || blocked.statusKey !== issue.statusKey)
    return null;
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>{t('studioAgents.stageRules.limitReached')}</AlertTitle>
      <AlertDescription>
        <p>
          {t('studioAgents.stageRules.continueHint', {
            maxRuns: blocked.maxRuns,
            windowHours: blocked.windowHours,
          })}
        </p>
        <Button
          size='sm'
          disabled={continuation.isPending}
          onClick={() => {
            if (continuingRef.current) return;
            continuingRef.current = true;
            continuation.mutate(blocked.token);
          }}
        >
          {continuation.isPending ? <Spinner /> : null}
          {t('studioAgents.stageRules.continue')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
