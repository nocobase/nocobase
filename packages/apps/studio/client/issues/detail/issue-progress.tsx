/**
 * The issue page's "Now" line (`GET /api/issueProgress/:issueId`): what the issue waits for, worked out by the server,
 * then the project manager's latest "Next" line. A backlog issue offers "Start" (moving it to In progress wakes the
 * project manager); an issue the project manager executes but never worked on offers "Hand over to the project
 * manager" (`POST /api/projectManager/issues/:issueId/start`). The line refreshes with the issue and its runs.
 */
import { useApiClient } from '@nocobase/app-client';
import { canEditIssues } from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { BACKLOG_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import type { IssueProgress } from '../../../shared/project-manager.js';
import { useNotify } from '../../access/notify.js';
import { issueProgressKey, progressSentence } from './progress-text.js';

/** Refetches on its own too: a pull request's checks change with no issue change. */
const PROGRESS_POLL_MS = 15_000;

export function IssueProgressLine({
  issue,
  refresh,
  starting,
  onStart,
}: {
  readonly issue: IssueDetail;
  /** Changes whenever the issue or its runs do, to read the line again. */
  readonly refresh: string;
  readonly starting: boolean;
  /** Moves a backlog issue to In progress. */
  readonly onStart: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const viewer = useViewer();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const canEdit = canEditIssues(viewer) && viewer?.userId === issue.ownerUserId;
  const progress = useQuery({
    queryKey: [...issueProgressKey(issue.id), refresh],
    queryFn: async () =>
      (
        await api.request<{ data: IssueProgress }>({
          path: `issueProgress/${encodeURIComponent(issue.id)}`,
        })
      ).data,
    placeholderData: (previous) => previous,
    refetchInterval: PROGRESS_POLL_MS,
  });
  const handOver = useMutation({
    mutationFn: () =>
      api.request({
        method: 'POST',
        path: `projectManager/issues/${encodeURIComponent(issue.id)}/start`,
      }),
    onSuccess: () => notify.success(t('issueProgress.handedOver')),
    onError: (error) => notify.error(error, t('issueProgress.handOverFailed')),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: issueProgressKey(issue.id),
        }),
        queryClient.invalidateQueries({ queryKey: ['pm', 'issue'] }),
      ]);
    },
  });

  const data = progress.data;
  const canStart = canEdit && issue.statusKey === BACKLOG_STATUS;
  const canHandOver =
    canEdit && data?.handOver === true && issue.statusKey !== BACKLOG_STATUS;
  return (
    <section
      aria-label={t('issueProgress.title')}
      data-testid='issue-progress'
      className='flex flex-col gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4'
    >
      <div className='min-w-0 flex-1 space-y-1'>
        <p className='flex min-w-0 flex-wrap items-baseline gap-x-2'>
          <span className='text-xs font-medium text-muted-foreground'>
            {t('issueProgress.title')}
          </span>
          {data ? (
            <span className='min-w-0 wrap-anywhere text-foreground'>
              {data.state === 'checksPending' && data.pullRequest?.url ? (
                <a
                  href={data.pullRequest.url}
                  target='_blank'
                  rel='noreferrer'
                  className='hover:underline'
                >
                  {progressSentence(t, data)}
                </a>
              ) : (
                progressSentence(t, data)
              )}
            </span>
          ) : progress.isError ? (
            <span className='text-muted-foreground'>
              {t('issueProgress.loadFailed')}
            </span>
          ) : (
            <Skeleton className='h-4 w-48' />
          )}
        </p>
        {data?.next ? (
          <p className='wrap-anywhere text-muted-foreground'>
            {t('issueProgress.next', { next: data.next })}
          </p>
        ) : null}
      </div>
      {canStart || canHandOver ? (
        <div className='flex shrink-0 flex-wrap gap-2'>
          {canStart ? (
            <Button size='sm' disabled={starting} onClick={onStart}>
              {starting ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <PlayIcon data-icon='inline-start' />
              )}
              {t('issueProgress.start')}
            </Button>
          ) : null}
          {canHandOver ? (
            <Button
              size='sm'
              variant='outline'
              disabled={handOver.isPending}
              onClick={() => handOver.mutate()}
            >
              {handOver.isPending ? <Spinner data-icon='inline-start' /> : null}
              {t('issueProgress.handOver')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
