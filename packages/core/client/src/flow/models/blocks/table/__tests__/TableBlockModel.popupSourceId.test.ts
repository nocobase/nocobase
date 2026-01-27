/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import '@nocobase/client';
import { FlowEngine } from '@nocobase/flow-engine';
import { TableBlockModel } from '../TableBlockModel';

describe('TableBlockModel popup sourceId load', () => {
  it('Non-id association field should use ctx.popup.record.sourceKey', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableBlockModel });

    // 1) 准备数据源：users.hasMany(orders)，且关联使用 sourceKey=code（非 id 字段）
    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'user_code', type: 'string', interface: 'text' },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'code', type: 'string', interface: 'text' },
        {
          name: 'orders',
          title: 'Orders',
          type: 'hasMany',
          target: 'orders',
          interface: 'o2m',
          sourceKey: 'code',
          foreignKey: 'user_code',
        },
      ],
    });

    // 2) 注入 API mock，断言请求路径带入了 popup.record.code
    const api = {
      request: vi.fn(async (config: any) => {
        expect(config.url).toBe('users/USER-001/orders:list');
        return { data: { data: [], meta: {} } } as any;
      }),
    } as any;
    engine.context.defineProperty('api', { value: api });

    // 3) 通过 defineChildren 获取关联区块的初始化参数，确保 sourceId 模板正确
    const designerCtx = {
      dataSourceManager: engine.dataSourceManager,
      view: { inputArgs: { dataSourceKey: 'main', collectionName: 'users' } },
    } as any;
    const children = (await TableBlockModel.defineChildren(designerCtx)) as any[];
    const associated = children.find((item) => String(item.key).includes('associated'));
    const assocBlocks = associated.children(designerCtx) as any[];
    const ordersBlock = assocBlocks.find((item) => String(item.key).includes('orders'));
    const initOptions = ordersBlock.createModelOptions?.stepParams?.resourceSettings?.init;
    expect(initOptions?.sourceId).toBe('{{ctx.popup.record.code}}');

    // 4) 创建关联表格区块模型，提供 popup.record（code 与 filterByTk 不同）
    const modelOptions = {
      ...ordersBlock.createModelOptions,
      uid: 'orders-table',
    };
    const tableModel = engine.createModel<TableBlockModel>(modelOptions as any);
    tableModel.context.defineProperty('view', { value: { inputArgs: { filterByTk: 99 } } });
    tableModel.context.defineProperty('popup', { value: { record: { code: 'USER-001', id: 1 } } });

    // 5) 运行资源初始化与刷新，确认 sourceId 取自 popup.record.code
    await tableModel.applyFlow('resourceSettings');
    expect(tableModel.resource.getSourceId()).toBe('USER-001');

    await tableModel.resource.refresh();
    expect(api.request).toHaveBeenCalledTimes(1);
    const [reqConfig] = api.request.mock.calls[0] as any[];
    expect(reqConfig.url).toBe('users/USER-001/orders:list');
  });
});
