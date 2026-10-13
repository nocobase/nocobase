/**
 * How the issue pages' feed (`issue-feed.tsx`) lays out the issue's timeline: newest first, a thread where its latest
 * comment is; conversation (comments, status moves, pull requests, owner handoffs) apart from system records (runs and every other
 * change), which "Conversation only" folds into one row per stretch. Also which comment speaks for a delivery.
 */
import type {
  CommentThread,
  TimelineEntry,
} from '@nocobase/app-plugin-projects/client/issues';
import type {
  Activity,
  IssueDetail,
} from '@nocobase/app-plugin-projects/shared/issues';
import { IN_REVIEW_STATUS } from '@nocobase/app-plugin-projects/shared/statuses';

import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';

import { isOwnerHandoffActivity } from '../detail/activity-labels.js';
import { activityFeedKind } from './feed.js';

export type FeedMode = 'conversation' | 'all';

export type FeedRow =
  | {
      readonly kind: 'entry';
      readonly key: string;
      readonly entry: TimelineEntry;
    }
  | {
      readonly kind: 'system';
      readonly key: string;
      readonly entries: readonly TimelineEntry[];
    };

/** When a thread last moved: its newest comment. */
function latestAt(entry: TimelineEntry): string {
  if (entry.kind !== 'thread') return entry.at;
  return entry.thread.replies.reduce(
    (latest, reply) => (reply.createdAt > latest ? reply.createdAt : latest),
    entry.thread.root.createdAt,
  );
}

/** The entries newest first; a thread sits where its latest reply is. */
export function newestFirst(
  entries: readonly TimelineEntry[],
): TimelineEntry[] {
  return entries
    .map((entry, index) => ({ entry, index, at: Date.parse(latestAt(entry)) }))
    .sort((a, b) => b.at - a.at || b.index - a.index)
    .map(({ entry }) => entry);
}

/** A run, or a change that is neither a status move, a pull request event nor an owner handoff. */
export function isSystemEntry(entry: TimelineEntry): boolean {
  if (entry.kind === 'thread') return false;
  if (entry.kind === 'run') return true;
  // A handoff waits for the owner, so it stays in the conversation.
  if (isOwnerHandoffActivity(entry.activity.action, entry.activity.details))
    return false;
  const kind = activityFeedKind(entry.activity);
  return kind !== 'status' && kind !== 'pullRequest';
}

/** Every entry on its own, or in conversation mode each stretch of system records as one row. */
export function groupFeedRows(
  entries: readonly TimelineEntry[],
  mode: FeedMode,
): FeedRow[] {
  if (mode === 'all')
    return entries.map((entry) => ({ kind: 'entry', key: entry.key, entry }));
  const rows: FeedRow[] = [];
  let stretch: TimelineEntry[] = [];
  const close = (): void => {
    const last = stretch.at(-1);
    // Keyed by its oldest record, so a new one arriving on top keeps it open.
    if (last)
      rows.push({
        kind: 'system',
        key: `system:${last.key}`,
        entries: stretch,
      });
    stretch = [];
  };
  for (const entry of entries) {
    if (isSystemEntry(entry)) {
      stretch.push(entry);
      continue;
    }
    close();
    rows.push({ kind: 'entry', key: entry.key, entry });
  }
  close();
  return rows;
}

/** A delivery report's headings, in English or Chinese, as a heading line rather than prose. */
const REPORT_TERMS =
  '(?:what was asked|key changes|open issues|需求|要求|关键改动|主要改动|遗留问题|未完成事项)';
const REPORT_HEADING = new RegExp(
  [
    // `## Key changes`
    `^\\s*#{1,6}\\s*${REPORT_TERMS}`,
    // `**Key changes**`, then anything
    `^\\s*(?:\\*\\*|__)\\s*${REPORT_TERMS}\\s*[:：]?\\s*(?:\\*\\*|__)`,
    // `Key changes:` alone on its line
    `^\\s*${REPORT_TERMS}\\s*[:：]?\\s*$`,
  ].join('|'),
  'imu',
);

/** The comment holds a delivery report: one of its lines is a report heading. */
export function isDeliveryReport(content: string): boolean {
  return REPORT_HEADING.test(content);
}

/** How long before the move to In review a report still counts as the one for it. */
const REPORT_WINDOW_MS = 2 * 60 * 60 * 1000;

export interface Delivery {
  readonly comment: CommentThread['root'];
  /** The project manager's delivery report; otherwise only the latest agent comment. */
  readonly report: boolean;
}

/**
 * What the summary shows as the delivery: the project manager's delivery report (a comment with the report's
 * headings) posted around the latest move to In review, newest first; failing that, the latest agent comment (other
 * than the project manager's) written by that move, else the latest agent comment at all.
 */
export function deliveryComment(
  threads: readonly CommentThread[],
  activities: readonly Pick<Activity, 'action' | 'details' | 'createdAt'>[],
  managerId: string,
): Delivery | null {
  const comments = threads
    .flatMap((thread) => [thread.root, ...thread.replies])
    .filter(
      (comment) =>
        !comment.deleted &&
        comment.authorType === 'agent' &&
        comment.content.trim() !== '',
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const movedAt = activities
    .filter(
      (activity) =>
        activity.action === 'status_changed' &&
        activity.details.to === 'in_review',
    )
    .map((activity) => Date.parse(activity.createdAt))
    .sort((a, b) => b - a)[0];
  const reports = comments.filter(
    (comment) =>
      comment.authorId === managerId && isDeliveryReport(comment.content),
  );
  const report =
    movedAt === undefined
      ? reports[0]
      : (reports.find(
          (comment) =>
            Date.parse(comment.createdAt) >= movedAt - REPORT_WINDOW_MS,
        ) ?? reports[0]);
  if (report) return { comment: report, report: true };
  const byWorker = comments.filter((comment) => comment.authorId !== managerId);
  const before = (list: typeof comments) =>
    movedAt === undefined
      ? list[0]
      : list.find((comment) => Date.parse(comment.createdAt) <= movedAt);
  const latest = before(byWorker) ?? byWorker[0] ?? comments[0];
  return latest ? { comment: latest, report: false } : null;
}

/** In review, what the summary shows as the delivery; null otherwise. */
export function deliveryCommentOf(
  issue: Pick<IssueDetail, 'statusKey' | 'threads' | 'activities'>,
): Delivery | null {
  if (issue.statusKey !== IN_REVIEW_STATUS) return null;
  return deliveryComment(issue.threads, issue.activities, PROJECT_MANAGER_ID);
}
