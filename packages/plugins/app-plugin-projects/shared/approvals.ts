/**
 * Approval requests: a status change a workflow holds until one of its approvers approves it. A request is pending
 * until it is approved (the issue moves), rejected (it stays), withdrawn by who asked, or stale: the issue left the
 * status meanwhile, or the move's conditions no longer hold when it is approved.
 */
import type { ApproverRole } from './workflows.js';

export type ApprovalStatus =
  'pending' | 'approved' | 'rejected' | 'withdrawn' | 'stale';

export interface ApprovalRequest {
  readonly id: string;
  readonly issueId: string;
  readonly issueIdentifier: string | null;
  readonly issueTitle: string | null;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly requestedByType: string;
  readonly requestedById: string;
  readonly requestedByName: string | null;
  /** The roles the workflow named. */
  readonly approvers: readonly ApproverRole[];
  /** Who they resolved to when the request was made; any one of them decides. */
  readonly approverUserIds: readonly string[];
  readonly approverNames: readonly string[];
  readonly status: ApprovalStatus;
  readonly decidedById: string | null;
  readonly decidedByName: string | null;
  readonly decidedAt: string | null;
  readonly comment: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DecideApprovalRequest {
  readonly comment?: string;
}

export const APPROVAL_COMMENT_MAX = 2000;

/** How many decided requests the issue page lists (`IssueDetail.recentApprovals`). */
export const RECENT_DECIDED_APPROVALS = 5;
