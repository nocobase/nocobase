/**
 * What a task waits on the viewer for (`WaitReason`, `shared/task-groups.ts`), from what the issue page's "Needs you"
 * and the inbox already go by: the issue's own status for the owner (in review: accept it; blocked without a blocker:
 * answer it), the inbox's open decisions (an agent's question, a run that failed for good), a handoff of the issue to
 * the viewer, and an open plan about it that the viewer decides. A finished task waits for nobody.
 */
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import {
  PLAN_OPEN_STATUSES,
  type Plan,
} from '@nocobase/app-plugin-projects/shared/plans';
import {
  isTerminalCategory,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';

import type { WaitReason } from '../../shared/task-groups.js';
import type { TaskDecisionSummary } from '../inbox/service.js';
import type { OwnerHandoff } from './owner-handoff.js';
import { orderWaits, type TaskWait } from './task-group-model.js';

export interface TaskWaitInput {
  readonly dependencyWait: boolean;
  readonly decisions: readonly TaskDecisionSummary[];
  readonly handoff?: OwnerHandoff | undefined;
  /** Open plans about the issue (`source.issueId`). */
  readonly plans?: readonly Plan[];
  readonly now?: number;
}

/** Whether `plan` waits for `viewer` to decide it, as the issue page's "Related plans" says. */
export function planAwaitsViewer(
  plan: Plan,
  viewer: Pick<Viewer, 'userId'>,
  issueOwnerUserId: string,
  now: number = Date.now(),
): boolean {
  if (!PLAN_OPEN_STATUSES.includes(plan.status)) return false;
  if (Date.parse(plan.expiresAt) <= now) return false;
  return (
    plan.deciderUserId === viewer.userId ||
    (plan.source.kind === 'statusRule' && issueOwnerUserId === viewer.userId)
  );
}

export function taskWait(
  issue: Pick<
    Issue,
    'id' | 'statusKey' | 'ownerUserId' | 'updatedAt' | 'lastActivityAt'
  >,
  viewer: Viewer,
  input: TaskWaitInput,
): TaskWait | null {
  if (isTerminalCategory(statusCategory(issue.statusKey))) return null;
  const owner = issue.ownerUserId === viewer.userId;
  const scope = (key: string) =>
    viewer.permissions.scopes[key as keyof typeof viewer.permissions.scopes] !==
    'none';
  const editor = scope('pm.issues/edit');
  const commenter = scope('pm.issues/comment');
  const closer = scope('pm.issues/close');
  const reasons = new Set<WaitReason>();
  if (issue.statusKey === 'in_review' && owner && (closer || editor))
    reasons.add('accept');
  if (
    issue.statusKey === 'blocked' &&
    !input.dependencyWait &&
    owner &&
    (commenter || editor)
  )
    reasons.add('answer');
  for (const decision of input.decisions) {
    if (!decision.waitingForViewer) continue;
    if (
      decision.type === 'agent_blocked' &&
      issue.statusKey === 'blocked' &&
      (commenter || editor)
    )
      reasons.add('answer');
    if (decision.type === 'run_failed_final' && (owner || editor))
      reasons.add('failed');
  }
  const handoff = input.handoff;
  if (
    handoff?.waiting &&
    !handoff.rejectedAt &&
    handoff.ownerUserId === issue.ownerUserId &&
    owner &&
    editor
  )
    reasons.add('takeOver');
  const now = input.now ?? Date.now();
  const plans = (input.plans ?? []).filter((plan) =>
    planAwaitsViewer(plan, viewer, issue.ownerUserId, now),
  );
  if (plans.length > 0) reasons.add('plan');
  if (reasons.size === 0) return null;
  // Since when: the earliest of the issue's last change, the handoff and the plans that wait for the viewer.
  const since = [
    issue.updatedAt,
    ...(reasons.has('takeOver') && handoff ? [handoff.transferredAt] : []),
    ...plans.map((plan) => plan.createdAt),
  ].reduce((earliest, value) => (value < earliest ? value : earliest));
  return { reasons: orderWaits(reasons), since };
}
