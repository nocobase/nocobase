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

/** Longest question a short ask quotes. */
const QUESTION_LENGTH = 120;

/**
 * A question as a short label: its first sentence, without Markdown (links read as their text, code as its content),
 * cut to a line or two. Null when nothing is left.
 */
export function shortQuestion(question: string): string | null {
  const plain = question
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/`([^`]*)`/gu, '$1')
    .replace(/[*_~]+/gu, '')
    .replace(/^[#>\-+\s]+/gmu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  if (!plain) return null;
  const sentence = /^.+?(?:[。！？]|[.!?](?=\s|$))/u.exec(plain)?.[0] ?? plain;
  return sentence.length > QUESTION_LENGTH
    ? `${sentence.slice(0, QUESTION_LENGTH - 1)}…`
    : sentence;
}

/** What the viewer is asked to do on an issue that waits for them; null when it does not. */
export function askOf(
  t: Translate,
  issue: Pick<FollowUpIssue, 'owned' | 'statusKey' | 'progress'>,
  mark: Pick<PullRequestMark, 'label' | 'state'> | null | undefined,
): string | null {
  if (!needsViewer(issue)) return null;
  if (issue.statusKey === 'in_review')
    return mark && mark.state === 'open'
      ? t('issueLive.ask.acceptPullRequest', {
          label: pullRequestLabel(mark),
        })
      : t('issueLive.ask.acceptIssue');
  const question = issue.progress?.question
    ? shortQuestion(issue.progress.question)
    : null;
  return question
    ? t('issueLive.ask.answer', { question })
    : t('issueLive.ask.answerNoQuestion');
}

/** What is going on, in one line: the viewer's part when it waits for them, else what it waits for. */
export function nowLine(
  t: Translate,
  issue: Pick<FollowUpIssue, 'owned' | 'statusKey' | 'progress'>,
  mark: Pick<PullRequestMark, 'label' | 'state'> | null | undefined,
  now: number = Date.now(),
): { readonly text: string; readonly needsViewer: boolean } | null {
  const ask = askOf(t, issue, mark);
  if (ask) return { text: ask, needsViewer: true };
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
  shown: { readonly accepting: boolean; readonly handoff: boolean },
): boolean {
  const notice = entry.notice;
  if (!notice) return false;
  if (
    shown.accepting &&
    notice.source === GIT_INBOX_SOURCE &&
    notice.type === PR_MERGE_REQUESTED
  )
    return true;
  return shown.handoff && HANDOFF_TYPES.has(notice.type);
}
