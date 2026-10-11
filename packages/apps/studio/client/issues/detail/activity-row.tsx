/**
 * One change on an issue's activity line, in the installed `comment-thread`'s `TimelineActivity`: who, through which
 * agent or plan, what they did in the projects plugin's words, and for a status change the move between statuses.
 */
import { AgentAvatar } from '@nocobase/app-plugin-agents/client/kit';
import { useAgentNames } from '@nocobase/app-plugin-agents/client/runs';
import { useEventTitle } from '@nocobase/app-plugin-projects/client/issues';
import { useApiKeyActors } from '@nocobase/app-plugin-projects/client/kit';
import type {
  Activity,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';
import { isBuiltInEvent } from '@nocobase/app-plugin-projects/shared/workflows';
import { useTranslation } from '@nocobase/i18n/client';
import { BotIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { TimelineActivity } from '@/components/comment-thread';

import { EXECUTOR_WAITS_ACTIVITY } from '../../../shared/design.js';
import {
  PR_ACTIVITIES,
  PR_EDIT_FIELDS,
  type PullRequestEditField,
} from '../../../shared/git.js';
import { PR_ACTIVITY_LABELS } from '../../git/lib.js';

import type { Translate } from './labels.js';
import { usePlanLinkTo } from './plan-links.js';
import { StatusBadge } from './status-badge.js';

/** The server's activity actions and the keys of their wording. */
const ACTION_LABELS: Readonly<Record<string, string>> = {
  issue_created: 'created',
  issue_deleted: 'deleted',
  issue_restored: 'restored',
  title_changed: 'titleChanged',
  description_changed: 'descriptionChanged',
  status_changed: 'statusChanged',
  priority_changed: 'priorityChanged',
  owner_changed: 'ownerChanged',
  executor_changed: 'executorChanged',
  project_changed: 'projectChanged',
  parent_changed: 'parentChanged',
  labels_changed: 'labelsChanged',
  start_date_changed: 'datesChanged',
  due_date_changed: 'datesChanged',
  checklist_item_checked: 'checklistItemChecked',
  checklist_item_unchecked: 'checklistItemUnchecked',
  owner_notified: 'ownerNotified',
  stage_action_applied: 'stageActionApplied',
  stage_action_skipped: 'stageActionSkipped',
  stage_action_failed: 'stageActionFailed',
  approval_requested: 'approvalRequested',
  approval_approved: 'approvalApproved',
  approval_rejected: 'approvalRejected',
  approval_withdrawn: 'approvalWithdrawn',
  approval_stale: 'approvalStale',
  approval_self: 'approvalSelf',
  approval_no_approver: 'approvalNoApprover',
  comment_deleted: 'commentDeleted',
  attachment_added: 'attachmentAdded',
  attachment_removed: 'attachmentRemoved',
  thread_resolved: 'threadResolved',
  thread_unresolved: 'threadUnresolved',
  subtask_added: 'subtaskAdded',
  dependency_added: 'dependencyAdded',
  dependency_removed: 'dependencyRemoved',
  stage_changed: 'stageChanged',
  auto_move_skipped: 'autoMoveSkipped',
  work_withdrawn: 'workWithdrawn',
};

/** The fields a pull request edit changed, in Studio's words. */
function editedFields(t: Translate, details: Activity['details']): string {
  const fields = Array.isArray(details.fields) ? details.fields : [];
  return fields
    .filter((field): field is PullRequestEditField =>
      (PR_EDIT_FIELDS as readonly unknown[]).includes(field),
    )
    .map((field) => t(`studioGit.activity.fields.${field}`))
    .join(', ');
}

/** The pull request a Studio pull request action names, linked to the code host, and what the action said. */
function PullRequestActivity({
  activity,
  t,
}: {
  readonly activity: Activity;
  readonly t: Translate;
}): ReactElement {
  const { details } = activity;
  const url = text(details.url);
  const label =
    text(details.repo) && typeof details.number === 'number'
      ? `${text(details.repo)}#${details.number}`
      : null;
  const fields =
    activity.action === PR_ACTIVITIES.edited ? editedFields(t, details) : '';
  const reason =
    activity.action === PR_ACTIVITIES.closed ? text(details.reason) : null;
  return (
    <>
      {label && url ? (
        <a
          href={url}
          target='_blank'
          rel='noreferrer'
          className='font-mono text-xs text-foreground hover:underline'
        >
          {label}
        </a>
      ) : label ? (
        <span className='font-mono text-xs text-foreground'>{label}</span>
      ) : null}
      {fields ? <span>{fields}</span> : null}
      {details.unlinked === true ? (
        <span>{t('studioGit.activity.unlinked')}</span>
      ) : null}
      {reason ? (
        <span className='min-w-0 break-words text-foreground'>{reason}</span>
      ) : null}
    </>
  );
}

/** The wording of an action whose reason changes what it says. */
function actionLabel(action: string, details: Activity['details']): string {
  const reason = details.reason;
  let key = ACTION_LABELS[action] ?? 'updated';
  if (action === 'executor_changed' && reason === 'executorRemoved')
    key = 'executorRemoved';
  else if (action === 'stage_action_skipped' && reason === 'suppressed')
    key = 'stageActionSuppressed';
  else if (action === 'stage_action_skipped' && reason === 'blocked')
    key = 'stageActionBlocked';
  else if (action === 'work_skipped')
    key = reason === 'dormant' ? 'workDormant' : 'workBlocked';
  return `activity.actions.${key}`;
}

/** The identifiers of the issues an activity says the issue waits for. */
function blockerIdentifiers(details: Activity['details']): string[] {
  const blockers = details.blockers;
  if (!Array.isArray(blockers)) return [];
  return blockers.flatMap((blocker: unknown) => {
    const identifier =
      blocker && typeof blocker === 'object'
        ? (blocker as { identifier?: unknown }).identifier
        : null;
    return typeof identifier === 'string' && identifier ? [identifier] : [];
  });
}

const OTHER_ISSUE: ReadonlySet<string> = new Set([
  'subtask_added',
  'dependency_added',
  'dependency_removed',
]);

const STATUS_MOVES: ReadonlySet<string> = new Set([
  'status_changed',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
  'approval_withdrawn',
  'approval_stale',
  'approval_self',
  'approval_no_approver',
]);

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function viaLabel(
  t: Translate,
  activity: Activity,
  agentName: (agentId: string) => string | null,
): string | null {
  const { via } = activity;
  if (!via) return null;
  const agent =
    (via.agentId ? agentName(via.agentId) : null) ??
    via.agentName ??
    t('common.unknown');
  if (via.type === 'agent')
    return via.planId
      ? t('activity.via.agentPlan', { agent })
      : t('activity.via.agent', { agent });
  if (via.type === 'plan') return t('activity.via.plan');
  return null;
}

export function ActivityRow({
  activity,
  statuses,
  t,
}: {
  readonly activity: Activity;
  readonly statuses: readonly StatusDefinition[];
  readonly t: Translate;
}): ReactElement {
  // Studio's own namespace, for the actions Studio records itself; `t` is the projects plugin's.
  const { i18n, t: studioT } = useTranslation();
  const prAction = PR_ACTIVITY_LABELS[activity.action];
  const planTo = usePlanLinkTo();
  const apiKeys = useApiKeyActors();
  const eventTitle = useEventTitle();
  // An agent's name in the viewer's language (a built-in agent's), when the viewer may read agents.
  const agentName = useAgentNames();
  const keyName =
    activity.actorType === 'user' && activity.actorId
      ? apiKeys.get(activity.actorId)
      : undefined;
  const shownName =
    (activity.actorType === 'agent' && activity.actorId
      ? agentName(activity.actorId)
      : null) ?? activity.actorName;
  const actor =
    shownName ??
    keyName ??
    (activity.actorType === 'system'
      ? t('activity.system')
      : t('common.unknown'));
  const from = text(activity.details.from);
  const to = text(activity.details.to);
  const via = viaLabel(t, activity, agentName);
  const event = text(activity.details.event);
  const moved =
    activity.action === 'status_changed' ||
    activity.action === 'auto_move_skipped';
  return (
    <TimelineActivity
      actorName={actor}
      actorKind={activity.actorType}
      actorIcon={
        activity.actorType === 'agent' ? (
          <AgentAvatar name={shownName} size='xs' className='size-full' />
        ) : (
          <BotIcon />
        )
      }
      at={activity.createdAt}
      locale={i18n.language}
    >
      {keyName ? <span className='text-xs'>{t('common.apiKey')}</span> : null}
      {via && activity.via?.planId ? (
        <Link
          to={planTo(activity.via.planId)}
          className='text-xs hover:text-foreground hover:underline'
        >
          {via}
        </Link>
      ) : via ? (
        <span className='text-xs'>{via}</span>
      ) : null}
      <span>
        {prAction
          ? studioT(prAction)
          : activity.action === EXECUTOR_WAITS_ACTIVITY
            ? studioT('studioAgents.activity.executorWaits', {
                name:
                  (text(activity.details.agentId)
                    ? agentName(text(activity.details.agentId) ?? '')
                    : null) ??
                  text(activity.details.name) ??
                  t('common.unknown'),
              })
            : t(actionLabel(activity.action, activity.details), {
                name: text(activity.details.name) ?? t('common.unknown'),
              })}
      </span>
      {prAction ? (
        <PullRequestActivity activity={activity} t={studioT} />
      ) : null}
      {activity.action.startsWith('checklist_item_') &&
      text(activity.details.label) ? (
        <span className='text-foreground'>{text(activity.details.label)}</span>
      ) : null}
      {activity.action === 'attachment_added' &&
      Array.isArray(activity.details.filenames) ? (
        <span className='min-w-0 truncate text-foreground'>
          {activity.details.filenames
            .filter((name): name is string => typeof name === 'string')
            .join(', ')}
        </span>
      ) : null}
      {activity.action === 'attachment_removed' &&
      text(activity.details.filename) ? (
        <span className='min-w-0 truncate text-foreground'>
          {text(activity.details.filename)}
        </span>
      ) : null}
      {OTHER_ISSUE.has(activity.action) && text(activity.details.identifier) ? (
        <span className='font-mono text-xs text-foreground'>
          {text(activity.details.identifier)}
        </span>
      ) : null}
      {blockerIdentifiers(activity.details).map((identifier) => (
        <span key={identifier} className='font-mono text-xs text-foreground'>
          {identifier}
        </span>
      ))}
      {activity.action === 'work_skipped' &&
      activity.details.reason === 'dormant' &&
      text(activity.details.status) ? (
        <StatusBadge
          statusKey={text(activity.details.status) ?? ''}
          statuses={statuses}
        />
      ) : null}
      {activity.action === 'stage_changed' ? (
        <span className='text-foreground'>
          {[activity.details.from, activity.details.to]
            .map((stage) =>
              typeof stage === 'number' ? String(stage) : t('subtasks.noStage'),
            )
            .join(' → ')}
        </span>
      ) : null}
      {STATUS_MOVES.has(activity.action) && to ? (
        <>
          {from ? <StatusBadge statusKey={from} statuses={statuses} /> : null}
          {from ? <span aria-hidden='true'>→</span> : null}
          <StatusBadge statusKey={to} statuses={statuses} />
        </>
      ) : null}
      {activity.action === 'auto_move_skipped' && to ? (
        <StatusBadge statusKey={to} statuses={statuses} />
      ) : null}
      {activity.action === 'status_changed' &&
      activity.details.event === 'subtasks.done' ? (
        <span>{t('activity.afterSubtasks')}</span>
      ) : null}
      {moved && event && !isBuiltInEvent(event) ? (
        <span>
          {t('activity.afterEvent', { event: eventTitle(event) ?? event })}
        </span>
      ) : null}
      {moved && text(activity.details.note) ? (
        <span className='text-foreground'>{text(activity.details.note)}</span>
      ) : null}
    </TimelineActivity>
  );
}
