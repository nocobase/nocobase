/**
 * My follow-ups kept current by announcements (`issues/live/realtime-refresh.ts`): the rows of the named issues are
 * read and merged in (`mergeFollowUpRows`, `follow-ups/model.ts`), a burst at once; the whole overview is read again
 * only when the list itself changed, for an announcement naming nothing, and on reconnect.
 */
import type { RealtimeListener } from '@nocobase/app-client';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mergeFollowUpRows } from '../../client/follow-ups/model.js';
import {
  followUpsRefresh,
  subscribeIssueRefresh,
} from '../../client/issues/live/realtime-refresh.js';
import type { FollowUpIssue, FollowUpsView } from '../../shared/follow-ups.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';
import { STUDIO_ISSUE_RUNS_TOPIC } from '../../shared/issue-runs.js';

const KEY = ['pm', 'issues', 'followUps'];

const row = (
  id: string,
  patch: Partial<FollowUpIssue> = {},
): FollowUpIssue => ({
  id,
  identifier: id.toUpperCase(),
  title: `Issue ${id}`,
  statusKey: 'in_progress',
  projectId: null,
  executorName: null,
  lastActivityAt: '2026-10-15T08:00:00.000Z',
  owned: true,
  followed: false,
  progress: null,
  unread: 0,
  seenAt: null,
  ...patch,
});

const viewOf = (
  issues: readonly FollowUpIssue[],
  patch: Partial<FollowUpsView> = {},
): FollowUpsView => ({
  following: issues.filter((issue) => issue.followed).map((issue) => issue.id),
  followingStored: true,
  issues,
  counts: { in_review: 0, blocked: 0, in_progress: issues.length, backlog: 0 },
  truncated: false,
  ...patch,
});

describe('merging the rows of named issues', () => {
  const view = viewOf([row('a'), row('b', { followed: true }), row('c')]);

  it('replaces the named rows in place and keeps the rest', () => {
    const merged = mergeFollowUpRows(view, new Set(['a', 'b', 'x']), [
      row('a', { title: 'Renamed', unread: 0 }),
      row('b', { followed: true, unread: 3 }),
    ]);
    expect(
      merged?.issues.map((issue) => [issue.id, issue.title, issue.unread]),
    ).toEqual([
      ['a', 'Renamed', 0],
      ['b', 'Issue b', 3],
      ['c', 'Issue c', 0],
    ]);
    expect(merged?.counts).toBe(view.counts);
  });

  it('asks for the whole overview when the list itself changed', () => {
    // An issue joined the list.
    expect(mergeFollowUpRows(view, new Set(['x']), [row('x')])).toBeNull();
    // One left it.
    expect(mergeFollowUpRows(view, new Set(['a']), [])).toBeNull();
    // One moved to another status, or was taken off what the viewer follows.
    expect(
      mergeFollowUpRows(view, new Set(['a']), [
        row('a', { statusKey: 'blocked' }),
      ]),
    ).toBeNull();
    expect(mergeFollowUpRows(view, new Set(['b']), [row('b')])).toBeNull();
  });

  it('does not let an owned issue past what a truncated overview read join', () => {
    const truncated = { ...view, truncated: true };
    expect(mergeFollowUpRows(truncated, new Set(['x']), [row('x')])).toEqual(
      truncated,
    );
    expect(
      mergeFollowUpRows(truncated, new Set(['x']), [
        row('x', { followed: true }),
      ]),
    ).toBeNull();
  });
});

describe('refreshing My follow-ups', () => {
  const clients: QueryClient[] = [];
  const stops: (() => void)[] = [];
  afterEach(() => {
    for (const stop of stops.splice(0)) stop();
    for (const client of clients.splice(0)) client.clear();
  });

  /** A page showing the overview, which counts how often it is read whole. */
  function shown(view: FollowUpsView) {
    const client = new QueryClient();
    clients.push(client);
    let current = view;
    const overview = vi.fn(async () => current);
    const observer = new QueryObserver(client, {
      queryKey: KEY,
      queryFn: overview,
      staleTime: Infinity,
      retry: false,
    });
    stops.push(observer.subscribe(() => {}));
    return {
      client,
      overview,
      data: () => client.getQueryData<FollowUpsView>(KEY),
      serve: (next: FollowUpsView) => {
        current = next;
      },
    };
  }

  it('reads the rows a burst named once, and merges them without reading the overview', async () => {
    const page = shown(viewOf([row('a'), row('b'), row('c')]));
    await waitFor(() => expect(page.data()).toBeDefined());
    const readRows = vi.fn(async (ids: readonly string[]) =>
      ids
        .filter((id) => id !== 'x')
        .map((id) => row(id, { title: `New ${id}` })),
    );
    const refresh = followUpsRefresh(page.client, readRows, 5);
    stops.push(refresh.stop);
    refresh.issues(new Set(['a']));
    refresh.issues(new Set(['b', 'x']));
    refresh.issues(new Set(['a']));
    await waitFor(() =>
      expect(page.data()?.issues.map((issue) => issue.title)).toEqual([
        'New a',
        'New b',
        'Issue c',
      ]),
    );
    expect(readRows).toHaveBeenCalledOnce();
    expect([...readRows.mock.calls[0]![0]].sort()).toEqual(['a', 'b', 'x']);
    expect(page.overview).toHaveBeenCalledOnce();
  });

  it('reads the whole overview once a named issue joins the list, or for a burst naming nothing', async () => {
    const page = shown(viewOf([row('a')]));
    await waitFor(() => expect(page.data()).toBeDefined());
    const refresh = followUpsRefresh(
      page.client,
      async () => [row('a'), row('new')],
      5,
    );
    stops.push(refresh.stop);
    page.serve(viewOf([row('a'), row('new')]));
    refresh.issues(new Set(['new']));
    await waitFor(() => expect(page.overview).toHaveBeenCalledTimes(2));
    expect(page.data()?.issues.map((issue) => issue.id)).toEqual(['a', 'new']);

    refresh.all();
    refresh.all();
    refresh.issues(new Set(['a']));
    await waitFor(() => expect(page.overview).toHaveBeenCalledTimes(3));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(page.overview).toHaveBeenCalledTimes(3);
  });

  it('reads the follow star’s state again for a named issue where only the star shows', async () => {
    const client = new QueryClient();
    clients.push(client);
    const read = vi.fn(async () => ({ issueIds: ['a'], max: 5 }));
    const observer = new QueryObserver(client, {
      queryKey: [...KEY, 'following'],
      queryFn: read,
      staleTime: Infinity,
      retry: false,
    });
    stops.push(observer.subscribe(() => {}));
    await waitFor(() => expect(read).toHaveBeenCalledOnce());
    const readRows = vi.fn(async () => []);
    const refresh = followUpsRefresh(client, readRows, 5);
    stops.push(refresh.stop);
    refresh.issues(new Set(['a']));
    refresh.issues(new Set(['b']));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(readRows).not.toHaveBeenCalled();
  });

  it('reads nothing while no page shows the overview', async () => {
    const page = shown(viewOf([row('a')]));
    await waitFor(() => expect(page.data()).toBeDefined());
    for (const stop of stops.splice(0)) stop();
    const readRows = vi.fn(async () => [row('a')]);
    const refresh = followUpsRefresh(page.client, readRows, 5);
    stops.push(refresh.stop);
    refresh.issues(new Set(['a']));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(readRows).not.toHaveBeenCalled();
    expect(page.overview).toHaveBeenCalledOnce();
    expect(
      page.client.getQueryCache().find({ queryKey: KEY })?.state.isInvalidated,
    ).toBe(true);
  });

  it('merges the rows announcements name, and reads the overview again on reconnect and inbox changes', async () => {
    const page = shown(viewOf([row('a'), row('b')]));
    await waitFor(() => expect(page.data()).toBeDefined());
    const listeners = new Map<string, RealtimeListener<unknown>>();
    let opened = () => {};
    const readRows = vi.fn(async (ids: readonly string[]) =>
      ids.map((id) => row(id, { unread: 2 })),
    );
    stops.push(
      subscribeIssueRefresh(
        {
          onOpen: (callback) => {
            opened = callback;
            return () => {};
          },
          subscribe: (topic, listener) => {
            listeners.set(topic, listener as RealtimeListener<unknown>);
            return () => listeners.delete(topic);
          },
        },
        page.client,
        readRows,
      ),
    );
    const emit = (topic: string, payload: unknown) =>
      listeners.get(topic)?.({
        type: 'event',
        topic,
        payload,
        publishedAt: '2026-10-15T08:00:00Z',
      });
    emit(PM_REALTIME_TOPIC, {
      kind: 'pm.changed',
      domain: 'issues',
      issueIds: ['a'],
    });
    emit(STUDIO_ISSUE_RUNS_TOPIC, {
      kind: 'studio.issue.runs',
      issueIds: ['b'],
    });
    await waitFor(
      () =>
        expect(page.data()?.issues.map((issue) => issue.unread)).toEqual([
          2, 2,
        ]),
      { timeout: 3000 },
    );
    expect(readRows).toHaveBeenCalledOnce();
    expect(page.overview).toHaveBeenCalledOnce();

    emit(STUDIO_INBOX_TOPIC, { kind: 'studio.inbox.changed' });
    opened();
    await waitFor(() => expect(page.overview).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    });
  });
});
