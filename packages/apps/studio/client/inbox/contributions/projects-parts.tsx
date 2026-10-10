/** The detail parts of the projects plugin's inbox entry (`projects.ts`): the approval actions and the body. */
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import { ApiClientError } from '@nocobase/app-client';
import {
  PmStatusBadge,
  pmKeys,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import type { ApprovalRequest } from '@nocobase/app-plugin-projects/shared/approvals';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BotIcon, CogIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { useNotify } from '../../access/notify.js';
import {
  DecisionActionsBar,
  type ApprovalDecision,
} from '@/extensions/nocobase-inbox/decision-actions-bar';
import { RecentActivity } from './recent-activity.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import type { ProjectsModel } from './projects.js';
import { useParamsOf } from './projects-wording.js';

/** Approve or reject the request, through the projects plugin's API. */
export function ApprovalActions({
  entry,
  title,
  onDecided,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const decide = useMutation({
    mutationFn: ({
      decision: choice,
      comment,
    }: {
      decision: ApprovalDecision;
      comment: string;
    }) =>
      api.decideApproval(
        entry.notice?.decisionKey ?? '',
        choice,
        comment || undefined,
      ),
    onSuccess: (decided) => {
      if (decided.status === 'stale')
        notify.success(t('inbox.request.done.stale'));
      else if (decided.status === 'approved' || decided.status === 'rejected')
        notify.success(t(`inbox.request.done.${decided.status}`));
      onDecided();
    },
    onError: (error) =>
      error instanceof ApiClientError && error.status === 409
        ? notify.error(null, t('inbox.request.conflict'))
        : notify.error(error),
    onSettled: () => {
      for (const queryKey of [inboxKeys.all, ['pm', 'issue'], pmKeys.issues])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
  return (
    <DecisionActionsBar
      itemTitle={title}
      pending={decide.isPending ? decide.variables.decision : null}
      disabled={decide.isPending}
      onRun={(decision, comment) => decide.mutate({ decision, comment })}
    />
  );
}

/** The issue, the request being decided in full (or the comment quoted), and the issue's latest activity. */
export function ProjectsBody({
  entry,
  model,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const { issueId, detail, request, decision } = model;
  const params = useParamsOf()(entry);
  return (
    <>
      {issueId ? (
        <IssueSummary detail={detail.data} loading={detail.isPending} />
      ) : null}
      {request && detail.data ? (
        <RequestContent request={request} detail={detail.data} />
      ) : decision === 'gone' ? (
        <p className='text-sm text-muted-foreground'>
          {t('inbox.request.gone')}
        </p>
      ) : null}
      {params.excerpt ? (
        <blockquote className='rounded-md border-l-2 bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap wrap-anywhere'>
          {params.excerpt}
        </blockquote>
      ) : null}
      {entry.notice?.type === 'stage_action_problem' &&
      params.reason === 'suppressed' &&
      issueId ? (
        <Link
          to={`/issues/${encodeURIComponent(detail.data?.identifier ?? issueId)}`}
          className='text-sm font-medium text-primary hover:underline'
        >
          {t('studioAgents.stageRules.continueInIssue')}
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

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='flex min-w-0 flex-wrap items-center gap-1.5'>
        {children}
      </dd>
    </>
  );
}

/** The status change that waits: from → to, who asked, who may decide, since when. */
function RequestContent({
  request,
  detail,
}: {
  readonly request: ApprovalRequest;
  readonly detail: IssueDetail;
}): ReactElement {
  const { t, i18n } = useTranslation();
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
      <Row label={t('inbox.request.change')}>
        <PmStatusBadge
          statusKey={request.fromStatus}
          statuses={detail.statuses}
        />
        <span aria-hidden='true'>→</span>
        <PmStatusBadge
          statusKey={request.toStatus}
          statuses={detail.statuses}
        />
      </Row>
      <Row label={t('inbox.request.requester')}>
        <span className='inline-flex max-w-full min-w-0 items-center gap-1.5'>
          {request.requestedByType ===
          'user' ? null : request.requestedByType === 'agent' ? (
            <AgentAvatar name={request.requestedByName} size='xs' />
          ) : (
            <Avatar
              size='sm'
              aria-hidden='true'
              className='size-4 rounded-md after:rounded-md'
            >
              <AvatarFallback className='rounded-md'>
                {request.requestedByType === 'system' ? (
                  <CogIcon className='size-2.5' />
                ) : (
                  <BotIcon className='size-2.5' />
                )}
              </AvatarFallback>
            </Avatar>
          )}
          <span className='truncate'>
            {request.requestedByName ?? t('common.unknown')}
          </span>
        </span>
      </Row>
      {request.approverNames.length > 0 ? (
        <Row label={t('inbox.request.approvers')}>
          <span>
            {new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(
              request.approverNames,
            )}
          </span>
        </Row>
      ) : null}
      <Row label={t('inbox.request.since')}>
        <time
          dateTime={request.createdAt}
          title={new Date(request.createdAt).toLocaleString(i18n.language)}
        >
          {relativeTime(request.createdAt, i18n.language)}
        </time>
      </Row>
    </dl>
  );
}
