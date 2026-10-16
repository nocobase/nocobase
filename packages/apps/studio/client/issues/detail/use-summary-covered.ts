/**
 * Which of the decisions waiting on the viewer the issue's summary already shows (its "Needs you" card, the pull request
 * to merge, the hand-over, the held comment run), so "Waiting for you" leaves them out. The issue page and the task
 * detail beside a list read it the same way.
 */
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { IN_REVIEW_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';
import { useCallback } from 'react';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

import { useIssuePullRequests } from '../../git/api.js';
import { coveredBySummary } from '../live/summary-model.js';
import { useIssueProgress } from './use-issue-progress.js';
import { handoffWaitsOn, useOwnerHandoffView } from './use-owner-handoff.js';
import { usePendingCommentRun } from './use-pending-comment-run.js';

export function useSummaryCovered(
  detail: IssueDetail,
): (entry: InboxEntry) => boolean {
  const viewer = useViewer();
  const progress = useIssueProgress(detail.id).data;
  const handoff = useOwnerHandoffView(detail.id).data;
  const pending = usePendingCommentRun(detail).data;
  const prs = useIssuePullRequests(detail.id).data;
  const selectedPr = prs?.data.find((pr) => pr.state === 'open') ?? null;
  return useCallback(
    (entry: InboxEntry) =>
      coveredBySummary(entry, {
        accepting:
          !progress?.personalRunnerRequests?.some(
            (request) => request.canDecide,
          ) &&
          !handoffWaitsOn(handoff) &&
          detail.statusKey === IN_REVIEW_STATUS &&
          Boolean(viewer?.userId) &&
          viewer?.userId === detail.ownerUserId,
        handoff: handoffWaitsOn(handoff),
        notificationKey: handoff?.handoff?.notificationKey,
        pullRequest: selectedPr,
        blocked: detail.statusKey === 'blocked',
        ownerRequest:
          detail.statusKey === 'blocked' &&
          viewer?.userId === detail.ownerUserId,
        continuation: Boolean(pending),
        personalRequestIds: progress?.personalRunnerRequests
          ?.filter((request) => request.canDecide)
          .map((request) => request.id),
      }),
    [
      detail.statusKey,
      detail.ownerUserId,
      viewer?.userId,
      handoff,
      selectedPr,
      pending,
      progress,
    ],
  );
}
