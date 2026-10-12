/** The issue page's "Now" line in words (`issue-progress.tsx`). */
import type { IssueProgress } from '../../../shared/project-manager.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const issueProgressKey = (issueId: string) =>
  ['studio', 'issueProgress', issueId] as const;

/** Whole minutes since `since`, at least one. */
function minutesSince(since: string, now: number): number {
  return Math.max(1, Math.floor((now - Date.parse(since)) / 60_000));
}

/** What the issue waits for, in one sentence. */
export function progressSentence(
  t: Translate,
  progress: IssueProgress,
  now: number = Date.now(),
): string {
  const agent = progress.agent?.name ?? t('issueProgress.anAgent');
  switch (progress.state) {
    case 'working': {
      const parts = [
        progress.step
          ? t('issueProgress.working', { agent, step: progress.step })
          : t('issueProgress.workingNoStep', { agent }),
      ];
      if (progress.since)
        parts.push(
          t('issueProgress.for', {
            minutes: minutesSince(progress.since, now),
          }),
        );
      if (progress.runner)
        parts.push(t('issueProgress.on', { runner: progress.runner }));
      return parts.join(' · ');
    }
    case 'queued':
      if (progress.managerWait) {
        const wait = progress.managerWait;
        const entries = wait.entries
          .map((entry, index) =>
            t('issueProgress.managerModelWait', {
              choice: t(
                index === 0
                  ? 'issueProgress.firstChoice'
                  : 'issueProgress.fallback',
              ),
              model: `${entry.tool}${entry.model ? ` · ${entry.model}` : ''}`,
              reason: t(`issueProgress.modelWait.${entry.reason}`),
              runners: entry.runners.length
                ? ` (${entry.runners.join(', ')})`
                : '',
            }),
          )
          .join('; ');
        const seconds = Math.max(
          0,
          Math.ceil(
            (Date.parse(wait.queueEnteredAt) +
              wait.fallbackAfterSeconds * 1000 -
              now) /
              1000,
          ),
        );
        return (
          t('issueProgress.managerWaiting', { entries }) +
          (wait.entries.length > 1
            ? ` · ${t(seconds > 0 ? 'issueProgress.fallbackIn' : 'issueProgress.fallbackReady', { seconds })}`
            : '')
        );
      }
      return progress.step
        ? t('issueProgress.queued', { agent, step: progress.step })
        : t('issueProgress.queuedNoStep', { agent });
    case 'checksPending':
      return progress.pullRequest
        ? t('issueProgress.checksPending', {
            number: progress.pullRequest.number,
          })
        : t('issueProgress.checksPendingNoPr');
    case 'needsDecision':
      return progress.question
        ? t('issueProgress.needsDecision', { question: progress.question })
        : t('issueProgress.needsDecisionNoQuestion');
    default:
      return t(`issueProgress.${progress.state}`);
  }
}
