/**
 * What an issue says about itself on the issue pages and "My follow-ups": what the viewer has to do when it waits for
 * them, and what is going on otherwise.
 */
import type { FollowUpIssue } from '../../../shared/follow-ups.js';
import type { PullRequestMark } from '../../../shared/git.js';
import { progressSentence } from '../detail/progress-text.js';

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
  mark: Pick<PullRequestMark, 'label' | 'state'> | null | undefined,
): string | null {
  if (!needsViewer(issue)) return null;
  if (issue.statusKey === 'in_review')
    return mark && mark.state === 'open'
      ? t('issueLive.ask.acceptPullRequest', {
          label: pullRequestLabel(mark),
        })
      : t('issueLive.ask.acceptIssue');
  return issue.progress?.question
    ? t('issueLive.ask.answer', { question: issue.progress.question })
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
  return { text: progressSentence(t, issue.progress, now), needsViewer: false };
}
