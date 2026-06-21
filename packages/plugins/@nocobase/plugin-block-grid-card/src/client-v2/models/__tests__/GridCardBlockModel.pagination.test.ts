/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { GridCardBlockModel } from '../GridCardBlockModel';

function createGridCardModel(options: {
  count?: number;
  page?: number;
  pageSize?: number;
  hasNext?: boolean;
  dataLength?: number;
  isMobileLayout?: boolean;
}) {
  const count = options.count ?? 0;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 12;
  const hasNext = options.hasNext ?? false;
  const dataLength = options.dataLength ?? pageSize;
  const data = Array.from({ length: dataLength }, (_, i) => ({ id: i + 1 }));
  const setPage = vi.fn();
  const setPageSize = vi.fn();
  const refresh = vi.fn();

  const model = Object.create(GridCardBlockModel.prototype) as GridCardBlockModel;
  Object.defineProperty(model, 'resource', {
    configurable: true,
    value: {
      getMeta: (key: string) => (key === 'count' ? count : key === 'hasNext' ? hasNext : undefined),
      getPageSize: () => pageSize,
      getPage: () => page,
      getData: () => data,
      setPage,
      setPageSize,
      refresh,
      loading: false,
    },
  });
  Object.defineProperty(model, 'context', {
    configurable: true,
    value: {
      isMobileLayout: !!options.isMobileLayout,
      themeToken: { controlHeight: 32 },
    },
  });
  (model as any).props = {
    columnCount: { xs: 1, md: 2, lg: 3, xxl: 4 },
    rowCount: 3,
  };
  (model as any)._screens = 'lg';
  Object.defineProperty(model, 'translate', {
    configurable: true,
    value: (key: string, vars?: any) => {
      if (key === 'Total {{count}} items') {
        return `Total ${vars?.count ?? ''} items`;
      }
      return key;
    },
  });
  return { model, setPage, setPageSize, refresh };
}

describe('GridCardBlockModel pagination', () => {
  it('移动端已知总数时隐藏 total 与 size changer', () => {
    const { model } = createGridCardModel({
      count: 43,
      page: 2,
      pageSize: 12,
      isMobileLayout: true,
      dataLength: 12,
    });

    const pagination = model.pagination() as any;
    expect(pagination.current).toBe(2);
    expect(pagination.total).toBe(43);
    expect(pagination.showTotal).toBe(false);
    expect(pagination.showSizeChanger).toBe(false);
    expect(pagination.showLessItems).toBe(true);
  });

  it('移动端未知总数时保持 simple 并隐藏 size changer', () => {
    const { model } = createGridCardModel({
      count: 0,
      page: 1,
      pageSize: 12,
      hasNext: true,
      isMobileLayout: true,
      dataLength: 12,
    });

    const pagination = model.pagination() as any;
    expect(pagination.simple).toBe(true);
    expect(pagination.showSizeChanger).toBe(false);
    expect(pagination.showTotal).toBe(false);
    expect(pagination.total).toBe(13);
    expect(typeof pagination.itemRender).toBe('function');
  });
});
