/**
 * The grouped task reads in the browser (`GET /api/taskGroups`, `shared/task-groups.ts`): one complete read per
 * refresh, each group's further pages read against the same generation before anything is shown, so counts and rows
 * never come from two different moments. A `409 TASK_GROUPS_CHANGED` reads the whole query again. The projects
 * plugin's, the inbox's and the runners' realtime announcements refresh it, and a slow poll stands in when they stop.
 */
import {
  ApiClientError,
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import type { IssueFilters } from '@nocobase/app-plugin-projects/client/issues';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import {
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { STUDIO_INBOX_TOPIC } from '../../../shared/inbox.js';
import type {
  TaskChildrenPage,
  TaskGroupId,
  TaskGroupMode,
  TaskGroups,
  TaskGroupSummary,
} from '../../../shared/task-groups.js';

/**
 * Under the projects plugin's issues (`pmKeys.issues`, `['pm', 'issues']`, written out as "My follow-ups" writes it), so
 * every issue change it announces reads these again.
 */
export const taskGroupKeys = {
  all: ['pm', 'issues', 'studio-task-groups'] as const,
  summary: ['pm', 'issues', 'studio-task-groups', 'summary'] as const,
};

const POLL_MS = 30_000;

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

/** Reads the grouped tasks again whenever the projects plugin, the inbox or the runners announce a change. */
export function useTaskGroupsRefresh(): void {
  const client = useQueryClient();
  const realtime = useService(realtimeClientToken);
  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void client.invalidateQueries({ queryKey: taskGroupKeys.all }),
        250,
      );
    };
    const stops = [
      realtime.subscribe(PM_REALTIME_TOPIC, refresh),
      realtime.subscribe(STUDIO_INBOX_TOPIC, refresh),
      realtime.subscribe(RUNNERS_TOPIC, refresh),
      realtime.onOpen(refresh),
    ];
    return () => {
      window.clearTimeout(timer);
      for (const stop of stops) stop?.();
    };
  }, [client, realtime]);
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
  useTaskGroupsRefresh();
  return useQuery({
    queryKey: [...taskGroupKeys.all, scope, pages],
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
      previousQuery?.queryKey[taskGroupKeys.all.length] === scope
        ? previous
        : undefined,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
}

/** The cache key of a task's children pages in the table. */
export function childrenKey(
  filters: IssueFilters,
  follow: 'all' | 'scope',
  generation: string | undefined,
  parentId: string,
  pages: number,
): readonly unknown[] {
  return [
    ...taskGroupKeys.all,
    JSON.stringify(groupQuery(filters, { follow })),
    'children',
    generation,
    parentId,
    pages,
  ];
}

/** The children of each expanded task in the table, read against the groups' generation. */
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
  const results = useQueries({
    queries: parents.map((parent) => ({
      queryKey: childrenKey(
        filters,
        follow,
        generation,
        parent.id,
        parent.pages,
      ),
      enabled: Boolean(generation),
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const data = [];
        let cursor: string | null = null;
        for (let n = 0; n < parent.pages; n++) {
          const page: TaskChildrenPage = (
            await api.request<{ data: TaskChildrenPage }>({
              path: 'taskGroups/children',
              query: {
                ...query,
                parentId: parent.id,
                generation: generation!,
                ...(cursor ? { cursor } : {}),
              },
              signal,
            })
          ).data;
          data.push(...page.data);
          cursor = page.nextCursor;
          if (!cursor) break;
        }
        return { generation: generation!, data, nextCursor: cursor };
      },
      retry: false,
      refetchOnWindowFocus: false,
    })),
  });
  const changed = results.some(
    (result) => result.isError && isChanged(result.error),
  );
  useEffect(() => {
    if (changed) void client.invalidateQueries({ queryKey: taskGroupKeys.all });
  }, [changed, client]);
  return new Map(parents.map((parent, index) => [parent.id, results[index]]));
}

/** My tasks' merged counts. */
export function useTaskGroupSummary(
  enabled = true,
): UseQueryResult<TaskGroupSummary> {
  const api = useApiClient();
  useTaskGroupsRefresh();
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
