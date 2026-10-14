/** The issue page's "Now" line in words (`issue-progress.tsx`). */
import type { IssueProgress } from '../../../shared/project-manager.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const issueProgressKey = (issueId: string) =>
  ['studio', 'issueProgress', issueId] as const;

/** Whole minutes since `since`, at least one. */
function minutesSince(since: string, now: number): number {
  return Math.max(1, Math.floor((now - Date.parse(since)) / 60_000));
}

function runnerNames(
  t: Translate,
  entry: NonNullable<IssueProgress['managerWait']>['entries'][number],
): string {
  if (!entry.runnerLoads?.length) return entry.runners.join(', ');
  return entry.runnerLoads
    .map((runner) => {
      const reason = t(`issueProgress.modelWait.${runner.reason ?? 'unknown'}`);
      if (runner.used === undefined) return `${runner.name}: ${reason}`;
      return t('issueProgress.runnerLoad', {
        name: runner.name,
        reason,
        used: runner.used,
        limit: runner.limit,
        tool: entry.tool,
        toolUsed: runner.toolUsed,
        toolLimit: runner.toolLimit,
        free: runner.reportedFree ?? '—',
        totalFree: runner.reportedTotalFree ?? '—',
      });
    })
    .join(', ');
}

/** What the issue waits for, in one sentence, without surrounding whitespace. */
export function progressSentence(
  t: Translate,
  progress: IssueProgress,
  now: number = Date.now(),
): string {
  return sentence(t, progress, now).trim();
}

/**
 * What "Now" says on the issue page and its summary: one short line from the progress itself, never the manager's
 * prose. Working is "<agent> working · <n> min · <runner>", queued "<agent> queued" (or why it waits for a runner);
 * other states are their sentence.
 */
export function progressStatusLine(
  t: Translate,
  progress: IssueProgress,
  now: number = Date.now(),
): string {
  const agent = progress.agent?.name ?? t('issueProgress.anAgent');
  // Waiting for a runner keeps its account of each choice and runner; the Now line cuts it to two lines.
  if (progress.state === 'queued' && !progress.managerWait)
    return t('issueProgress.status.queued', { agent });
  if (progress.state === 'queued' || progress.waiting)
    return progressSentence(t, progress, now);
  // The question itself is the "Needs you" card's.
  if (progress.state === 'needsDecision')
    return t('issueProgress.needsDecisionNoQuestion');
  if (progress.state === 'working')
    return [
      t('issueProgress.status.working', { agent }),
      progress.since
        ? t('issueProgress.status.minutes', {
            minutes: minutesSince(progress.since, now),
          })
        : null,
      progress.runner,
    ]
      .filter(Boolean)
      .join(' · ');
  return progressSentence(t, progress, now);
}

function sentence(
  t: Translate,
  progress: IssueProgress,
  now: number = Date.now(),
): string {
  const agent = progress.agent?.name ?? t('issueProgress.anAgent');
  if (
    progress.waiting &&
    (!progress.managerWait ||
      progress.waiting.reason === 'noOwner' ||
      progress.waiting.reason === 'notConfigured')
  )
    return t(`issueProgress.waiting.${progress.waiting.reason}`, {
      agent,
      owner: progress.waiting.owner?.name ?? '',
    });
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
                wait.fallbackAfterSeconds === 0
                  ? 'issueProgress.workerChoice'
                  : index === 0
                    ? 'issueProgress.firstChoice'
                    : 'issueProgress.fallback',
              ),
              model: `${entry.tool}${entry.model ? ` · ${entry.model}` : ''}`,
              reason: [...new Set([entry.reason, ...(entry.blockers ?? [])])]
                .map((reason) => t(`issueProgress.modelWait.${reason}`))
                .join(', '),
              runners: entry.runners.length
                ? ` (${runnerNames(t, entry)})`
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
          t(
            wait.fallbackAfterSeconds === 0
              ? 'issueProgress.workerWaiting'
              : 'issueProgress.managerWaiting',
            { entries, agent },
          ) +
          (wait.fallbackAfterSeconds > 0 && wait.entries.length > 1
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
      return progress.needsYou
        ? t('issueProgress.needsDecision', { question: progress.needsYou })
        : t('issueProgress.needsDecisionNoQuestion');
    default:
      return t(`issueProgress.${progress.state}`);
  }
}
