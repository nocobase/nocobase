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
  deliveryComment,
  isDeliveryReport,
  groupFeedRows,
  isSystemEntry,
  newestFirst,
} from '../../client/issues/live/feed-rows.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

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

  it('reads a delivery report by its headings, not by prose', () => {
    expect(
      isDeliveryReport('## What was asked\nExport CSV\n## Key changes\n- x'),
    ).toBe(true);
    expect(isDeliveryReport('**Key changes**\n- x')).toBe(true);
    expect(isDeliveryReport('Open issues:\n- none')).toBe(true);
    expect(isDeliveryReport('### 关键改动\n- x')).toBe(true);
    expect(isDeliveryReport('**遗留问题**：无')).toBe(true);
    expect(
      isDeliveryReport('The key changes are in the list view; no open issues.'),
    ).toBe(false);
  });

  it('prefers the manager’s delivery report around the move to In review, then the latest agent comment', () => {
    const agent = { type: 'agent', id: 'sol' };
    const reviewer = { type: 'agent', id: 'astra' };
    const manager = { type: 'agent', id: PROJECT_MANAGER_ID };
    const report = (id: string, minute: number) =>
      comment(
        id,
        minute,
        manager,
        '## What was asked\nExport\n## Key changes\n- csv',
      );
    const moved = [
      {
        action: 'status_changed',
        details: { to: 'in_review' },
        createdAt: at(30),
      },
    ];
    const threads = [
      {
        root: comment('a1', 10, agent, 'Done: the export keeps the filters.'),
        replies: [],
      },
      { root: report('m-old', 1), replies: [] },
      {
        root: report('m1', 31),
        replies: [comment('r1', 32, reviewer, 'Review: approved, can merge')],
      },
      { root: comment('m2', 33, manager, 'Please accept.'), replies: [] },
    ] as CommentThread[];
    // A report posted just after the move counts; the reviewer's comment and the manager's prose do not.
    expect(deliveryComment(threads, moved, PROJECT_MANAGER_ID)).toMatchObject({
      comment: { id: 'm1' },
      report: true,
    });
    // Without a report: the latest agent comment by the move, labelled as such.
    const plain = threads.filter((thread) => !thread.root.id.startsWith('m'));
    expect(deliveryComment(plain, moved, PROJECT_MANAGER_ID)).toMatchObject({
      comment: { id: 'a1' },
      report: false,
    });
    expect(deliveryComment(plain, [], PROJECT_MANAGER_ID)?.comment.id).toBe(
      'a1',
    );
    expect(deliveryComment([], [], PROJECT_MANAGER_ID)).toBeNull();
  });
});
