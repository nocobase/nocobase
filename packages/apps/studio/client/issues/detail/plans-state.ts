/**
 * The state behind the issue page's "Related plans" (`issue-plans.tsx`): which plans wait for the viewer's decision,
 * and the person's last choice to open or close the section.
 */
import {
  PLAN_OPEN_STATUSES,
  type Plan,
} from '@nocobase/app-plugin-projects/shared/plans';

/** The person's last choice to open or close the section, on every issue. */
export const PLANS_OPEN_KEY = 'studio:issue-plans:open';

export function readOpenChoice(): boolean | null {
  try {
    const value = localStorage.getItem(PLANS_OPEN_KEY);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
}

export function writeOpenChoice(open: boolean): void {
  try {
    localStorage.setItem(PLANS_OPEN_KEY, String(open));
  } catch {
    // Storage may be blocked; the section still opens and closes.
  }
}

/**
 * Whether `plan` waits for `viewerId` to decide it: it is still open and has not expired, and the viewer is its
 * decider, or the issue's owner for a status rule's plan (which the plugin lets the owner decide too).
 */
export function awaitsViewer(
  plan: Plan,
  viewerId: string | undefined,
  issueOwnerId: string,
  now: number = Date.now(),
): boolean {
  if (!viewerId || !PLAN_OPEN_STATUSES.includes(plan.status)) return false;
  if (Date.parse(plan.expiresAt) <= now) return false;
  return (
    plan.deciderUserId === viewerId ||
    (plan.source.kind === 'statusRule' && issueOwnerId === viewerId)
  );
}
