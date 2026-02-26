/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  applyMobilePaginationProps,
  createCompactSimpleItemRender,
  getSimpleModePaginationClassName,
  getUnknownCountPaginationTotal,
} from '../pagination';

describe('flow pagination utils', () => {
  it('未知总数场景应按 hasNext 估算 total', () => {
    expect(
      getUnknownCountPaginationTotal({
        dataLength: 12,
        pageSize: 12,
        current: 1,
        hasNext: true,
      }),
    ).toBe(13);

    expect(
      getUnknownCountPaginationTotal({
        dataLength: 9,
        pageSize: 12,
        current: 2,
        hasNext: true,
      }),
    ).toBe(24);
  });

  it('移动端分页应隐藏 total 与 size changer', () => {
    const result = applyMobilePaginationProps(
      {
        total: 43,
        current: 1,
        pageSize: 20,
        showTotal: () => 'Total 43 items',
        showSizeChanger: true,
      },
      true,
    ) as any;

    expect(result.showTotal).toBe(false);
    expect(result.showSizeChanger).toBe(false);
    expect(result.showLessItems).toBe(true);
    expect(typeof result.className).toBe('string');
  });

  it('simple 模式工具应提供 className 与 itemRender', () => {
    const className = getSimpleModePaginationClassName(true);
    const itemRender = createCompactSimpleItemRender({ current: 2, controlHeight: 32 });

    expect(typeof className).toBe('string');
    expect(typeof itemRender).toBe('function');
  });
});
