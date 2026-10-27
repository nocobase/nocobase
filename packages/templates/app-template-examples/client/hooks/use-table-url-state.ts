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

interface TableUrlOptions {
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  sortColumns: readonly string[];
  defaultSorting?: SortingState;
  /** Match the existing endpoint contract; do not translate URLs on upgrade. */
  sortFormat?: 'sort-order' | 'orderBy';
  rowCount?: number;
  active?: boolean;
  revision?: number;
}

/** One parser for both the visible controls and the request. */
export function readTableUrlState(
  params: URLSearchParams,
  {
    defaultPageSize = 10,
    pageSizeOptions = sizes,
    sortColumns,
    defaultSorting = [],
    sortFormat = 'sort-order',
  }: TableUrlOptions,
) {
  const page = Number(params.get('page'));
  const size = Number(params.get('pageSize'));
  const fallback = defaultSorting.filter((sort) =>
    sortColumns.includes(sort.id),
  );
  const fields =
    sortFormat === 'orderBy'
      ? (params.get('orderBy') ?? '').split(',').map((part) => {
          const [id, direction = 'asc', ...rest] = part.trim().split(/\s+/u);
          return { id, direction: rest.length ? '' : direction };
        })
      : [
          {
            id: params.get('sort') ?? sortColumns[0],
            direction: params.get('order'),
          },
        ];
  const valid = fields.every(
    ({ id, direction }) =>
      id &&
      sortColumns.includes(id) &&
      (direction === 'asc' || direction === 'desc'),
  );
  const sortingState: SortingState = valid
    ? fields
        .filter(
          (field, index) =>
            fields.findIndex((other) => other.id === field.id) === index,
        )
        .map(({ id, direction }) => ({ id, desc: direction === 'desc' }))
    : fallback;
  return {
    paginationState: {
      pageIndex: Number.isSafeInteger(page) && page > 0 ? page - 1 : 0,
      pageSize: pageSizeOptions.includes(size) ? size : defaultPageSize,
    },
    sortingState,
  };
}

/** Keep list position shareable across overlays, refresh and browser history. */
export function useTableUrlState({
  defaultPageSize = 10,
  pageSizeOptions = sizes,
  sortColumns,
  rowCount,
  active = true,
  revision = 0,
  defaultSorting = [],
  sortFormat = 'sort-order',
}: TableUrlOptions) {
  const [params, setParams] = useSearchParams();
  const { paginationState, sortingState } = readTableUrlState(params, {
    defaultPageSize,
    pageSizeOptions,
    sortColumns,
    defaultSorting,
    sortFormat,
  });
  const { pageIndex, pageSize } = paginationState;
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
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === 'function' ? updater(paginationState) : updater;
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        const size = pageSizeOptions.includes(next.pageSize)
          ? next.pageSize
          : defaultPageSize;
        const index =
          size !== pageSize ||
          !Number.isSafeInteger(next.pageIndex) ||
          next.pageIndex < 0
            ? 0
            : next.pageIndex;
        result.set('page', String(index + 1));
        result.set('pageSize', String(size));
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
        if (sortFormat === 'orderBy') {
          const valid = next.filter((sort) => sortColumns.includes(sort.id));
          if (valid.length)
            result.set(
              'orderBy',
              valid
                .map((sort) => `${sort.id}${sort.desc ? ' desc' : ''}`)
                .join(','),
            );
          else result.delete('orderBy');
        } else if (next[0] && sortColumns.includes(next[0].id)) {
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
