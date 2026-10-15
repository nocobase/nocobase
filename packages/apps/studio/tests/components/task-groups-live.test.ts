/**
 * The task lists kept current by announcements (`client/issues/groups/live.ts`): a burst is one refresh; an
 * announcement naming issues reads only their rows and merges them in, unless the lists' membership moved; one naming
 * nothing reads each shown list and the summary once; a read under way is never cancelled; nothing is read while the
 * page is hidden.
 */
import type { RealtimeListener } from '@nocobase/app-client';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  subscribeTaskGroupsLive,
  taskGroupKeys,
  type TaskGroupRowsReader,
} from '../../client/issues/groups/live.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';
import type {
  TaskGroupItem,
  TaskGroups,
  TaskGroupSummary,
} from '../../shared/task-groups.js';

const SCOPE = JSON.stringify({ ownerUserId: 'alice', mode: 'split' });
const LIST = [...taskGroupKeys.lists, SCOPE, {}];

const item = (id: string, title = `Task ${id}`): TaskGroupItem =>
  ({
    issue: { id, identifier: id.toUpperCase(), title, statusKey: 'backlog' },
    parent: null,
    waits: [],
    waitingSince: null,
    followed: false,
    unread: 0,
    progress: { finished: 0, total: 0 },
    hasChildren: false,
    context: false,
    expand: [],
  }) as unknown as TaskGroupItem;

const groupsOf = (
  items: readonly TaskGroupItem[],
  membership = 'm1',
): TaskGroups => ({
  generation: `g-${items.map((each) => each.issue.title).join()}`,
  membership,
  mode: 'split',
  groups: [
    { group: 'backlog', count: items.length, data: items, nextCursor: null },
  ],
  following: [],
  waiting: 0,
});

const SUMMARY: TaskGroupSummary = {
  owned: { open: 1, waiting: 0 },
  executing: { open: 0, waiting: 0 },
  waiting: 0,
};

const clients: QueryClient[] = [];
const stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  for (const client of clients.splice(0)) client.clear();
});

/** An open tab: the list and the summary shown, the announcements the test emits, and what each read was asked. */
function tab(options: { readonly rows?: TaskGroupRowsReader } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  let served = groupsOf([item('a'), item('b')]);
  let slow: Promise<void> | null = null;
  const signals: AbortSignal[] = [];
  const list = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
    signals.push(signal);
    if (slow) await slow;
    return served;
  });
  const summary = vi.fn(async () => SUMMARY);
  for (const observer of [
    new QueryObserver(client, { queryKey: LIST, queryFn: list }),
    new QueryObserver(client, {
      queryKey: taskGroupKeys.summary,
      queryFn: summary,
    }),
  ])
    stops.push(observer.subscribe(() => {}));
  const listeners = new Map<string, RealtimeListener<unknown>>();
  let opened = () => {};
  let visible = true;
  let shown = () => {};
  const rows = vi.fn(
    options.rows ??
      (async (_query, ids) => ({
        membership: served.membership,
        data: ids.map((id) => item(id, `New ${id}`)),
      })),
  );
  stops.push(
    subscribeTaskGroupsLive(
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
      client,
      rows,
      {
        delay: 20,
        visible: () => visible,
        onVisible: (run) => {
          shown = run;
          return () => {};
        },
      },
    ),
  );
  const emit = (topic: string, payload: unknown) =>
    listeners.get(topic)?.({
      type: 'event',
      topic,
      payload,
      publishedAt: '2026-10-15T08:00:00Z',
    });
  return {
    client,
    list,
    summary,
    rows,
    signals,
    data: () => client.getQueryData<TaskGroups>(LIST),
    serve: (next: TaskGroups) => {
      served = next;
    },
    hold: () => {
      let release = () => {};
      slow = new Promise<void>((resolve) => {
        release = () => {
          slow = null;
          resolve();
        };
      });
      return release;
    },
    issues: (...ids: string[]) =>
      emit(PM_REALTIME_TOPIC, {
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: ids,
      }),
    anything: () =>
      emit(PM_REALTIME_TOPIC, { kind: 'pm.changed', domain: 'issues' }),
    inbox: () => emit(STUDIO_INBOX_TOPIC, { kind: 'studio.inbox.changed' }),
    reconnect: () => opened(),
    hide: () => {
      visible = false;
    },
    show: () => {
      visible = true;
      shown();
    },
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

async function loaded(page: ReturnType<typeof tab>) {
  await waitFor(() => {
    expect(page.data()).toBeDefined();
    expect(page.summary).toHaveBeenCalledOnce();
  });
}

it('reads only the named rows of a burst, once, and merges them without reading the list', async () => {
  const page = tab();
  await loaded(page);
  page.issues('a');
  page.issues('b', 'elsewhere');
  page.issues('a');
  await waitFor(() =>
    expect(
      page.data()?.groups[0]!.data.map((each) => each.issue.title),
    ).toEqual(['New a', 'New b']),
  );
  await settle();
  expect(page.rows).toHaveBeenCalledOnce();
  expect(page.rows.mock.calls[0]![0]).toEqual(JSON.parse(SCOPE));
  expect([...page.rows.mock.calls[0]![1]].sort()).toEqual(['a', 'b']);
  expect(page.list).toHaveBeenCalledOnce();
  // The summary counts what moved between lists, which a named change does not.
  expect(page.summary).toHaveBeenCalledOnce();
});

it('reads nothing for issues the list does not show', async () => {
  const page = tab();
  await loaded(page);
  page.issues('elsewhere');
  await settle();
  expect(page.rows).not.toHaveBeenCalled();
  expect(page.list).toHaveBeenCalledOnce();
});

it('reads the list whole when the membership moved, or a shown row left it', async () => {
  const moved = tab({
    rows: async () => ({ membership: 'm2', data: [item('a')] }),
  });
  await loaded(moved);
  moved.issues('a');
  await waitFor(() => expect(moved.list).toHaveBeenCalledTimes(2));

  const gone = tab({ rows: async () => ({ membership: 'm1', data: [] }) });
  await loaded(gone);
  gone.issues('a');
  await waitFor(() => expect(gone.list).toHaveBeenCalledTimes(2));
  await settle();
  expect(gone.list).toHaveBeenCalledTimes(2);
});

it('reads each list and the summary once for a burst naming nothing, the inbox or a reconnect', async () => {
  const page = tab();
  await loaded(page);
  page.anything();
  page.inbox();
  page.issues('a');
  page.reconnect();
  await waitFor(() => {
    expect(page.list).toHaveBeenCalledTimes(2);
    expect(page.summary).toHaveBeenCalledTimes(2);
  });
  await settle();
  expect(page.list).toHaveBeenCalledTimes(2);
  expect(page.summary).toHaveBeenCalledTimes(2);
  expect(page.rows).not.toHaveBeenCalled();
});

it('never cancels a read under way, and reads once more after it', async () => {
  const page = tab();
  await loaded(page);
  const release = page.hold();
  void page.client.refetchQueries({ queryKey: LIST });
  await waitFor(() => expect(page.list).toHaveBeenCalledTimes(2));
  page.anything();
  await settle();
  expect(page.list).toHaveBeenCalledTimes(2);
  release();
  await waitFor(() => expect(page.list).toHaveBeenCalledTimes(3));
  expect(page.signals.some((signal) => signal.aborted)).toBe(false);
});

it('reads nothing while the page is hidden, and once when it shows again', async () => {
  const page = tab();
  await loaded(page);
  page.hide();
  page.anything();
  page.issues('a');
  await settle();
  expect(page.list).toHaveBeenCalledOnce();
  expect(page.rows).not.toHaveBeenCalled();
  page.show();
  await waitFor(() => expect(page.list).toHaveBeenCalledTimes(2));
  await settle();
  expect(page.list).toHaveBeenCalledTimes(2);
  expect(page.summary).toHaveBeenCalledTimes(2);
});
