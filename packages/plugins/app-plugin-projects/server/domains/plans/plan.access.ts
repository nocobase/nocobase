/**
 * Who may see and decide a plan (`shared/plans.ts`): its decider; for a status rule's plan about an issue, also the
 * issue's owner and whoever may edit that issue. Anybody else gets 404, so a plan's existence does not leak.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { scopeOf, type Viewer } from '../../access/viewer.js';
import { canSee, findIssue } from '../issues/index.js';
import type { PlanRecord } from './plan.store.js';

export async function maySeePlan(
  conn: DatabaseConnection,
  viewer: Viewer,
  plan: Pick<PlanRecord, 'deciderUserId' | 'sourceKind' | 'sourceIssueId'>,
): Promise<boolean> {
  if (plan.deciderUserId === viewer.userId) return true;
  if (plan.sourceKind !== 'statusRule' || !plan.sourceIssueId) return false;
  const issue = await findIssue(conn, plan.sourceIssueId);
  if (!issue || !(await canSee(conn, viewer, issue))) return false;
  return (
    issue.ownerUserId === viewer.userId ||
    scopeOf(viewer, 'pm.issues', 'edit') !== 'none'
  );
}
