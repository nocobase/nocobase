/** The detail parts of the projects plugin's inbox entry (`projects.ts`): the body. */
import { PmStatusBadge } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';

import { RecentActivity } from './recent-activity.js';
import { OwnerHandoffActions } from '../../issues/detail/owner-handoff.js';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import type { ProjectsModel } from './projects.js';
import { useParamsOf } from './projects-wording.js';

/** The issue, the comment quoted, and the issue's latest activity. */
export function ProjectsBody({
  entry,
  model,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const { issueId, detail } = model;
  const params = useParamsOf()(entry);
  return (
    <>
      {issueId ? (
        <IssueSummary detail={detail.data} loading={detail.isPending} />
      ) : null}
      {params.excerpt ? (
        <blockquote className='rounded-md border-l-2 bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap wrap-anywhere'>
          {params.excerpt}
        </blockquote>
      ) : null}
      {entry.notice?.type === 'owner_handoff' && issueId ? (
        <OwnerHandoffActions
          issueId={issueId}
          notificationKey={params.notificationKey}
        />
      ) : null}
      {entry.notice?.type === 'comment_runs_limited' && issueId ? (
        <Link
          to={`/issues/${encodeURIComponent(detail.data?.identifier ?? issueId)}`}
          className='text-sm font-medium text-primary hover:underline'
        >
          {t('studioAgents.commentRuns.continueInIssue')}
        </Link>
      ) : null}
      {params.question ? (
        <figure className='space-y-1.5'>
          <figcaption className='text-xs text-muted-foreground'>
            {t('inbox.blocked.question', {
              actor: params.actorName ?? t('inbox.someone'),
            })}
          </figcaption>
          <blockquote className='rounded-md border-l-2 bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap wrap-anywhere'>
            {params.question}
          </blockquote>
        </figure>
      ) : null}
      {detail.data ? <RecentActivity detail={detail.data} /> : null}
    </>
  );
}

/** The issue the item is about: identifier, status and owner (its title is the pane's heading). */
function IssueSummary({
  detail,
  loading,
}: {
  readonly detail: IssueDetail | undefined;
  readonly loading: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!detail) return loading ? <Skeleton className='h-9 w-full' /> : null;
  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm'>
      <Link
        to={`/issues/${encodeURIComponent(detail.identifier)}`}
        className='inline-flex min-w-0 items-center gap-2 hover:underline'
      >
        <span className='font-mono text-xs text-muted-foreground'>
          {detail.identifier}
        </span>
        <PmStatusBadge
          statusKey={detail.statusKey}
          statuses={detail.statuses}
        />
      </Link>
      <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
        {t('inbox.owner')}
        <span className='truncate text-foreground'>
          {detail.owner?.name ?? '—'}
        </span>
      </span>
    </div>
  );
}
