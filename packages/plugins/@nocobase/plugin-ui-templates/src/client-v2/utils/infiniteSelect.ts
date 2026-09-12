/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import debounce from 'lodash/debounce';
import { TEMPLATE_LIST_PAGE_SIZE } from './templateCompatibility';

export type PaginatedOptionsResult<T = any> = { options: T[]; hasMore: boolean };

export const defaultSelectOptionComparator = (a: any, b: any) => {
  const da = a?.disabled ? 1 : 0;
  const db = b?.disabled ? 1 : 0;
  if (da !== db) return da - db;
  return (a?.__idx ?? 0) - (b?.__idx ?? 0);
};

export function mergeSelectOptions(
  prev: any[],
  next: any[],
  options?: { getKey?: (item: any) => string; comparator?: (a: any, b: any) => number },
) {
  const getKey = options?.getKey || ((item: any) => String(item?.value || ''));
  const comparator = options?.comparator || defaultSelectOptionComparator;

  const map = new Map<string, any>();
  for (const item of Array.isArray(prev) ? prev : []) {
    const key = getKey(item);
    if (!key) continue;
    map.set(key, item);
  }
  for (const item of Array.isArray(next) ? next : []) {
    const key = getKey(item);
    if (!key) continue;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...item } : item);
  }

  const merged = Array.from(map.values());
  merged.sort(comparator);
  return merged;
}

export function bindInfiniteScrollToFormilySelect(
  field: any,
  fetchPage: (keyword: string, page: number, pageSize: number) => Promise<PaginatedOptionsResult<any>>,
  options?: {
    pageSize?: number;
    debounceMs?: number;
    scrollThreshold?: number;
    composingKey?: string;
    comparator?: (a: any, b: any) => number;
  },
) {
  const pageSize = Math.max(1, Number(options?.pageSize || TEMPLATE_LIST_PAGE_SIZE));
  const debounceMs = Math.max(0, Number(options?.debounceMs ?? 300));
  const scrollThreshold = Math.max(0, Number(options?.scrollThreshold ?? 24));
  const composingKey = String(options?.composingKey || '__templateComposing');
  const comparator = options?.comparator || defaultSelectOptionComparator;

  let requestVersion = 0;
  let currentKeyword = '';
  let currentPage = 0;
  let currentHasMore = true;
  let loadingMore = false;

  const setComposing = (v: boolean) => {
    try {
      field.data = { ...(field.data || {}), [composingKey]: v };
    } catch {
      // ignore
    }
  };

  const isComposing = () => !!field.data?.[composingKey];

  const resetAndLoad = async (keyword: string) => {
    const nextVersion = (requestVersion || 0) + 1;
    requestVersion = nextVersion;
    currentKeyword = keyword;
    currentPage = 0;
    currentHasMore = true;
    loadingMore = false;
    field.loading = true;
    try {
      const { options: optionList, hasMore } = await fetchPage(keyword, 1, pageSize);
      if (requestVersion !== nextVersion) return;
      field.dataSource = mergeSelectOptions([], optionList, { comparator });
      currentPage = 1;
      currentHasMore = !!hasMore;
    } finally {
      if (requestVersion === nextVersion) {
        field.loading = false;
      }
    }
  };

  const loadMore = async () => {
    if (!currentHasMore || loadingMore) return;
    const version = requestVersion;
    const nextPage = Math.max(1, currentPage || 1) + 1;
    loadingMore = true;
    field.loading = true;
    try {
      const { options: optionList, hasMore } = await fetchPage(currentKeyword, nextPage, pageSize);
      if (requestVersion !== version) return;
      field.dataSource = mergeSelectOptions(field.dataSource || [], optionList, { comparator });
      currentPage = nextPage;
      currentHasMore = !!hasMore;
    } finally {
      loadingMore = false;
      if (requestVersion === version) {
        field.loading = false;
      }
    }
  };

  field.componentProps.onDropdownVisibleChange = async (open: boolean) => {
    if (!open) return;
    await resetAndLoad('');
  };

  const debouncedSearch = debounce(async (kw: string) => resetAndLoad(kw), debounceMs);

  field.componentProps.onSearch = (value: string) => {
    if (isComposing()) return;
    const keyword = typeof value === 'string' ? value.trim() : '';
    debouncedSearch(keyword);
  };

  field.componentProps.onCompositionStart = () => setComposing(true);
  field.componentProps.onCompositionEnd = (e: any) => {
    setComposing(false);
    const keyword = typeof e?.target?.value === 'string' ? e.target.value.trim() : '';
    debouncedSearch(keyword);
  };

  field.componentProps.onPopupScroll = (e: any) => {
    const target = e?.target as HTMLElement | undefined;
    if (!target) return;
    if (target.scrollTop + target.clientHeight < target.scrollHeight - scrollThreshold) return;
    loadMore();
  };

  return { resetAndLoad, loadMore, cancelSearch: () => debouncedSearch.cancel() };
}
