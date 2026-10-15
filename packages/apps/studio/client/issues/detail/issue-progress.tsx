/**
 * The issue page's "Now" line (`GET /api/issueProgress/:issueId`): what the issue waits for, worked out by the server,
 * then the project manager's latest "Next" line. A backlog issue offers "Start" (moving it to In progress wakes the
 * project manager); an issue the project manager executes but never worked on offers "Hand over to the project
 * manager" (`POST /api/projectManager/issues/:issueId/start`). The line refreshes with the issue and its runs.
 */
import { useApiClient } from '@nocobase/app-client';
import { canEditIssues } from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { BACKLOG_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { IssueLiveRunLink } from '../../agents/issue-runs.js';
import { useNotify } from '../../access/notify.js';
import { Clamped } from '../live/clamped.js';
import { issueProgressKey, progressStatusLine } from './progress-text.js';
import { IssueMarkdown } from '../markdown.js';
import { wakeIssue } from '../live/wake.js';
import { useIssueProgress } from './use-issue-progress.js';
import { PersonalRunnerActions } from './personal-runner-actions.js';

export function IssueProgressLine({
  issue,
  starting,
  onStart,
  runsBase,
}: {
  readonly issue: IssueDetail;
  /** Where the live run's record opens from, such as `/issues/PM-12`; the issue's own path by default. */
  readonly runsBase?: string;
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
  const progress = useIssueProgress(issue.id);
  const handOver = useMutation({
    mutationFn: () =>
      api.request({
        method: 'POST',
        path: `projectManager/issues/${encodeURIComponent(issue.id)}/start`,
      }),
    onSuccess: () => {
      notify.success(t('issueProgress.handedOver'));
      wakeIssue(issue.id);
    },
    onError: (error) => notify.error(error, t('issueProgress.handOverFailed')),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: issueProgressKey(issue.id),
        }),
        queryClient.invalidateQueries({ queryKey: pmKeys.issue(issue.id) }),
      ]);
    },
  });

  const data = progress.data;
  const canStart =
    canEdit &&
    issue.statusKey === BACKLOG_STATUS &&
    data?.waiting?.reason !== 'waitingOwner';
  const canHandOver =
    canEdit && data?.handOver === true && issue.statusKey !== BACKLOG_STATUS;
  return (
    <section
      aria-label={t('issueProgress.title')}
      data-testid='issue-progress'
      className='flex flex-col gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4 max-md:gap-1 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-0'
    >
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex min-w-0 items-baseline gap-x-2'>
          <span className='shrink-0 text-xs font-medium text-muted-foreground'>
            {t('issueProgress.title')}
          </span>
          {data ? (
            // One short line from the progress itself, never the manager's prose.
            <Clamped
              className='min-w-0 flex-1 wrap-anywhere text-foreground'
              clampClassName='line-clamp-2'
            >
              {data.state === 'checksPending' && data.pullRequest?.url ? (
                <a
                  href={data.pullRequest.url}
                  target='_blank'
                  rel='noreferrer'
                  className='hover:underline'
                >
                  {progressStatusLine(t, data)}
                </a>
              ) : (
                <IssueLiveRunLink
                  issue={issue}
                  {...(runsBase ? { base: runsBase } : {})}
                >
                  {progressStatusLine(t, data)}
                </IssueLiveRunLink>
              )}
            </Clamped>
          ) : progress.isError ? (
            <span className='text-muted-foreground'>
              {t('issueProgress.loadFailed')}
            </span>
          ) : (
            <Skeleton className='h-4 w-48' />
          )}
        </div>
        {data?.personalRunnerRequests
          ?.filter((request) => request.canRunAsMe)
          .map((request) => (
            <PersonalRunnerActions key={request.id} request={request} />
          ))}
        {data?.next?.trim() ? (
          // The manager's Next line as it wrote it: links and code rendered, two lines, the rest on request.
          <Clamped
            className='wrap-anywhere text-muted-foreground'
            clampClassName='line-clamp-2'
          >
            <span className='font-medium'>{t('issueProgress.nextLabel')}</span>{' '}
            <IssueMarkdown
              content={data.next.trim()}
              className='inline text-sm text-muted-foreground [&_p]:inline [&_p]:m-0'
            />
          </Clamped>
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
