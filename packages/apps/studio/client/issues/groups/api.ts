/**
 * The grouped task reads in the browser (`GET /api/taskGroups`, `shared/task-groups.ts`): one complete read per
 * refresh, each group's further pages read against the same generation before anything is shown, so counts and rows
 * never come from two different moments. A `409 TASK_GROUPS_CHANGED` reads the whole query again. One app-wide
 * subscription keeps them current (`./live.ts`, `useTaskGroupsLive`), and a slow poll stands in when announcements stop.
 */
import {
  ApiClientError,
  realtimeClientToken,
  useApiClient,
  useService,
  type ApiClient,
} from '@nocobase/app-client';
import type { IssueFilters } from '@nocobase/app-plugin-projects/client/issues';
import { usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { ISSUE_IDS_MAX } from '@nocobase/app-plugin-projects/shared/issues';
import {
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  TASK_CHILDREN_PARENTS_MAX,
  type TaskChildrenPage,
  type TaskChildrenPages,
  type TaskGroupId,
  type TaskGroupMode,
  type TaskGroups,
  type TaskGroupSummary,
} from '../../../shared/task-groups.js';
import {
  readTaskGroupRows,
  subscribeTaskGroupsLive,
  taskGroupKeys,
} from './live.js';

export { taskGroupKeys } from './live.js';

/** The fallback poll, for announcements that never arrived. */
const POLL_MS = 60_000;

/** The query string a filter set reads with. */
export function groupQuery(
  filters: IssueFilters,
  extra: Record<string, string | undefined> = {},
): Record<string, string> {
  const entries = [
    ...Object.entries(filters).filter(([key]) => key !== 'deleted'),
    ...Object.entries(extra),
  ].filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === 'string' && entry[1] !== '',
  );
  return Object.fromEntries(entries);
}

export function isRecoverable(error: unknown): boolean {
  return !(
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}

export function isChanged(error: unknown): boolean {
  return (
    (error as { reason?: string } | null)?.reason === 'TASK_GROUPS_CHANGED'
  );
}

/**
 * Keeps the grouped task reads, and the projects plugin's board and issue pages on Studio's pages, current from
 * announcements; mounted once, in the app's layout.
 */
export function useTaskGroupsLive(): void {
  const client = useQueryClient();
  const realtime = useService(realtimeClientToken);
  const api = useApiClient();
  const pm = usePmApi();
  useEffect(
    () =>
      subscribeTaskGroupsLive(realtime, client, readTaskGroupRows(api), {
        issueRows: async (query, ids) =>
          (
            await pm.issuePage({
              ...query,
              cursor: undefined,
              issueIds: ids,
              limit: ISSUE_IDS_MAX,
            })
          ).data,
      }),
    [client, realtime, api, pm],
  );
}

export interface TaskGroupsOptions {
  readonly filters: IssueFilters;
  readonly mode: TaskGroupMode;
  /** `all`: My tasks' follow group goes beyond the merged scope. */
  readonly follow?: 'all' | 'scope';
  /** How many pages of each group to show. */
  readonly pages?: Readonly<Partial<Record<TaskGroupId, number>>>;
  readonly enabled?: boolean;
}

/** The JSON of a list's query string: the part of its key `./live.ts` reads rows with. */
export function listScope(
  filters: IssueFilters,
  mode: TaskGroupMode,
  follow: 'all' | 'scope',
): string {
  return JSON.stringify(groupQuery(filters, { mode, follow }));
}

export function useTaskGroups({
  filters,
  mode,
  follow = 'scope',
  pages = {},
  enabled = true,
}: TaskGroupsOptions): UseQueryResult<TaskGroups> {
  const api = useApiClient();
  const query = groupQuery(filters, { mode, follow });
  const scope = JSON.stringify(query);
  return useQuery({
    queryKey: [...taskGroupKeys.lists, scope, pages],
    enabled,
    queryFn: async ({ signal }) => {
      const base = (
        await api.request<{ data: TaskGroups }>({
          path: 'taskGroups',
          query,
          signal,
        })
      ).data;
      const groups = [];
      for (const group of base.groups) {
        const rows = [...group.data];
        let next = group.nextCursor;
        for (let n = 1; next && n < (pages[group.group] ?? 1); n++) {
          const part = (
            await api.request<{ data: TaskGroups }>({
              path: 'taskGroups',
              query: {
                ...query,
                group: group.group,
                cursor: next,
                generation: base.generation,
              },
              signal,
            })
          ).data;
          const chunk = part.groups.find((g) => g.group === group.group);
          rows.push(...(chunk?.data ?? []));
          next = chunk?.nextCursor ?? null;
        }
        groups.push({ ...group, data: rows, nextCursor: next });
      }
      return { ...base, groups };
    },
    retry: (count, error) => isChanged(error) && count < 2,
    // The previous result stays while the same query reads again; a new query starts empty.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[taskGroupKeys.lists.length] === scope
        ? previous
        : undefined,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** The cache key of a task's children pages in the table: by the table's scope, without its generation. */
export function childrenKey(
  filters: IssueFilters,
  follow: 'all' | 'scope',
  parentId: string,
  pages: number,
): readonly unknown[] {
  return [
    ...taskGroupKeys.children,
    listScope(filters, 'table', follow),
    parentId,
    pages,
  ];
}

interface ChildrenBatch {
  readonly parents: Set<string>;
  readonly waiting: Promise<TaskChildrenPages>;
}

/** The children reads gathering now, per API client and per query and generation. */
const childrenBatches = new WeakMap<ApiClient, Map<string, ChildrenBatch>>();

/**
 * The first page of `parentId`'s children, read together with every other first page asked for in the same moment
 * (`GET /api/taskGroups/children?parentIds=`), however many parents are expanded.
 */
export function loadFirstChildren(
  api: ApiClient,
  query: Readonly<Record<string, string>>,
  generation: string,
  parentId: string,
): Promise<TaskChildrenPage> {
  let byScope = childrenBatches.get(api);
  if (!byScope)
    childrenBatches.set(api, (byScope = new Map<string, ChildrenBatch>()));
  const key = JSON.stringify([query, generation]);
  let batch = byScope.get(key);
  if (!batch || batch.parents.size >= TASK_CHILDREN_PARENTS_MAX) {
    const parents = new Set<string>();
    const scopes = byScope;
    const waiting = new Promise<TaskChildrenPages>((resolve, reject) => {
      setTimeout(() => {
        if (scopes.get(key)?.parents === parents) scopes.delete(key);
        api
          .request<{ data: TaskChildrenPages }>({
            path: 'taskGroups/children',
            query: { ...query, parentIds: [...parents].join(','), generation },
          })
          .then((response) => resolve(response.data), reject);
      }, 0);
    });
    batch = { parents, waiting };
    byScope.set(key, batch);
  }
  batch.parents.add(parentId);
  return batch.waiting.then((pages) => {
    const page = pages.parents.find((each) => each.parentId === parentId);
    return {
      generation: pages.generation,
      data: page?.data ?? [],
      nextCursor: page?.nextCursor ?? null,
    };
  });
}

/**
 * The children of each expanded task in the table, read against the groups' generation: the first pages of every
 * parent asked for at once in one request, further pages per parent. A new generation reads them again, once for all.
 */
export function useTaskChildren(
  filters: IssueFilters,
  /** As the groups were read: it is part of their generation. */
  follow: 'all' | 'scope',
  generation: string | undefined,
  parents: readonly { readonly id: string; readonly pages: number }[],
): ReadonlyMap<string, UseQueryResult<TaskChildrenPage>> {
  const api = useApiClient();
  const client = useQueryClient();
  const query = groupQuery(filters, { follow });
  const scope = listScope(filters, 'table', follow);
  const results = useQueries({
    queries: parents.map((parent) => ({
      // The key leaves the generation out, so a new one refreshes the pages in place instead of starting empty ones;
      // the read takes the current one from `meta`.
      queryKey: childrenKey(filters, follow, parent.id, parent.pages),
      meta: { generation },
      enabled: Boolean(generation),
      queryFn: async ({
        signal,
        meta,
      }: {
        signal: AbortSignal;
        meta: Record<string, unknown> | undefined;
      }) => {
        const current = String(meta?.generation);
        const first = await loadFirstChildren(api, query, current, parent.id);
        const data = [...first.data];
        let cursor = first.nextCursor;
        for (let n = 1; cursor && n < parent.pages; n++) {
          const page: TaskChildrenPages = (
            await api.request<{ data: TaskChildrenPages }>({
              path: 'taskGroups/children',
              query: {
                ...query,
                parentIds: parent.id,
                generation: current,
                cursor,
              },
              signal,
            })
          ).data;
          data.push(...(page.parents[0]?.data ?? []));
          cursor = page.parents[0]?.nextCursor ?? null;
        }
        return { generation: current, data, nextCursor: cursor };
      },
      placeholderData: (previous: TaskChildrenPage | undefined) => previous,
      retry: false,
      refetchOnWindowFocus: false,
    })),
  });
  // A new generation: the pages read are of the old one, so read them again, all first pages in one request.
  useEffect(() => {
    if (!generation) return;
    void client.invalidateQueries(
      {
        queryKey: [...taskGroupKeys.children, scope],
        // Read against an older generation, or failed against one (`TASK_GROUPS_CHANGED`) with nothing read yet.
        predicate: (each) => {
          const page = each.state.data as TaskChildrenPage | undefined;
          return page === undefined
            ? each.state.status === 'error'
            : page.generation !== generation;
        },
      },
      { cancelRefetch: false },
    );
  }, [generation, scope, client]);
  const changed = results.some(
    (result) => result.isError && isChanged(result.error),
  );
  useEffect(() => {
    if (changed)
      void client.invalidateQueries(
        { queryKey: [...taskGroupKeys.lists, scope] },
        { cancelRefetch: false },
      );
  }, [changed, client, scope]);
  return new Map(parents.map((parent, index) => [parent.id, results[index]]));
}

/** My tasks' merged counts and the menu's waiting count. */
export function useTaskGroupSummary(
  enabled = true,
): UseQueryResult<TaskGroupSummary> {
  const api = useApiClient();
  return useQuery({
    queryKey: taskGroupKeys.summary,
    enabled,
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: TaskGroupSummary }>({
          path: 'taskGroups/summary',
          signal,
        })
      ).data,
    placeholderData: (previous) => previous,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}
