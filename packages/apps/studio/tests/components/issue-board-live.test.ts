/**
 * The projects plugin's board and issue pages on Studio's pages, kept current by the app-wide subscription
 * (`client/issues/groups/live.ts`): a named change reads only the shown rows (`issueIds`) and merges them in; a row that
 * left the filters or changed column, or an announcement naming no issues, reads the list whole; the inbox reads
 * neither; a burst is one request.
 */
import type { RealtimeListener } from '@nocobase/app-client';
import type {
  IssueBoard,
  IssueListItem,
} from '@nocobase/app-plugin-projects/shared/issues';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  subscribeTaskGroupsLive,
  type IssueRowsReader,
} from '../../client/issues/groups/live.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';

const FILTERS = { projectId: 'p1' };
const BOARD = ['pm', 'issues', 'board', FILTERS];
const PAGES = ['pm', 'issues', 'pages', { deleted: true }];

const issue = (
  id: string,
  statusKey: string,
  title = `Task ${id}`,
): IssueListItem => ({ id, statusKey, title }) as unknown as IssueListItem;

const boardOf = (issues: readonly IssueListItem[]): IssueBoard =>
  ({
    columns: ['backlog', 'in_progress'].map((key) => ({
      status: { key, name: key, category: 'unstarted', color: 'gray' },
      issues: issues.filter((each) => each.statusKey === key),
      nextCursor: null,
    })),
  }) as IssueBoard;

const clients: QueryClient[] = [];
const stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  for (const client of clients.splice(0)) client.clear();
});

function tab(rows: IssueRowsReader) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  const board = vi.fn(async () =>
    boardOf([issue('a', 'backlog'), issue('b', 'in_progress')]),
  );
  const pages = vi.fn(async () => ({
    data: [issue('d', 'backlog')],
    nextCursor: null,
  }));
  stops.push(
    new QueryObserver(client, { queryKey: BOARD, queryFn: board }).subscribe(
      () => {},
    ),
    new InfiniteQueryObserver(client, {
      queryKey: PAGES,
      queryFn: pages,
      initialPageParam: null,
      getNextPageParam: () => undefined,
    }).subscribe(() => {}),
  );
  const listeners = new Map<string, RealtimeListener<unknown>>();
  const readRows = vi.fn(rows);
  stops.push(
    subscribeTaskGroupsLive(
      {
        onOpen: () => () => {},
        subscribe: (topic, listener) => {
          listeners.set(topic, listener as RealtimeListener<unknown>);
          return () => listeners.delete(topic);
        },
      },
      client,
      async () => ({ membership: 'm', data: [] }),
      { delay: 20, issueRows: readRows, onVisible: () => () => {} },
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
    board,
    pages,
    readRows,
    data: () => client.getQueryData<IssueBoard>(BOARD),
    named: (...ids: string[]) =>
      emit(PM_REALTIME_TOPIC, {
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: ids,
      }),
    anything: () =>
      emit(PM_REALTIME_TOPIC, { kind: 'pm.changed', domain: 'issues' }),
    inbox: () => emit(STUDIO_INBOX_TOPIC, { kind: 'studio.inbox.changed' }),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

it('reads only the named rows a board shows, once for a burst, and merges them', async () => {
  const page = tab(async (_query, ids) =>
    ids.map((id) =>
      issue(id, id === 'a' ? 'backlog' : 'in_progress', `New ${id}`),
    ),
  );
  await waitFor(() => expect(page.data()).toBeDefined());
  page.named('a');
  page.named('b', 'elsewhere');
  await waitFor(() =>
    expect(
      page
        .data()!
        .columns.flatMap((column) => column.issues.map((each) => each.title)),
    ).toEqual(['New a', 'New b']),
  );
  await settle();
  expect(page.readRows).toHaveBeenCalledOnce();
  expect(page.readRows.mock.calls[0]![0]).toEqual(FILTERS);
  expect([...page.readRows.mock.calls[0]![1]].sort()).toEqual(['a', 'b']);
  expect(page.board).toHaveBeenCalledOnce();
  // The trash showed none of them.
  expect(page.pages).toHaveBeenCalledOnce();
});

it('reads the board whole when a shown row changed column or left its filters', async () => {
  const moved = tab(async () => [issue('a', 'in_progress')]);
  await waitFor(() => expect(moved.data()).toBeDefined());
  moved.named('a');
  await waitFor(() => expect(moved.board).toHaveBeenCalledTimes(2));

  const left = tab(async () => []);
  await waitFor(() => expect(left.data()).toBeDefined());
  left.named('b');
  await waitFor(() => expect(left.board).toHaveBeenCalledTimes(2));
});

it('reads every list whole for an announcement naming nothing, and nothing for the inbox', async () => {
  const page = tab(async () => []);
  await waitFor(() => expect(page.data()).toBeDefined());
  page.inbox();
  await settle();
  expect(page.board).toHaveBeenCalledOnce();
  expect(page.pages).toHaveBeenCalledOnce();
  page.anything();
  page.anything();
  await waitFor(() => {
    expect(page.board).toHaveBeenCalledTimes(2);
    expect(page.pages).toHaveBeenCalledTimes(2);
  });
  await settle();
  expect(page.board).toHaveBeenCalledTimes(2);
  expect(page.readRows).not.toHaveBeenCalled();
});
