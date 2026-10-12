/**
 * The projects plugin's wording of an issue's activities, by action: the issue page's activity line
 * (`activity-row.tsx`) and "My follow-ups" (`../../follow-ups/issue-panel.tsx`) say a change the same way.
 */
import type { Activity } from '@nocobase/app-plugin-projects/shared/issues';

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

/** The projects plugin's wording key of an activity's action, which its reason may change. */
export function actionLabel(
  action: string,
  details: Activity['details'],
): string {
  const reason = details.reason;
  let key = ACTION_LABELS[action] ?? 'updated';
  if (action === 'executor_changed' && reason === 'executorRemoved')
    key = 'executorRemoved';
  else if (action === 'stage_action_skipped' && reason === 'suppressed')
    key = 'stageActionSuppressed';
  else if (action === 'stage_action_skipped' && reason === 'blocked')
    key = 'stageActionBlocked';
  else if (action === 'work_skipped')
    key =
      reason === 'dormant'
        ? 'workDormant'
        : reason === 'limited'
          ? 'workLimited'
          : 'workBlocked';
  return `activity.actions.${key}`;
}
