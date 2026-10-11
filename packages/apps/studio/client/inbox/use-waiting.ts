/** The decisions about one issue still waiting on the viewer, as "Waiting for you" and the issue page read them. */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { UseQueryResult } from '@tanstack/react-query';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

import { useWaitingAbout } from './source.js';

/** The type of the projects plugin's approval decision, whose card on the issue page "Waiting for you" replaces. */
const APPROVAL_REQUESTED = 'approval_requested';

export function useWaiting(
  issue: IssueDetail,
): UseQueryResult<readonly InboxEntry[]> {
  return useWaitingAbout(`issue:${issue.id}`);
}

/** Whether "Waiting for you" decides the issue's pending approval, so the page leaves its own approval card out. */
export function useWaitingCoversApproval(issue: IssueDetail): boolean {
  const entries = useWaiting(issue).data ?? [];
  const approvalId = issue.pendingApproval?.id ?? null;
  return (
    approvalId !== null &&
    entries.some(
      (entry) =>
        entry.notice?.source === 'projects' &&
        entry.notice.type === APPROVAL_REQUESTED &&
        entry.notice.decisionKey === approvalId,
    )
  );
}
