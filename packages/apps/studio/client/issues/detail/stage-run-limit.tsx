/**
 * A person who may edit the issue can continue what a loop guard held back once: the current suppressed stage action,
 * or the agent comment the comment run limit held back. The server checks and consumes its token.
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
  /** Set for a stage action: it waits only while the issue is in that status. */
  readonly statusKey?: string;
  readonly maxRuns: number;
  readonly windowHours: number;
}

/** What tells the two guards apart: their route, cache key and words. */
interface RunLimitKind {
  readonly path: string;
  readonly key: string;
  readonly words: 'studioAgents.stageRules' | 'studioAgents.commentRuns';
  readonly staleReason: string;
}

const STAGE: RunLimitKind = {
  path: 'issueStageRuns',
  key: 'stageRunLimit',
  words: 'studioAgents.stageRules',
  staleReason: 'STAGE_CONTINUE_STALE',
};

const COMMENTS: RunLimitKind = {
  path: 'issueCommentRuns',
  key: 'commentRunLimit',
  words: 'studioAgents.commentRuns',
  staleReason: 'COMMENT_CONTINUE_STALE',
};

function RunLimitAlert({
  kind,
  issue,
  onContinued,
}: {
  readonly kind: RunLimitKind;
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
  const key = ['studio', kind.key, issue.id, issue.statusKey, issue.revision];
  const pending = useQuery({
    queryKey: key,
    enabled: allowed,
    queryFn: async () =>
      (
        await api.request<{ data: PendingRun | null }>({
          path: `${kind.path}/${encodeURIComponent(issue.id)}`,
        })
      ).data,
    retry: false,
  });
  const continuation = useMutation({
    mutationFn: (token: string) =>
      api.request({
        method: 'POST',
        path: `${kind.path}/${encodeURIComponent(issue.id)}/continue`,
        json: { token },
      }),
    onSuccess: () => {
      queryClient.setQueryData(key, null);
      notify.success(t(`${kind.words}.continued`));
      onContinued?.();
    },
    onError: (error) =>
      notify.error(
        null,
        t(
          error instanceof ApiClientError && error.reason === kind.staleReason
            ? `${kind.words}.continueStale`
            : `${kind.words}.continueFailed`,
        ),
      ),
    onSettled: async () => {
      continuingRef.current = false;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['studio', kind.key, issue.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['pm', 'issue'] }),
      ]);
    },
  });
  const blocked = pending.data;
  if (
    !allowed ||
    !blocked ||
    (blocked.statusKey !== undefined && blocked.statusKey !== issue.statusKey)
  )
    return null;
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>{t(`${kind.words}.limitReached`)}</AlertTitle>
      <AlertDescription>
        <p>
          {t(`${kind.words}.continueHint`, {
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

export function IssueStageRunLimit(props: {
  readonly issue: IssueDetail;
  readonly onContinued?: () => void;
}): ReactElement | null {
  return <RunLimitAlert kind={STAGE} {...props} />;
}

export function IssueCommentRunLimit(props: {
  readonly issue: IssueDetail;
  readonly onContinued?: () => void;
}): ReactElement | null {
  return <RunLimitAlert kind={COMMENTS} {...props} />;
}
