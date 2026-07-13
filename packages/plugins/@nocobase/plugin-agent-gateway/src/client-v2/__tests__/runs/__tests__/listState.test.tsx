/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import type { TableProps } from 'antd';
import { describe, expect, it } from 'vitest';

import { useRunListState } from '../../../features/runs/hooks/useRunListState';
import type { RunRecord } from '../../../pages/runs/types';

const tableChangeExtra = {
  currentDataSource: [] as RunRecord[],
  action: 'paginate' as const,
};

describe('useRunListState', () => {
  it('preserves filter, sort, page, and page size across unrelated detail rerenders', () => {
    const { result, rerender } = renderHook(({ detailOpen: _detailOpen }) => useRunListState(), {
      initialProps: { detailOpen: false },
    });

    act(() => {
      result.current.handleFilterChange({ $and: [{ status: { $eq: 'running' } }] });
      result.current.handleTableChange({ current: 3, pageSize: 50 }, {}, [], tableChangeExtra);
    });

    expect(result.current.filters).toEqual({ $and: [{ status: { $eq: 'running' } }] });
    expect(result.current.sort).toBe('-createdAt');
    expect(result.current.pagination).toEqual({ current: 3, pageSize: 50 });

    rerender({ detailOpen: true });
    rerender({ detailOpen: false });

    expect(result.current.filters).toEqual({ $and: [{ status: { $eq: 'running' } }] });
    expect(result.current.sort).toBe('-createdAt');
    expect(result.current.pagination).toEqual({ current: 3, pageSize: 50 });
  });

  it('resets only the page when filters or sorting change explicitly', () => {
    const { result } = renderHook(() => useRunListState());

    act(() => {
      result.current.handleTableChange({ current: 4, pageSize: 20 }, {}, [], tableChangeExtra);
    });
    expect(result.current.pagination.current).toBe(4);

    act(() => {
      result.current.handleFilterChange({ status: { $eq: 'failed' } });
    });
    expect(result.current.pagination).toEqual({ current: 1, pageSize: 20 });

    const sorter: Parameters<NonNullable<TableProps<RunRecord>['onChange']>>[2] = {
      field: 'status',
      order: 'ascend',
    };
    act(() => {
      result.current.handleTableChange({ current: 2, pageSize: 50 }, {}, sorter, {
        ...tableChangeExtra,
        action: 'sort',
      });
    });
    expect(result.current.sort).toBe('status');
    expect(result.current.pagination).toEqual({ current: 1, pageSize: 50 });
  });
});
