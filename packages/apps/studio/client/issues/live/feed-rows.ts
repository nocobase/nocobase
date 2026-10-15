/**
 * How the issue pages' feed (`issue-feed.tsx`) lays out the issue's timeline: newest first, a thread where its latest
 * comment is; conversation (comments, status moves, pull requests, owner handoffs) apart from system records (runs and every other
 * change), which "Conversation only" folds into one row per stretch.
 */
import type { TimelineEntry } from '@nocobase/app-plugin-projects/client/issues';
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
