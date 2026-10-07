import type { CommentThread } from '../../../../shared/comments.js';
import type { Activity } from '../../../../shared/issues.js';

/** A run of work on the issue, as much as the activity line needs to place it; the application reports them. */
export interface TimelineRun {
  readonly id: string;
  /** When it was started: where it sits on the activity line. */
  readonly createdAt: string;
}

/**
 * Ported from the old NocoProject's `client/pages/np/issues/detail/timeline.ts`: comment threads, activities and the
 * runs the application reports on one line.
 */
export type TimelineEntry =
  | {
      readonly kind: 'thread';
      readonly key: string;
      readonly at: string;
      readonly thread: CommentThread;
    }
  | {
      readonly kind: 'activity';
      readonly key: string;
      readonly at: string;
      readonly activity: Activity;
    }
  | {
      readonly kind: 'run';
      readonly key: string;
      readonly at: string;
      readonly run: TimelineRun;
    };

/** Activities a thread already shows: the comment itself and its edits. */
const SHOWN_BY_THREADS: ReadonlySet<string> = new Set([
  'comment_added',
  'comment_edited',
]);

/**
 * Threads, activities and runs oldest first; a thread sits where its first comment was written, a run where it was
 * started (it shows its current state, so a finished run does not appear twice). Threads and activities are paged on
 * their own, so while either has older pages, the line starts at the later of their oldest loaded entries (the
 * watermark) and shows no hole where one list is loaded further back than the other.
 */
export function buildTimeline(
  threads: readonly CommentThread[],
  activities: readonly Activity[],
  more: { readonly threads: boolean; readonly activities: boolean } = {
    threads: false,
    activities: false,
  },
  runs: readonly TimelineRun[] = [],
): TimelineEntry[] {
  const marks = [
    more.threads ? threads[0]?.root.createdAt : undefined,
    more.activities ? activities[0]?.createdAt : undefined,
  ].filter((mark): mark is string => mark !== undefined);
  const watermark = marks.sort().at(-1) ?? null;
  const entries: TimelineEntry[] = [
    ...threads.map((thread): TimelineEntry => ({
      kind: 'thread',
      key: `thread:${thread.root.id}`,
      at: thread.root.createdAt,
      thread,
    })),
    ...activities
      .filter((activity) => !SHOWN_BY_THREADS.has(activity.action))
      .map((activity): TimelineEntry => ({
        kind: 'activity',
        key: `activity:${activity.id}`,
        at: activity.createdAt,
        activity,
      })),
    ...runs.map((run): TimelineEntry => ({
      kind: 'run',
      key: `run:${run.id}`,
      at: run.createdAt,
      run,
    })),
  ];
  return entries
    .filter((entry) => watermark === null || entry.at >= watermark)
    .sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
}

/** Each thread once, by its root, oldest first: older pages and the detail's newest page may overlap. */
export function mergeThreads(
  older: readonly CommentThread[],
  newest: readonly CommentThread[],
): CommentThread[] {
  const byId = new Map<string, CommentThread>();
  for (const thread of [...older, ...newest]) byId.set(thread.root.id, thread);
  return [...byId.values()].sort((a, b) =>
    a.root.createdAt.localeCompare(b.root.createdAt),
  );
}

/** Each activity once, oldest first. */
export function mergeActivities(
  older: readonly Activity[],
  newest: readonly Activity[],
): Activity[] {
  const byId = new Map<string, Activity>();
  for (const activity of [...older, ...newest]) byId.set(activity.id, activity);
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

/** A comment as one line of plain text, for the collapsed header of a resolved thread. */
export function commentSnippet(content: string, max = 120): string {
  const text = content
    .replace(/\[@([^\]]*)\]\(mention:\/\/[^)]+\)/gu, '@$1')
    .replace(/^\s*\/note\b/u, '')
    .replace(/[`*_>#~]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
