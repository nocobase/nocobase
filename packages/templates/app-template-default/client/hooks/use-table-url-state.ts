import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

const sizes = [10, 20, 50, 100] as const;

/** Keep list position shareable across overlays, refresh and browser history. */
export function useTableUrlState({
  defaultPageSize = 10,
  pageSizeOptions = sizes,
  sortColumns,
  rowCount,
}: {
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  sortColumns: readonly string[];
  rowCount?: number;
}) {
  const [params, setParams] = useSearchParams();
  const requestedPage = Number(params.get('page'));
  const pageIndex =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage - 1
      : 0;
  const requestedSize = Number(params.get('pageSize'));
  const pageSize = pageSizeOptions.includes(requestedSize)
    ? requestedSize
    : defaultPageSize;
  const paginationState = { pageIndex, pageSize };
  const sort = params.get('sort') ?? sortColumns[0];
  const order = params.get('order');
  const sortingState: SortingState =
    sort && sortColumns.includes(sort) && (order === 'asc' || order === 'desc')
      ? [{ id: sort, desc: order === 'desc' }]
      : [];
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === 'function' ? updater(paginationState) : updater;
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        result.set('page', String(next.pageIndex + 1));
        result.set('pageSize', String(next.pageSize));
        return result;
      },
      { replace: false },
    );
  };
  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next =
      typeof updater === 'function' ? updater(sortingState) : updater;
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        result.delete('page');
        if (next[0] && sortColumns.includes(next[0].id)) {
          result.set('sort', next[0].id);
          result.set('order', next[0].desc ? 'desc' : 'asc');
        } else {
          result.delete('sort');
          result.delete('order');
        }
        return result;
      },
      { replace: true },
    );
  };
  // Only pass a count for the current, successfully loaded query.
  useEffect(() => {
    if (rowCount === undefined) return;
    const lastPage = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
    if (pageIndex <= lastPage) return;
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        result.set('page', String(lastPage + 1));
        return result;
      },
      { replace: true },
    );
  }, [rowCount, pageSize, pageIndex, setParams]);
  return {
    paginationState,
    onPaginationChange,
    sortingState,
    onSortingChange,
    pageSizeOptions,
  };
}
