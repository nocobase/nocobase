/**
 * An agent's comment the comment run limit held back (`GET /api/issueCommentRuns/:issueId`): a person who may edit the
 * issue continues it once, which wakes the agents it names and restarts the count. The server checks and consumes its
 * token.
 */
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

interface PendingRun {
  readonly token: string;
  readonly maxRuns: number;
  readonly windowHours: number;
}

export function IssueCommentRunLimit({
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
  const key = ['studio', 'commentRunLimit', issue.id, issue.revision];
  const path = `issueCommentRuns/${encodeURIComponent(issue.id)}`;
  const pending = useQuery({
    queryKey: key,
    enabled: allowed,
    queryFn: async () =>
      (await api.request<{ data: PendingRun | null }>({ path })).data,
    retry: false,
  });
  const continuation = useMutation({
    mutationFn: (token: string) =>
      api.request({
        method: 'POST',
        path: `${path}/continue`,
        json: { token },
      }),
    onSuccess: () => {
      queryClient.setQueryData(key, null);
      notify.success(t('studioAgents.commentRuns.continued'));
      onContinued?.();
    },
    onError: (error) =>
      notify.error(
        null,
        t(
          error instanceof ApiClientError &&
            error.reason === 'COMMENT_CONTINUE_STALE'
            ? 'studioAgents.commentRuns.continueStale'
            : 'studioAgents.commentRuns.continueFailed',
        ),
      ),
    onSettled: async () => {
      continuingRef.current = false;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['studio', 'commentRunLimit', issue.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['pm', 'issue'] }),
      ]);
    },
  });
  const held = pending.data;
  if (!allowed || !held) return null;
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>{t('studioAgents.commentRuns.limitReached')}</AlertTitle>
      <AlertDescription>
        <p>
          {t('studioAgents.commentRuns.continueHint', {
            maxRuns: held.maxRuns,
            windowHours: held.windowHours,
          })}
        </p>
        <Button
          size='sm'
          disabled={continuation.isPending}
          onClick={() => {
            if (continuingRef.current) return;
            continuingRef.current = true;
            continuation.mutate(held.token);
          }}
        >
          {continuation.isPending ? <Spinner /> : null}
          {t('studioAgents.commentRuns.continue')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
