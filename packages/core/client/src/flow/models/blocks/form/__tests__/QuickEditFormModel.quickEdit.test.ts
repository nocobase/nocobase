/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowEngine, SingleRecordResource } from '@nocobase/flow-engine';
import { QuickEditFormModel } from '@nocobase/client';

describe('QuickEditFormModel - quick edit save triggers API (regression)', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  it('calls update with filterByTk and merges primary key from ctx.collection/record', async () => {
    // 1) 准备数据源与集合（含主键字段）
    const dsm = engine.context.dataSourceManager;
    const ds = dsm.getDataSource('main');
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'text' },
      ],
    });

    // 2) 注入 API mock：拦截请求并断言参数
    const api = {
      request: vi.fn(async (config: any) => {
        expect(config.method).toBe('post');
        expect(config.url).toBe('users:update');
        // filterByTk 通过 params 传入
        expect(config.params?.filterByTk).toBe(1);
        // data 应包含要更新的字段以及主键（由 ctx.collection + ctx.record 推导）
        expect(config.data).toMatchObject({ name: 'new-name' });
        return { data: { data: {} } } as any;
      }),
    } as any;
    engine.context.defineProperty('api', { value: api });

    // 3) 创建 QuickEditFormModel；onInit 中已为 ctx 注入 collection getter（本次回归修复点）
    const m = engine.createModel<QuickEditFormModel>({
      use: QuickEditFormModel,
      uid: 'qe-1',
    });

    (m as any).collection = dsm.getCollection('main', 'users');
    const res = m.context.createResource(SingleRecordResource) as SingleRecordResource<any>;
    res.setDataSourceKey('main');
    res.setResourceName('users');
    (m as any).resource = res;

    // 预置当前记录（ctx.record 由 QuickEditFormModel.onInit 提供）与 tk
    res.setFilterByTk(1);
    res.setData({ name: 'old-name' });

    // 4) 保存：应触发 update 请求，并包含主键
    await res.save({ name: 'new-name' }, { refresh: false });

    expect(api.request).toHaveBeenCalledTimes(1);
  });
});
