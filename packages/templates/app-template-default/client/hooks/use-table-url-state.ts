import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useLocation, useSearchParams } from 'react-router';
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

/** A bounded recovery failed because concurrent writes kept moving the final page. */
export class ListRecoveryError extends Error {}

const sizes = [10, 20, 50, 100] as const;

/** Keep list position shareable across overlays, refresh and browser history. */
export function useTableUrlState({
  defaultPageSize = 10,
  pageSizeOptions = sizes,
  sortColumns,
  rowCount,
  active = true,
  revision = 0,
}: {
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  sortColumns: readonly string[];
  rowCount?: number;
  active?: boolean;
  revision?: number;
}) {
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const contextParams = new URLSearchParams(params);
  contextParams.delete('page');
  const context = JSON.stringify([
    pathname,
    contextParams.toString(),
    revision,
  ]);
  const correctionsRef = useRef({ context, attempts: 0, expectedPage: -1 });
  const [blocked, setBlocked] = useState<string>();
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
    if (
      !active ||
      rowCount === undefined ||
      !Number.isSafeInteger(rowCount) ||
      rowCount < 0
    )
      return;
    if (
      correctionsRef.current.context !== context ||
      (correctionsRef.current.expectedPage !== -1 &&
        correctionsRef.current.expectedPage !== pageIndex)
    )
      correctionsRef.current = { context, attempts: 0, expectedPage: -1 };
    const lastPage = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
    if (pageIndex <= lastPage) {
      correctionsRef.current.attempts = 0;
      return;
    }
    if (correctionsRef.current.attempts >= 2) {
      setBlocked(`${context}:${pageIndex}`);
      return;
    }
    correctionsRef.current.attempts += 1;
    correctionsRef.current.expectedPage = lastPage;
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        result.set('page', String(lastPage + 1));
        return result;
      },
      { replace: true },
    );
  }, [rowCount, pageSize, pageIndex, setParams, active, context]);
  return {
    error:
      blocked === `${context}:${pageIndex}`
        ? new ListRecoveryError(t('settings.listChanged'))
        : undefined,
    paginationState,
    onPaginationChange,
    sortingState,
    onSortingChange,
    pageSizeOptions,
  };
}
