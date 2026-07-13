/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompiledFilter } from '@nocobase/client-v2';
import type { TableProps } from 'antd';
import { useCallback, useState } from 'react';

import type { RunRecord } from '../../../pages/runs/types';
import { DEFAULT_RUNS_PAGE_SIZE, RUN_SORT_FALLBACK, getRunSortParam } from '../runShared';

export function useRunListState() {
  const [filters, setFilters] = useState<CompiledFilter>();
  const [sort, setSort] = useState<string | undefined>(RUN_SORT_FALLBACK);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_RUNS_PAGE_SIZE,
  });

  const handleFilterChange = useCallback((filter: CompiledFilter) => {
    setPagination((current) => ({
      ...current,
      current: 1,
    }));
    setFilters(filter);
  }, []);

  const handleTableChange = useCallback<NonNullable<TableProps<RunRecord>['onChange']>>(
    (nextPagination, _filters, sorter) => {
      const nextSort = getRunSortParam(sorter) || RUN_SORT_FALLBACK;
      setPagination((current) => ({
        current: nextSort === sort ? nextPagination.current || current.current : 1,
        pageSize: nextPagination.pageSize || current.pageSize,
      }));
      setSort(nextSort);
    },
    [sort],
  );

  return {
    filters,
    sort,
    pagination,
    handleFilterChange,
    handleTableChange,
  };
}
