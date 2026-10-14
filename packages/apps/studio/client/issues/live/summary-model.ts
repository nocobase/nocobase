/**
 * What an issue says about itself on the issue pages and "My follow-ups": what the viewer has to do when it waits for
 * them, and what is going on otherwise.
 */
import type { FollowUpIssue } from '../../../shared/follow-ups.js';
import { GIT_INBOX_SOURCE, PR_MERGE_REQUESTED } from '../../../shared/git.js';
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import type { PullRequestMark } from '../../../shared/git.js';
import { progressStatusLine } from '../detail/progress-text.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The issue waits for the viewer: they own it and it is blocked or in review. */
export function needsViewer(
  issue: Pick<FollowUpIssue, 'owned' | 'statusKey'>,
): boolean {
  return (
    issue.owned &&
    (issue.statusKey === 'blocked' || issue.statusKey === 'in_review')
  );
}

/** A pull request mark's label as people say it: `PR #123` for `owner/name#123`. */
export function pullRequestLabel(mark: Pick<PullRequestMark, 'label'>): string {
  const number = /#(\d+)$/u.exec(mark.label)?.[1];
  return number ? `PR #${number}` : mark.label;
}

/** What the viewer is asked to do on an issue that waits for them; null when it does not. */
export function askOf(
  t: Translate,
  issue: Pick<FollowUpIssue, 'owned' | 'statusKey' | 'progress'>,
  _mark: Pick<PullRequestMark, 'label' | 'state'> | null | undefined,
): string | null {
  if (!issue.owned || ['done', 'cancelled'].includes(issue.statusKey))
    return null;
  if (needsViewer(issue))
    return issue.progress?.needsYou ?? t('issueLive.ask.legacy');
  if (issue.progress?.waiting?.reason === 'waitingOwner')
    return t('issueLive.ask.takeOver');
  if (issue.progress?.state === 'waitingForContinuation')
    return t('issueLive.ask.continue');
  return null;
}

/** What is going on, in one line: the viewer's part when it waits for them, else what it waits for. */
export function nowLine(
  t: Translate,
  issue: Pick<FollowUpIssue, 'owned' | 'statusKey' | 'progress'>,
  mark: Pick<PullRequestMark, 'label' | 'state'> | null | undefined,
  now: number = Date.now(),
): { readonly text: string; readonly needsViewer: boolean } | null {
  const ask = askOf(t, issue, mark);
  if (ask)
    return {
      text: ask,
      needsViewer: true,
    };
  if (!issue.progress) return null;
  // A short line from the progress itself, never the manager's step prose.
  return {
    text: progressStatusLine(t, issue.progress, now),
    needsViewer: false,
  };
}

/** The owner handoff decisions the inbox holds, by notice type. */
const HANDOFF_TYPES: ReadonlySet<string> = new Set([
  'owner_handoff',
  'owner_handoff_rejected',
]);

/**
 * Whether the summary's "Needs you" card already shows this waiting decision: the pull request to merge while the
 * viewer accepts the work, or the handoff they are to take over.
 */
export function coveredBySummary(
  entry: Pick<InboxEntry, 'notice'>,
  shown: {
    readonly accepting: boolean;
    readonly handoff: boolean;
    readonly pullRequest?: {
      readonly repo: string;
      readonly number: number;
    } | null;
    readonly blocked?: boolean;
    readonly ownerRequest?: boolean;
    readonly continuation?: boolean;
    readonly notificationKey?: string | null;
  },
): boolean {
  const notice = entry.notice;
  if (!notice) return false;
  if (
    shown.accepting &&
    notice.source === GIT_INBOX_SOURCE &&
    notice.type === PR_MERGE_REQUESTED &&
    notice.data?.repo === shown.pullRequest?.repo &&
    Number(notice.data?.number) === shown.pullRequest?.number
  )
    return true;
  if (notice.type === 'agent_blocked')
    // The card represents the structured request, regardless of which explanation the notice linked at the time.
    return !shown.blocked || Boolean(shown.ownerRequest);
  if (shown.continuation && notice.type === 'comment_runs_limited') return true;
  return (
    shown.handoff &&
    HANDOFF_TYPES.has(notice.type) &&
    notice.data?.notificationKey === shown.notificationKey
  );
}
