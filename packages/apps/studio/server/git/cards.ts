/**
 * Studio's pull request items in the inbox (source `git`), sent through Studio's inbox port and rendered by
 * `studio/client/git/inbox.tsx`:
 *
 * - `pr_merge_requested`, a decision for the issue's owner: an issue entered In review (or a pull request was linked
 *   while it was there) with an open, ready pull request. The card shows the pull request and its checks, with Merge
 *   and Mark as merged. It settles as `merged` or `closed` with the pull request, and is withdrawn when the issue
 *   leaves In review otherwise. One per pull request and issue (`decisionKey` `pr:<pullRequestId>:<issueId>`).
 * - `pr_signal_stopped`, information for the owner: the same signal woke the agent `SIGNAL_WAKE_LIMIT` times in a row,
 *   so it is not woken again until the signal clears.
 *
 * The title and body are English, as the in-app item keeps them for a reader without the renderer.
 */
import {
  GIT_INBOX_SOURCE,
  PR_MERGE_REQUESTED,
  PR_SIGNAL_STOPPED,
  SIGNAL_WAKE_LIMIT,
} from '../../shared/git.js';
import type { StudioInboxPort } from '../inbox/port.js';
import type { PullRequestRow } from './store.js';

/** The status whose issues wait for their pull requests to be merged. */
export const IN_REVIEW = 'in_review';

export interface CardIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly ownerUserId: string;
  /** Tells one stay in In review from the next, so a new stay gets a new card. */
  readonly revision: number;
}

export const decisionKeyOf = (pullRequestId: string, issueId: string) =>
  `pr:${pullRequestId}:${issueId}`;

/** Asks the owner to merge a ready pull request of an issue in review. */
export async function sendMergeCard(
  port: StudioInboxPort,
  issue: CardIssue,
  pr: PullRequestRow,
): Promise<void> {
  if (pr.state !== 'open' || pr.draft) return;
  await port.send({
    key: `git:merge:${pr.id}:${issue.id}:${issue.revision}`,
    source: GIT_INBOX_SOURCE,
    kind: 'decision',
    type: PR_MERGE_REQUESTED,
    userIds: [issue.ownerUserId],
    title: `${issue.identifier}: ${pr.repo}#${pr.number} waits to be merged`,
    body: pr.title,
    path: `/issues/${issue.identifier}`,
    subject: { type: 'issue', id: issue.id, label: issue.identifier },
    decisionKey: decisionKeyOf(pr.id, issue.id),
    actor: null,
    data: {
      issueId: issue.id,
      identifier: issue.identifier,
      issueTitle: issue.title,
      pullRequestId: pr.id,
      repo: pr.repo,
      number: pr.number,
      url: pr.url,
      title: pr.title,
      headRef: pr.headRef,
      baseRef: pr.baseRef,
    },
  });
}

/** Settles every card of the pull request's issues: `merged`, `closed`, or withdrawn. */
export async function settleMergeCards(
  port: StudioInboxPort,
  pullRequestId: string,
  issueIds: readonly string[],
  outcome: 'merged' | 'closed' | 'withdrawn',
): Promise<void> {
  for (const issueId of issueIds) {
    const ref = {
      source: GIT_INBOX_SOURCE,
      decisionKey: decisionKeyOf(pullRequestId, issueId),
    };
    if (outcome === 'withdrawn') await port.withdraw(ref);
    else await port.resolve({ ...ref, outcome });
  }
}

/** Tells the owner that a signal stopped waking the agent. */
export async function sendSignalStopped(
  port: StudioInboxPort,
  issue: CardIssue,
  pr: PullRequestRow,
  signal: 'checks' | 'conflict',
): Promise<void> {
  await port.send({
    key: `git:stopped:${pr.id}:${issue.id}:${signal}:${pr.headSha}`,
    source: GIT_INBOX_SOURCE,
    kind: 'info',
    type: PR_SIGNAL_STOPPED,
    userIds: [issue.ownerUserId],
    title:
      signal === 'checks'
        ? `${issue.identifier}: the checks of ${pr.repo}#${pr.number} keep failing`
        : `${issue.identifier}: ${pr.repo}#${pr.number} keeps conflicting`,
    body: `The agent was woken ${SIGNAL_WAKE_LIMIT} times in a row and is not woken again for it. Look at the pull request.`,
    path: `/issues/${issue.identifier}`,
    subject: { type: 'issue', id: issue.id, label: issue.identifier },
    actor: null,
    data: {
      issueId: issue.id,
      identifier: issue.identifier,
      pullRequestId: pr.id,
      repo: pr.repo,
      number: pr.number,
      url: pr.url,
      signal,
      limit: SIGNAL_WAKE_LIMIT,
    },
  });
}
