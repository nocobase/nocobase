import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CommentThread, IssueComment } from '../../shared/comments.js';
import type { Activity } from '../../shared/issues.js';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { buildTimeline, mergeThreads, commentSnippet } =
  await import('../../client/pages/issues/detail/timeline.js');
const { toggleReaction, visibleReactions } =
  await import('../../client/pages/issues/detail/reaction-model.js');

afterEach(cleanup);

function comment(overrides: Partial<IssueComment> = {}): IssueComment {
  return {
    id: 'c1',
    issueId: 'i1',
    authorType: 'user',
    authorId: 'u2',
    authorName: 'Bob',
    kind: 'comment',
    content: 'Looks good',
    note: false,
    parentId: null,
    rootId: 'c1',
    via: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    editedAt: null,
    deleted: false,
    reactions: [],
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    attachments: [],
    ...overrides,
  };
}

describe('the timeline model', () => {
  it('puts threads among the activity and leaves out what a thread shows', () => {
    const thread: CommentThread = { root: comment(), replies: [] };
    const activity = (id: string, action: string, at: string): Activity =>
      ({ id, action, createdAt: at, details: {} }) as unknown as Activity;
    const entries = buildTimeline(
      [thread],
      [
        activity('a1', 'issue_created', '2026-10-01T09:00:00.000Z'),
        activity('a2', 'comment_added', '2026-10-01T10:00:00.000Z'),
        activity('a3', 'thread_resolved', '2026-10-01T11:00:00.000Z'),
      ],
    );
    expect(entries.map((entry) => entry.key)).toEqual([
      'activity:a1',
      'thread:c1',
      'activity:a3',
    ]);
  });

  it('starts at the watermark while older pages remain', () => {
    const thread = (id: string, at: string): CommentThread => ({
      root: comment({ id, rootId: id, createdAt: at }),
      replies: [],
    });
    const activity = (id: string, at: string): Activity =>
      ({
        id,
        action: 'title_changed',
        createdAt: at,
        details: {},
      }) as unknown as Activity;
    const threads = [
      thread('c1', '2026-01-01T00:00:00.000Z'),
      thread('c2', '2026-09-01T00:00:00.000Z'),
    ];
    const activities = [
      activity('a1', '2026-08-01T00:00:00.000Z'),
      activity('a2', '2026-09-02T00:00:00.000Z'),
    ];
    expect(
      buildTimeline(threads, activities, {
        threads: false,
        activities: true,
      }).map((entry) => entry.key),
    ).toEqual(['activity:a1', 'thread:c2', 'activity:a2']);
    expect(buildTimeline(threads, activities)).toHaveLength(4);
  });

  it('keeps one copy of a thread that two pages hold', () => {
    const older = { root: comment({ id: 'c0' }), replies: [] };
    const stale = { root: comment(), replies: [] };
    const fresh = { root: comment({ content: 'New' }), replies: [] };
    const merged = mergeThreads([older, stale], [fresh]);
    expect(merged.map((thread) => thread.root.content)).toEqual([
      'Looks good',
      'New',
    ]);
  });

  it('reads a comment as one line without mention markup or the note command', () => {
    expect(commentSnippet('/note ask [@Ann](mention://user/u3) **now**')).toBe(
      'ask @Ann now',
    );
  });

  it('toggles a reaction on and off', () => {
    const on = toggleReaction([], '👍', 'u1');
    expect(on).toEqual([{ emoji: '👍', count: 1, userIds: ['u1'] }]);
    expect(toggleReaction(on, '👍', 'u1')).toEqual([]);
    expect(
      visibleReactions(
        [
          { emoji: '🎉', count: 1, userIds: ['u2'] },
          { emoji: '👍', count: 2, userIds: ['u1', 'u2'] },
        ],
        ['👍', '🎉'],
      ).map((reaction) => reaction.emoji),
    ).toEqual(['👍', '🎉']);
  });
});
