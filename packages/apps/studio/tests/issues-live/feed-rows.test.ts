// @vitest-environment node
/**
 * The issue pages' feed layout (`client/issues/live/feed-rows.ts`): newest first with a thread where its latest reply
 * is, system records folded per stretch in conversation mode, and the comment that tells a delivery.
 */
import type {
  CommentThread,
  TimelineEntry,
} from '@nocobase/app-plugin-projects/client/issues';
import type { Activity } from '@nocobase/app-plugin-projects/shared/issues';
import { describe, expect, it } from 'vitest';

import {
  groupFeedRows,
  isSystemEntry,
  newestFirst,
} from '../../client/issues/live/feed-rows.js';

const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 12, 13, minute)).toISOString();

function comment(
  id: string,
  minute: number,
  author: { type: string; id: string } = { type: 'user', id: 'u1' },
  content = id,
): CommentThread['root'] {
  return {
    id,
    issueId: 'i1',
    authorType: author.type,
    authorId: author.id,
    authorName: author.id,
    kind: 'comment',
    content,
    note: false,
    parentId: null,
    rootId: id,
    via: null,
    createdAt: at(minute),
    editedAt: null,
    deleted: false,
    reactions: [],
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    attachments: [],
  } as CommentThread['root'];
}

function thread(
  root: CommentThread['root'],
  replies: CommentThread['root'][] = [],
): TimelineEntry {
  return {
    kind: 'thread',
    key: `thread:${root.id}`,
    at: root.createdAt,
    thread: { root, replies } as CommentThread,
  };
}

function activity(
  id: string,
  action: string,
  minute: number,
  details: Record<string, unknown> = {},
): TimelineEntry {
  return {
    kind: 'activity',
    key: `activity:${id}`,
    at: at(minute),
    activity: {
      id,
      action,
      details,
      createdAt: at(minute),
      actorType: 'system',
      actorId: null,
      actorName: null,
      via: null,
    } as unknown as Activity,
  };
}

function run(id: string, minute: number): TimelineEntry {
  return {
    kind: 'run',
    key: `run:${id}`,
    at: at(minute),
    run: { id, createdAt: at(minute) },
  };
}

const keys = (entries: readonly TimelineEntry[]) =>
  entries.map((entry) => entry.key);

describe('the feed layout', () => {
  it('puts the newest first, a thread where its latest reply is', () => {
    const old = thread(comment('c1', 1), [comment('c2', 9)]);
    const entries = [
      old,
      activity('a1', 'status_changed', 2, { to: 'in_progress' }),
      run('r1', 5),
    ];
    expect(keys(newestFirst(entries))).toEqual([
      'thread:c1',
      'run:r1',
      'activity:a1',
    ]);
  });

  it('tells conversation from system records', () => {
    expect(isSystemEntry(thread(comment('c1', 1)))).toBe(false);
    expect(isSystemEntry(activity('s', 'status_changed', 1))).toBe(false);
    expect(isSystemEntry(activity('p', 'pr_linked', 1))).toBe(false);
    expect(isSystemEntry(run('r', 1))).toBe(true);
    expect(isSystemEntry(activity('w', 'work_skipped', 1))).toBe(true);
    expect(isSystemEntry(activity('l', 'label_added', 1))).toBe(true);
    // An owner handoff waits for a person, so it stays in the conversation.
    expect(isSystemEntry(activity('h', 'studio_owner_transferred', 1))).toBe(
      false,
    );
    expect(
      isSystemEntry(
        activity('k', 'work_skipped', 1, { reason: 'waitingOwner' }),
      ),
    ).toBe(false);
  });

  it('folds each stretch of system records in conversation mode and shows every one in all', () => {
    const entries = newestFirst([
      thread(comment('c1', 1)),
      run('r1', 2),
      activity('a1', 'work_skipped', 3),
      activity('s1', 'status_changed', 4, { to: 'in_review' }),
      run('r2', 5),
      thread(comment('c2', 6)),
    ]);
    const conversation = groupFeedRows(entries, 'conversation');
    expect(
      conversation.map((row) =>
        row.kind === 'system' ? keys(row.entries) : row.key,
      ),
    ).toEqual([
      'thread:c2',
      ['run:r2'],
      'activity:s1',
      ['activity:a1', 'run:r1'],
      'thread:c1',
    ]);
    // A stretch keeps its key when a newer record lands on top of it.
    const grown = groupFeedRows(
      newestFirst([...entries, run('r3', 3)]),
      'conversation',
    );
    expect(
      grown.find((row) => row.kind === 'system' && row.entries.length === 3)
        ?.key,
    ).toBe(conversation[3]?.key);
    expect(groupFeedRows(entries, 'all').map((row) => row.key)).toEqual(
      keys(entries),
    );
  });
});
