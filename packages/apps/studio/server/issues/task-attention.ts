import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import {
  isTerminalCategory,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';
import type {
  TaskAttention,
  TaskReason,
  TaskGroup,
} from '../../shared/task-trees.js';
import type { TaskDecisionSummary } from '../inbox/service.js';
import type { OwnerHandoff } from './owner-handoff.js';

export const REASON_GROUP: Readonly<
  Record<TaskReason, Exclude<TaskGroup, 'routine'>>
> = {
  question: 'input',
  review: 'review',
  failedRun: 'decision',
  ownerHandoff: 'decision',
};
export const NO_ATTENTION: TaskAttention = {
  reasons: [],
  needsHumanAction: false,
  waitingForViewer: false,
};

/** Existing board/workflow and current decision semantics, with no private decision payload in the result. */
export function taskAttention(
  issue: Issue,
  viewer: Viewer,
  dependencyWait: boolean,
  decisions: readonly TaskDecisionSummary[],
  handoff?: OwnerHandoff,
): TaskAttention {
  if (isTerminalCategory(statusCategory(issue.statusKey))) return NO_ATTENTION;
  const reasons = new Set<TaskReason>();
  let waiting = false;
  const owner = issue.ownerUserId === viewer.userId;
  const editor = viewer.permissions.scopes['pm.issues/edit'] !== 'none';
  const commenter = viewer.permissions.scopes['pm.issues/comment'] !== 'none';
  const closer = viewer.permissions.scopes['pm.issues/close'] !== 'none';
  if (issue.statusKey === 'blocked' && !dependencyWait) {
    reasons.add('question');
    waiting ||= owner && (commenter || editor);
  }
  if (issue.statusKey === 'in_review') {
    reasons.add('review');
    waiting ||= owner && (closer || editor);
  }
  for (const decision of decisions) {
    if (decision.type === 'agent_blocked' && issue.statusKey === 'blocked') {
      reasons.add('question');
      waiting ||= decision.waitingForViewer && (commenter || editor);
    }
    if (
      decision.type === 'run_failed_final' &&
      issue.statusKey !== 'in_review'
    ) {
      reasons.add('failedRun');
      waiting ||= decision.waitingForViewer && (owner || editor);
    }
  }
  if (
    handoff?.waiting &&
    !handoff.rejectedAt &&
    handoff.ownerUserId === issue.ownerUserId
  ) {
    reasons.add('ownerHandoff');
    waiting ||= owner && editor;
  }
  return {
    reasons: [...reasons],
    needsHumanAction: reasons.size > 0,
    waitingForViewer: waiting,
  };
}
