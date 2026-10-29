/** The realtime announcements open pages refresh from (`server/providers/change-announcer.ts`). */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ANNOUNCE_DELAY_MS,
  ANNOUNCED_ISSUES_MAX,
  createChangeAnnouncer,
} from '../../server/providers/change-announcer.js';
import type { PmChangeEvent } from '../../shared/realtime.js';

afterEach(() => {
  vi.useRealTimers();
});

function announcer() {
  vi.useFakeTimers();
  const published: PmChangeEvent[] = [];
  const it = createChangeAnnouncer((event) => published.push(event));
  return { it, published };
}

describe('change announcements', () => {
  it('narrows only a confirmed discussion batch, and resets its classification after flushing', () => {
    const { it: changes, published } = announcer();
    changes.add({ type: 'issue.changed', issueId: 'a', discussionOnly: true });
    changes.add({
      type: 'comment.created',
      issueId: 'a',
      discussionOnly: true,
      mentions: [],
    });
    changes.flush();
    expect(published).toEqual([
      {
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: ['a'],
        discussionOnly: true,
      },
    ]);
    changes.add({ type: 'issue.changed', issueId: 'a' });
    changes.flush();
    expect(published[1]).not.toHaveProperty('discussionOnly');
  });

  it.each([
    { type: 'comment.created', issueId: 'a', mentions: [] },
    {
      type: 'comment.created',
      issueId: 'a',
      discussionOnly: true,
      mentions: [{ kind: 'user', id: 'u' }],
    },
    { type: 'issue.changed', issueId: 'a' },
    {
      type: 'issue.updated',
      issueId: 'a',
      changes: { status: { from: 'blocked', to: 'in_progress' } },
    },
    { type: 'work.announced', issueId: 'a' },
    { type: 'unknown.change', issueId: 'a', discussionOnly: true },
    { type: 'notice.planned', notice: { kind: 'decision', type: 'answer' } },
    { type: 'notice.planned', notice: { kind: 'info', type: 'mentioned' } },
    { type: 'label.changed' },
  ])('keeps mixed or uncertain batches complete: $type', (event) => {
    const { it: changes, published } = announcer();
    changes.add({ type: 'issue.changed', issueId: 'a', discussionOnly: true });
    changes.add({
      type: 'comment.created',
      issueId: 'a',
      discussionOnly: true,
      mentions: [],
    });
    changes.add(event);
    changes.flush();
    expect(
      published.find((entry) => entry.domain === 'issues'),
    ).not.toHaveProperty('discussionOnly');
  });
  it('gathers the events of a moment into one announcement naming the issues', () => {
    const { it: changes, published } = announcer();
    changes.add({ type: 'comment.created', issueId: 'a' });
    changes.add({ type: 'issue.changed', issueId: 'a' });
    changes.add({ type: 'issue.changed', issueId: 'b' });
    expect(published).toEqual([]);
    vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(published).toEqual([
      { kind: 'pm.changed', domain: 'issues', issueIds: ['a', 'b'] },
    ]);
    vi.advanceTimersByTime(ANNOUNCE_DELAY_MS * 4);
    expect(published).toHaveLength(1);
  });

  it('keeps task scope when a change moves issues between lists, with unknown scope as fallback', () => {
    for (const event of [
      { type: 'issue.created', issueId: 'c' },
      { type: 'issue.deleted', issueId: 'c' },
      { type: 'issue.restored', issueId: 'c' },
      {
        type: 'issue.updated',
        issueId: 'c',
        changes: { owner: { from: 'u1', to: 'u2' } },
      },
      {
        type: 'issue.updated',
        issueId: 'c',
        changes: { status: { from: 'backlog', to: 'in_progress' } },
      },
      // Moved to another project, parent or executor.
      { type: 'issue.changed', issueId: 'c', moved: true },
      { type: 'member.changed' },
    ]) {
      const { it: changes, published } = announcer();
      changes.add({ type: 'issue.changed', issueId: 'a' });
      changes.add(event);
      changes.add({ type: 'issue.changed', issueId: 'b' });
      changes.flush();
      expect(published).toEqual([
        event.type === 'member.changed'
          ? { kind: 'pm.changed', domain: 'issues' }
          : {
              kind: 'pm.changed',
              domain: 'issues',
              issueIds: ['a', 'c', 'b'],
              listsChanged: true,
            },
      ]);
      changes.close();
    }
  });

  it('keeps an update that moves nothing between lists named', () => {
    const { it: changes, published } = announcer();
    changes.add({
      type: 'issue.updated',
      issueId: 'a',
      changes: { mentions: [] },
    });
    changes.flush();
    expect(published).toEqual([
      { kind: 'pm.changed', domain: 'issues', issueIds: ['a'] },
    ]);
  });

  it('announces each kind of data and splits large batches without losing task scope', () => {
    const { it: changes, published } = announcer();
    changes.add({ type: 'label.changed' });
    changes.add({ type: 'plan.changed' });
    changes.add({ type: 'intake.changed' });
    for (let i = 0; i <= ANNOUNCED_ISSUES_MAX; i += 1)
      changes.add({ type: 'issue.changed', issueId: `i${i}` });
    vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(published).toEqual([
      { kind: 'pm.changed', domain: 'labels' },
      { kind: 'pm.changed', domain: 'plans' },
      {
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: Array.from(
          { length: ANNOUNCED_ISSUES_MAX },
          (_, at) => `i${at}`,
        ),
      },
      {
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: [`i${ANNOUNCED_ISSUES_MAX}`],
      },
    ]);
  });

  it('announces nothing after it is closed', () => {
    const { it: changes, published } = announcer();
    changes.add({ type: 'issue.changed', issueId: 'a' });
    changes.close();
    vi.advanceTimersByTime(ANNOUNCE_DELAY_MS * 2);
    expect(published).toEqual([]);
  });
});
