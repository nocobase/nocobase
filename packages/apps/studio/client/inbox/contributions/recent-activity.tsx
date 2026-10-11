import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import { PmStatusBadge } from '@nocobase/app-plugin-projects/client/kit';
import { ACCESS_NAMESPACE } from '@nocobase/app-plugin-projects/shared/access';
import type {
  Activity,
  IssueDetail,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { BotIcon, CircleDotIcon, CogIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { relativeTime } from '@/extensions/nocobase-inbox/model';

import { PR_ACTIVITY_LABELS } from '../../git/lib.js';
import { commentSnippet, recentEvents } from './recent-events.js';

/** The projects plugin's activity actions and the keys of their wording, in its namespace. */
const ACTION_LABELS: Readonly<Record<string, string>> = {
  issue_created: 'activity.actions.created',
  issue_deleted: 'activity.actions.deleted',
  issue_restored: 'activity.actions.restored',
  title_changed: 'activity.actions.titleChanged',
  description_changed: 'activity.actions.descriptionChanged',
  status_changed: 'activity.actions.statusChanged',
  priority_changed: 'activity.actions.priorityChanged',
  owner_changed: 'activity.actions.ownerChanged',
  executor_changed: 'activity.actions.executorChanged',
  project_changed: 'activity.actions.projectChanged',
  parent_changed: 'activity.actions.parentChanged',
  labels_changed: 'activity.actions.labelsChanged',
  start_date_changed: 'activity.actions.datesChanged',
  due_date_changed: 'activity.actions.datesChanged',
  checklist_item_checked: 'activity.actions.checklistItemChecked',
  checklist_item_unchecked: 'activity.actions.checklistItemUnchecked',
  owner_notified: 'activity.actions.ownerNotified',
  stage_action_failed: 'activity.actions.stageActionFailed',
  approval_requested: 'activity.actions.approvalRequested',
  approval_approved: 'activity.actions.approvalApproved',
  approval_rejected: 'activity.actions.approvalRejected',
  approval_withdrawn: 'activity.actions.approvalWithdrawn',
  approval_stale: 'activity.actions.approvalStale',
  approval_self: 'activity.actions.approvalSelf',
  approval_no_approver: 'activity.actions.approvalNoApprover',
  comment_deleted: 'activity.actions.commentDeleted',
  thread_resolved: 'activity.actions.threadResolved',
  thread_unresolved: 'activity.actions.threadUnresolved',
  subtask_added: 'activity.actions.subtaskAdded',
  dependency_added: 'activity.actions.dependencyAdded',
  dependency_removed: 'activity.actions.dependencyRemoved',
  stage_changed: 'activity.actions.stageChanged',
  auto_move_skipped: 'activity.actions.autoMoveSkipped',
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function Time({ at }: { readonly at: string }): ReactElement {
  const { i18n } = useTranslation();
  return (
    <time
      dateTime={at}
      title={new Date(at).toLocaleString(i18n.language)}
      className='ml-auto shrink-0 text-xs tabular-nums'
    >
      {relativeTime(at, i18n.language)}
    </time>
  );
}

/** One change as a compact row: who, what, and for a status move the move from one status to the other. */
function ActivityRow({
  activity,
  statuses,
}: {
  readonly activity: Activity;
  readonly statuses: readonly StatusDefinition[];
}): ReactElement {
  const { t } = useTranslation();
  const pm = (key: string) => t(key, { ns: ACCESS_NAMESPACE });
  const actor =
    activity.actorName ??
    (activity.actorType === 'system'
      ? pm('activity.system')
      : t('common.unknown'));
  const from = text(activity.details.from);
  const to = text(activity.details.to);
  const moves =
    activity.action === 'status_changed' ||
    activity.action.startsWith('approval_');
  return (
    <div className='flex items-center gap-2 px-1 text-sm text-muted-foreground'>
      <CircleDotIcon className='size-3.5 shrink-0' aria-hidden='true' />
      {/* A person's name stands alone; initials beside it say nothing more. */}
      {activity.actorType === 'user' ? null : activity.actorType === 'agent' ? (
        <AgentAvatar name={activity.actorName} size='xs' />
      ) : (
        <Avatar
          size='sm'
          aria-hidden='true'
          className='size-4 rounded-md after:rounded-md'
        >
          <AvatarFallback className='rounded-md'>
            {activity.actorType === 'system' ? (
              <CogIcon className='size-2.5' />
            ) : (
              <BotIcon className='size-2.5' />
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <span className='shrink-0 font-medium text-foreground'>{actor}</span>
      <span className='min-w-0 truncate'>
        {PR_ACTIVITY_LABELS[activity.action]
          ? `${t(PR_ACTIVITY_LABELS[activity.action])}${typeof activity.details.number === 'number' ? ` #${activity.details.number}` : ''}`
          : pm(ACTION_LABELS[activity.action] ?? 'activity.actions.updated')}
      </span>
      {moves && to ? (
        <span className='flex shrink-0 items-center gap-1'>
          {from ? <PmStatusBadge statusKey={from} statuses={statuses} /> : null}
          {from ? <span aria-hidden='true'>→</span> : null}
          <PmStatusBadge statusKey={to} statuses={statuses} />
        </span>
      ) : null}
      <Time at={activity.createdAt} />
    </div>
  );
}

/** The issue's latest five events, newest first: its changes, and its comments as one-line snippets ("Latest activity"). */
export function RecentActivity({
  detail,
}: {
  readonly detail: IssueDetail;
}): ReactElement | null {
  const { t } = useTranslation();
  const events = useMemo(() => recentEvents(detail), [detail]);
  if (events.length === 0) return null;
  return (
    <section
      className='space-y-3'
      aria-labelledby='studio-inbox-recent-heading'
    >
      <h2
        id='studio-inbox-recent-heading'
        className='font-heading text-sm font-semibold'
      >
        {t('inbox.recent')}
      </h2>
      <ol className='space-y-2.5'>
        {events.map((event) => (
          <li key={event.key}>
            {'activity' in event ? (
              <ActivityRow
                activity={event.activity}
                statuses={detail.statuses}
              />
            ) : (
              <div className='flex items-center gap-2 px-1 text-sm text-muted-foreground'>
                {event.comment.authorType === 'user' ? null : event.comment
                    .authorType === 'agent' ? (
                  <AgentAvatar name={event.comment.authorName} size='xs' />
                ) : (
                  <Avatar
                    size='sm'
                    aria-hidden='true'
                    className='size-4 rounded-md after:rounded-md'
                  >
                    <AvatarFallback className='rounded-md'>
                      {event.comment.authorType === 'system' ? (
                        <CogIcon className='size-2.5' />
                      ) : (
                        <BotIcon className='size-2.5' />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className='shrink-0 font-medium text-foreground'>
                  {event.comment.authorName ?? t('common.unknown')}
                </span>
                <span className='min-w-0 truncate'>
                  {commentSnippet(event.comment.content, 90)}
                </span>
                <Time at={event.comment.createdAt} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
