/**
 * Keeps every grouped task read current (`./api.ts`), once for the whole app however many lists, tabs and badges show
 * them. Announcements are gathered for `COALESCE_MS` and then:
 *
 * - one that names issues (`PmChangeEvent.issueIds`) reads only the rows those issues have in each list shown
 *   (`GET /api/taskGroups/rows`) and merges them in; a list whose membership moved meanwhile is read whole instead;
 * - one that names nothing, the inbox's, the plans', and a reconnect read every shown list whole, and the summary too.
 *
 * The projects plugin's flat lists on Studio's pages, the board (`pmKeys.board`) and the issue pages (`pmKeys.issuePages`,
 * the trash), are kept current the same way: a named change reads those rows alone through `GET /api/projects/issues`
 * with `issueIds` and the list's own filters, and the list is read whole when a shown row left it or changed column,
 * or for an announcement naming no issues.
 *
 * One refresh runs at a time and never cancels a read under way: a burst during a refresh is handled after it. Nothing
 * is read while the page is hidden; what was missed is read when it is shown again. Lists not shown are only marked
 * stale.
 */
import type { ApiClient, RealtimeClient } from '@nocobase/app-client';
import { announcedIssueIds } from '@nocobase/app-plugin-projects/client/kit';
import {
  PM_REALTIME_TOPIC,
  type PmChangeEvent,
} from '@nocobase/app-plugin-projects/shared/realtime';
import type { Page } from '@nocobase/app-plugin-projects/shared/common';
import {
  ISSUE_IDS_MAX,
  type IssueBoard,
  type IssueListItem,
  type IssueListQuery,
} from '@nocobase/app-plugin-projects/shared/issues';
import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';

import { STUDIO_INBOX_TOPIC } from '../../../shared/inbox.js';
import {
  TASK_GROUP_ROWS_MAX,
  type TaskChildrenPage,
  type TaskGroupItem,
  type TaskGroupRows,
  type TaskGroups,
} from '../../../shared/task-groups.js';

/** How long announcements are gathered before the lists are refreshed. */
export const COALESCE_MS = 1_500;

/**
 * The grouped task reads, under Studio's own prefix: the projects plugin refreshes everything under `['pm', 'issues']`
 * on every announcement, which these refresh more narrowly themselves.
 */
export const taskGroupKeys = {
  all: ['studio', 'task-groups'] as const,
  /** Every list; `[...lists, scope, pages]`, `scope` the JSON of the query string. */
  lists: ['studio', 'task-groups', 'list'] as const,
  /** Children pages in the table; `[...children, scope, parentId, pages]`, `scope` as the table's list. */
  children: ['studio', 'task-groups', 'children'] as const,
  summary: ['studio', 'task-groups', 'summary'] as const,
};

type LiveClient = Pick<
  QueryClient,
  'getQueryCache' | 'invalidateQueries' | 'setQueryData' | 'isFetching'
>;

/** Reads rows of a list (`GET /api/taskGroups/rows`) with the list's query string. */
export type TaskGroupRowsReader = (
  query: Readonly<Record<string, string>>,
  ids: readonly string[],
) => Promise<TaskGroupRows>;

export function readTaskGroupRows(
  api: Pick<ApiClient, 'request'>,
): TaskGroupRowsReader {
  return async (query, ids) =>
    (
      await api.request<{ data: TaskGroupRows }>({
        path: 'taskGroups/rows',
        query: { ...query, ids: ids.join(',') },
      })
    ).data;
}

/** Reads the rows of `ids` a flat issue list holds now (`GET /api/projects/issues?issueIds=`), within its filters. */
export type IssueRowsReader = (
  query: IssueListQuery,
  ids: readonly string[],
) => Promise<readonly IssueListItem[]>;

/** The projects plugin's flat lists this keeps current: `['pm', 'issues', 'board' | 'pages', query]`. */
const PM_LISTS = ['board', 'pages'] as const;
const isPmList = (key: QueryKey): boolean =>
  key[0] === 'pm' &&
  key[1] === 'issues' &&
  (PM_LISTS as readonly unknown[]).includes(key[2]);

export interface TaskGroupsLiveOptions {
  /** Reads rows of the projects plugin's flat lists; without it they are read whole for every named change. */
  readonly issueRows?: IssueRowsReader;
  readonly delay?: number;
  /** Whether the page is shown; read nothing while it is not. */
  readonly visible?: () => boolean;
  /** Called with what runs when the page is shown again; returns what stops listening. */
  readonly onVisible?: (run: () => void) => () => void;
}

const documentVisible = (): boolean =>
  typeof document === 'undefined' || document.visibilityState !== 'hidden';

function onDocumentVisible(run: () => void): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const listener = () => {
    if (documentVisible()) run();
  };
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

/** `groups` with each item among `rows` replaced, wherever it is listed. */
export function mergeTaskGroupRows(
  groups: TaskGroups,
  rows: ReadonlyMap<string, TaskGroupItem>,
): TaskGroups {
  return {
    ...groups,
    groups: groups.groups.map((group) => ({
      ...group,
      data: group.data.map((item) => rows.get(item.issue.id) ?? item),
    })),
  };
}

export function subscribeTaskGroupsLive(
  realtime: Pick<RealtimeClient, 'onOpen' | 'subscribe'>,
  client: LiveClient,
  readRows: TaskGroupRowsReader,
  options: TaskGroupsLiveOptions = {},
): () => void {
  const delay = options.delay ?? COALESCE_MS;
  const visible = options.visible ?? documentVisible;
  const named = new Set<string>();
  let whole = false;
  // The flat issue lists are read whole only for announcements about issues or labels, never for the inbox's.
  let wholeIssues = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let stopped = false;

  /** Reads `queryKey` again unless a read of it is under way, which the next refresh then follows. */
  const readAgain = (queryKey: QueryKey, exact = true) =>
    client.invalidateQueries(
      { queryKey, exact, refetchType: 'active' },
      { cancelRefetch: false },
    );

  async function refreshWhole(): Promise<void> {
    await Promise.all([
      readAgain(taskGroupKeys.lists, false),
      readAgain(taskGroupKeys.summary),
    ]);
  }

  const readPmListsAgain = () =>
    client.invalidateQueries(
      {
        queryKey: ['pm', 'issues'],
        predicate: (query) => isPmList(query.queryKey),
        refetchType: 'active',
      },
      { cancelRefetch: false },
    );

  /** The issues a flat list shows, each with the column it is in (the board) or null (pages). */
  function shownIn(key: QueryKey, data: unknown): Map<string, string | null> {
    const shown = new Map<string, string | null>();
    if (key[2] === 'board')
      for (const column of (data as IssueBoard).columns)
        for (const issue of column.issues)
          shown.set(issue.id, column.status.key);
    else
      for (const page of (data as InfiniteData<Page<IssueListItem>>).pages)
        for (const issue of page.data) shown.set(issue.id, null);
    return shown;
  }

  function mergeInto(
    key: QueryKey,
    data: unknown,
    rows: ReadonlyMap<string, IssueListItem>,
  ): unknown {
    if (key[2] === 'board') {
      const board = data as IssueBoard;
      return {
        ...board,
        columns: board.columns.map((column) => ({
          ...column,
          issues: column.issues.map((issue) => rows.get(issue.id) ?? issue),
        })),
      };
    }
    const pages = data as InfiniteData<Page<IssueListItem>>;
    return {
      ...pages,
      pages: pages.pages.map((page) => ({
        ...page,
        data: page.data.map((issue) => rows.get(issue.id) ?? issue),
      })),
    };
  }

  /** The rows of `ids` in one flat list: merged, or the list read whole when one left it or changed column. */
  async function refreshPmList(
    queryKey: QueryKey,
    ids: ReadonlySet<string>,
  ): Promise<void> {
    const query = client.getQueryCache().find({ queryKey, exact: true });
    const data = query?.state.data;
    if (!query || !data) return;
    const shown = new Map(
      [...shownIn(queryKey, data)].filter(([id]) => ids.has(id)),
    );
    if (shown.size === 0) return;
    if (query.getObserversCount() === 0) {
      await client.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: 'none',
      });
      return;
    }
    const readRows = options.issueRows;
    if (!readRows || shown.size > ISSUE_IDS_MAX) {
      await readAgain(queryKey);
      return;
    }
    let answer: readonly IssueListItem[];
    try {
      answer = await readRows(queryKey[3] ?? {}, [...shown.keys()]);
    } catch {
      await readAgain(queryKey);
      return;
    }
    const current = client
      .getQueryCache()
      .find({ queryKey, exact: true })?.state;
    if (
      stopped ||
      !current?.data ||
      current.data !== data ||
      current.fetchStatus === 'fetching'
    )
      return;
    const rows = new Map(answer.map((issue) => [issue.id, issue]));
    // Left the list's filters, or moved to another column: the list itself changed.
    const moved = [...shown].some(([id, column]) => {
      const row = rows.get(id);
      return !row || (column !== null && row.statusKey !== column);
    });
    if (moved) {
      await readAgain(queryKey);
      return;
    }
    client.setQueryData(queryKey, mergeInto(queryKey, data, rows));
  }

  /** The rows of `ids` in one list: merged, or the list read whole when its membership moved. */
  async function refreshRows(
    queryKey: QueryKey,
    ids: ReadonlySet<string>,
  ): Promise<void> {
    const cache = client.getQueryCache();
    const query = cache.find<TaskGroups>({ queryKey, exact: true });
    const data = query?.state.data;
    if (!query || !data) return;
    const scope = queryKey[taskGroupKeys.lists.length] as string;
    const childKeys = cache
      .findAll({ queryKey: [...taskGroupKeys.children, scope] })
      .map((child) => child.queryKey);
    const shown = new Set<string>();
    for (const group of data.groups)
      for (const item of group.data)
        if (ids.has(item.issue.id)) shown.add(item.issue.id);
    for (const key of childKeys)
      for (const item of cache.find<TaskChildrenPage>({
        queryKey: key,
        exact: true,
      })?.state.data?.data ?? [])
        if (ids.has(item.issue.id)) shown.add(item.issue.id);
    if (shown.size === 0) return;
    // Not shown now: marked stale, read whole when a page shows it again.
    if (query.getObserversCount() === 0) {
      await client.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: 'none',
      });
      return;
    }
    if (shown.size > TASK_GROUP_ROWS_MAX) {
      await readAgain(queryKey);
      return;
    }
    let answer: TaskGroupRows;
    try {
      answer = await readRows(JSON.parse(scope) as Record<string, string>, [
        ...shown,
      ]);
    } catch {
      await readAgain(queryKey);
      return;
    }
    const current = client
      .getQueryCache()
      .find<TaskGroups>({ queryKey, exact: true })?.state;
    if (
      stopped ||
      !current?.data ||
      // A whole read finished or started meanwhile: it holds or will hold the change.
      current.data !== data ||
      current.fetchStatus === 'fetching'
    )
      return;
    if (answer.membership !== data.membership) {
      await readAgain(queryKey);
      return;
    }
    const rows = new Map(answer.data.map((item) => [item.issue.id, item]));
    // A shown row the answer left out is no longer one the viewer may see: the list moved after all.
    if ([...shown].some((id) => !rows.has(id))) {
      await readAgain(queryKey);
      return;
    }
    client.setQueryData<TaskGroups>(queryKey, mergeTaskGroupRows(data, rows));
    for (const key of childKeys)
      client.setQueryData<TaskChildrenPage>(key, (page) =>
        page
          ? {
              ...page,
              data: page.data.map((item) => rows.get(item.issue.id) ?? item),
            }
          : page,
      );
  }

  async function flush(): Promise<void> {
    if (stopped) return;
    if (!visible()) return;
    const listsFetching =
      client.isFetching({ queryKey: taskGroupKeys.all }) > 0 ||
      client.isFetching({
        queryKey: ['pm', 'issues'],
        predicate: (query) => isPmList(query.queryKey),
      }) > 0;
    // A read under way may have started before the change: follow it rather than cancel it.
    if (listsFetching) {
      schedule(Math.max(50, Math.round(delay / 4)));
      return;
    }
    const ids = new Set(named);
    named.clear();
    const all = whole;
    whole = false;
    const allIssues = wholeIssues;
    wholeIssues = false;
    running = true;
    try {
      if (all) await refreshWhole();
      else if (ids.size > 0)
        for (const query of client
          .getQueryCache()
          .findAll({ queryKey: taskGroupKeys.lists }))
          await refreshRows(query.queryKey, ids);
      if (allIssues) await readPmListsAgain();
      else if (ids.size > 0)
        for (const query of client.getQueryCache().findAll({
          queryKey: ['pm', 'issues'],
          predicate: (each) => isPmList(each.queryKey),
        }))
          await refreshPmList(query.queryKey, ids);
    } finally {
      running = false;
    }
    if (named.size > 0 || whole || wholeIssues) schedule();
  }

  function schedule(wait: number = delay): void {
    if (stopped || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (running) schedule();
      else void flush();
    }, wait);
  }

  const stops = [
    realtime.onOpen(() => {
      whole = true;
      wholeIssues = true;
      schedule();
    }),
    realtime.subscribe<unknown>(PM_REALTIME_TOPIC, ({ payload }) => {
      const change = payload as Partial<PmChangeEvent> | null;
      if (change?.kind !== 'pm.changed') return;
      const ids = change.domain === 'issues' ? announcedIssueIds(change) : null;
      if (ids) for (const id of ids) named.add(id);
      else {
        whole = true;
        if (change.domain !== 'plans') wholeIssues = true;
      }
      schedule();
    }),
    realtime.subscribe(STUDIO_INBOX_TOPIC, () => {
      whole = true;
      schedule();
    }),
    (options.onVisible ?? onDocumentVisible)(() => {
      if (named.size > 0 || whole || wholeIssues) schedule(0);
    }),
  ];
  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    for (const stop of stops) stop?.();
  };
}
