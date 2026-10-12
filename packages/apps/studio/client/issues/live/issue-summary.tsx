/**
 * What an issue is at now, on the issue page (pinned above its feed) and on "My follow-ups": a title row (key, status,
 * title, the page's `actions`, and "Collapse summary" when `collapsible`), then its pull request with checks and
 * conflicts, the "Now" line with "Start" and the hand-over (`../detail/issue-progress.tsx`), what the viewer has to do
 * when it waits for them, and in review the delivery: the agent comment that tells what was delivered, cut short, with
 * Merge, View changes and Send back (to In progress).
 */
import {
  canEditIssues,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  IN_PROGRESS_STATUS,
  IN_REVIEW_STATUS,
} from '@nocobase/app-plugin-projects/shared/statuses';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  UndoIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import {
  PROJECT_MANAGER_ID,
  type IssueProgress,
} from '../../../shared/project-manager.js';
import { useIssuePullRequests, usePullRequestMark } from '../../git/api.js';
import { MergeButtons } from '../../git/pull-requests.js';
import { IssueProgressLine } from '../detail/issue-progress.js';
import { useIssueProgress } from '../detail/use-issue-progress.js';
import { IssueMarkdown } from '../markdown.js';
import { Clamped } from './clamped.js';
import { deliveryComment } from './feed-rows.js';
import { StatusPill } from './status.js';
import { askOf, pullRequestLabel } from './summary-model.js';

export function IssueSummary({
  issue,
  update,
  refresh,
  progressFallback,
  actions,
  collapsible = false,
  defaultCollapsed = false,
  heading = true,
  className,
}: {
  readonly issue: IssueDetail;
  readonly update: IssueUpdate;
  /** Changes whenever the issue or its runs do, to read the "Now" line again. */
  readonly refresh: string;
  /** What "Now" says until the server answers, such as an overview's copy. */
  readonly progressFallback?: IssueProgress | null;
  /** In the title row, such as the follow star. */
  readonly actions?: ReactNode;
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  /** The title is a heading; off where the page already has one for it. */
  readonly heading?: boolean;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const Title = heading ? 'h2' : 'p';
  const viewer = useViewer();
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);
  const mark = usePullRequestMark(issue.id, issue.revision).data;
  const progress = useIssueProgress(issue.id, refresh, progressFallback).data;
  const owned = Boolean(viewer?.userId) && issue.ownerUserId === viewer?.userId;
  const ask = askOf(
    t,
    { owned, statusKey: issue.statusKey, progress: progress ?? null },
    mark,
  );
  const checks =
    mark && mark.state === 'open' && mark.ciState
      ? t(`issueLive.summary.checks.${mark.ciState}`)
      : null;
  return (
    <section
      aria-label={t('issueLive.summary.label')}
      data-testid='issue-summary'
      data-collapsed={collapsed ? '' : undefined}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5'>
        <span className='font-mono text-sm text-muted-foreground'>
          {issue.identifier}
        </span>
        <StatusPill statusKey={issue.statusKey} />
        <Title
          className={cn(
            'min-w-0 flex-1 basis-40 text-base leading-snug font-semibold',
            collapsed ? 'truncate' : 'text-balance',
          )}
        >
          {issue.title}
        </Title>
        <span className='flex flex-wrap items-center gap-2'>
          {actions}
          {collapsible ? (
            <Button
              size='sm'
              variant='ghost'
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? (
                <ChevronDownIcon data-icon='inline-start' />
              ) : (
                <ChevronUpIcon data-icon='inline-start' />
              )}
              {collapsed
                ? t('issueLive.summary.expand')
                : t('issueLive.summary.collapse')}
            </Button>
          ) : null}
        </span>
      </div>
      {collapsed ? null : (
        <>
          {mark?.state === 'open' ? (
            <p className='flex flex-wrap items-center gap-x-2 text-sm'>
              <a
                href={mark.url}
                target='_blank'
                rel='noreferrer'
                className='hover:underline'
              >
                {pullRequestLabel(mark)}
              </a>
              {checks || mark.conflict ? (
                <span className='text-muted-foreground'>
                  {[
                    checks,
                    mark.conflict ? t('issueLive.summary.conflict') : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}
            </p>
          ) : null}
          <IssueProgressLine
            issue={issue}
            refresh={refresh}
            starting={update.isPending}
            onStart={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
          />
          {ask ? (
            <div
              className='flex flex-wrap items-center gap-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm'
              data-testid='issue-needs-you'
            >
              <strong className='font-semibold'>
                {t('issueLive.summary.needsYou')}
              </strong>
              <span className='min-w-0 wrap-anywhere'>{ask}</span>
            </div>
          ) : null}
          {issue.statusKey === IN_REVIEW_STATUS ? (
            <Delivery
              issue={issue}
              update={update}
              canEdit={canEditIssues(viewer)}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

/** In review: what was delivered, and the decisions on it. */
function Delivery({
  issue,
  update,
  canEdit,
}: {
  readonly issue: IssueDetail;
  readonly update: IssueUpdate;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const pullRequests = useIssuePullRequests(issue.id, issue.revision).data;
  const open = pullRequests?.data.find((pr) => pr.state === 'open') ?? null;
  const shown = open ?? pullRequests?.data[0] ?? null;
  const comment = deliveryComment(
    issue.threads,
    issue.activities,
    PROJECT_MANAGER_ID,
  );
  return (
    <section
      aria-label={t('issueLive.summary.delivery')}
      data-testid='issue-delivery'
      className='flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm'
    >
      <h3 className='text-xs font-medium text-muted-foreground'>
        {t('issueLive.summary.delivery')}
        {comment?.authorName ? ` · ${comment.authorName}` : null}
      </h3>
      {comment ? (
        <Clamped>
          <IssueMarkdown content={comment.content} className='text-sm' />
        </Clamped>
      ) : (
        <p className='text-muted-foreground'>
          {t('issueLive.summary.deliveryNone')}
        </p>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        {open && pullRequests?.canMerge ? (
          <MergeButtons issue={issue} pullRequest={open} />
        ) : null}
        {shown ? (
          <Button
            size='sm'
            variant='outline'
            nativeButton={false}
            render={<a href={shown.url} target='_blank' rel='noreferrer' />}
          >
            <ExternalLinkIcon data-icon='inline-start' />
            {t('issueLive.summary.viewChanges')}
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            size='sm'
            variant='outline'
            title={t('issueLive.summary.sendBackHint')}
            disabled={update.isPending}
            onClick={() => update.mutate({ statusKey: IN_PROGRESS_STATUS })}
          >
            {update.isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <UndoIcon data-icon='inline-start' />
            )}
            {t('issueLive.summary.sendBack')}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
