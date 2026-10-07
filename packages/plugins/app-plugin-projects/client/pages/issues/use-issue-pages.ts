import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useState } from 'react';

import type { Page } from '../../../shared/common.js';
import type {
  IssueBoard,
  IssueListItem,
  StatusDefinition,
} from '../../../shared/issues.js';
import { pmKeys } from '../../api/keys.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import type { IssueFilters } from './filters.js';

/**
 * The issue list as cursor pages, 50 at a time, in the filters' order. The key sits under `pmKeys.issues`, so an
 * invalidation of issues refetches every loaded page in order.
 */
export function useIssuePages(
  filters: IssueFilters,
  enabled: boolean,
): UseInfiniteQueryResult<InfiniteData<Page<IssueListItem>, string | null>> {
  const api = usePmApi();
  return useInfiniteQuery({
    queryKey: pmKeys.issuePages(filters),
    queryFn: ({ pageParam }) =>
      api.issuePage({
        ...filters,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Every loaded page's rows, a row that moved between pages shown once. */
export function flattenIssuePages(
  pages: readonly Page<IssueListItem>[] | undefined,
): IssueListItem[] {
  const seen = new Set<string>();
  const rows: IssueListItem[] = [];
  for (const page of pages ?? [])
    for (const issue of page.data)
      if (!seen.has(issue.id)) {
        seen.add(issue.id);
        rows.push(issue);
      }
  return rows;
}

export interface BoardGroup {
  readonly status: StatusDefinition;
  readonly issues: readonly IssueListItem[];
}

export interface ColumnMore {
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onLoadMore: () => void;
}

interface ColumnExtra {
  readonly issues: readonly IssueListItem[];
  readonly nextCursor: string | null;
}

export interface BoardPages {
  readonly query: UseQueryResult<IssueBoard>;
  readonly groups: readonly BoardGroup[] | undefined;
  readonly more: Readonly<Record<string, ColumnMore>>;
}

/**
 * The board with "load more" per column: the board request brings the first page of every column; a column's button
 * fetches its next page and appends it. Extra pages are dropped when the filters change. A card that also appears in
 * a column's first page (it moved or was refreshed) is shown once, where the fresh first page puts it.
 */
export function useBoardPages(
  filters: IssueFilters,
  enabled: boolean,
): BoardPages {
  const api = usePmApi();
  const notify = useNotify();
  const board = useQuery({
    queryKey: pmKeys.board(filters),
    queryFn: () => api.board(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
  const filtersKey = JSON.stringify(filters);
  const [extras, setExtras] = useState<{
    readonly key: string;
    readonly columns: Readonly<Record<string, ColumnExtra>>;
  }>({ key: filtersKey, columns: {} });
  const [loading, setLoading] = useState<string | null>(null);
  const columns = extras.key === filtersKey ? extras.columns : {};

  async function loadMore(statusKey: string, cursor: string): Promise<void> {
    setLoading(statusKey);
    try {
      const page = await api.issuePage({ ...filters, statusKey, cursor });
      setExtras((current) => {
        const base = current.key === filtersKey ? current.columns : {};
        return {
          key: filtersKey,
          columns: {
            ...base,
            [statusKey]: {
              issues: [...(base[statusKey]?.issues ?? []), ...page.data],
              nextCursor: page.nextCursor,
            },
          },
        };
      });
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(null);
    }
  }

  const firstIds = new Set(
    (board.data?.columns ?? []).flatMap((column) =>
      column.issues.map((issue) => issue.id),
    ),
  );
  const groups = board.data?.columns.map((column) => {
    const extra = columns[column.status.key];
    return {
      status: column.status,
      issues: extra
        ? [
            ...column.issues,
            ...extra.issues.filter((issue) => !firstIds.has(issue.id)),
          ]
        : column.issues,
    };
  });
  const more: Record<string, ColumnMore> = {};
  for (const column of board.data?.columns ?? []) {
    const extra = columns[column.status.key];
    const cursor = extra ? extra.nextCursor : column.nextCursor;
    more[column.status.key] = {
      hasMore: cursor !== null,
      loading: loading === column.status.key,
      onLoadMore: () => {
        if (cursor) void loadMore(column.status.key, cursor);
      },
    };
  }
  return { query: board, groups, more };
}
