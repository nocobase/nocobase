/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { ChartResource } from '../flow/resources/ChartResource';
import { FlowContext } from '@nocobase/flow-engine';

function makeBuilderQuery(filter: any) {
  return {
    mode: 'builder',
    collectionPath: ['ds', 'collection'],
    measures: [{ field: 'price', alias: 'price' }], // 满足 validateQuery 最小要求
    dimensions: [],
    filter,
    limit: 10,
    offset: 0,
  };
}

describe('ChartResource basic behaviors', () => {
  it('setQueryParams should write data.filter when qb filter is present', () => {
    const r = new ChartResource(new FlowContext());
    r.setQueryParams(makeBuilderQuery({ status: 'active' }));
    expect((r as any).request.data.filter).toEqual({ status: 'active' });
  });

  it('setQueryParams should delete data.filter when qb filter is empty', () => {
    const r = new ChartResource(new FlowContext());
    // 先设置非空，确保后续能观察到删除
    r.setQueryParams(makeBuilderQuery({ status: 'active' }));
    expect((r as any).request.data.filter).toEqual({ status: 'active' });

    // 传入空过滤（$and: []）会触发 removeFilterGroup，并最终删除 data.filter
    r.setQueryParams(makeBuilderQuery({ $and: [] }));
    expect((r as any).request.data.filter).toBeUndefined();
  });

  it('should merge qb filter and external groups with AND and flatten $and', () => {
    const r = new ChartResource(new FlowContext());

    // 设置内部过滤（QueryBuilder）
    r.setQueryParams(makeBuilderQuery({ status: 'active' }));
    expect((r as any).request.data.filter).toEqual({ status: 'active' });

    // 添加一个外部条件组
    r.addFilterGroup('ext', { 'price.$lt': 100 });
    expect((r as any).request.data.filter).toEqual({
      $and: [{ status: 'active' }, { 'price.$lt': 100 }],
    });

    // 再添加一个包含 $and 的外部组，应该被扁平化到同一层
    r.addFilterGroup('ext2', { $and: [{ 'stock.$gt': 0 }] });
    expect((r as any).request.data.filter).toEqual({
      $and: [{ status: 'active' }, { 'price.$lt': 100 }, { 'stock.$gt': 0 }],
    });
  });
});
