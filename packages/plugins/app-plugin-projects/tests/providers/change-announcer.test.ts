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

  it('names no issue once a change may move issues between lists, or names none', () => {
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
      { type: 'member.changed' },
    ]) {
      const { it: changes, published } = announcer();
      changes.add({ type: 'issue.changed', issueId: 'a' });
      changes.add(event);
      changes.add({ type: 'issue.changed', issueId: 'b' });
      changes.flush();
      expect(published).toEqual([{ kind: 'pm.changed', domain: 'issues' }]);
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

  it('announces each kind of data once, and too many issues without naming them', () => {
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
      { kind: 'pm.changed', domain: 'issues' },
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
