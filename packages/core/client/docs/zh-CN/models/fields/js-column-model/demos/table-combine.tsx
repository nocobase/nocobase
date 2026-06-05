/**
 * defaultShowCode: true
 * title: TableBlock + JSColumnModel（组合多字段为一列）
 */

import {
  Application,
  DisplayTextFieldModel,
  FilterManager,
  JSColumnModel,
  MockFlowModelRepository,
  Plugin,
  TableBlockModel,
  TableColumnModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { PluginFlowEngine } from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';

// 本地 API mock：提供 orders 列表
const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  // ACL：允许全部，避免 aclCheck 触发真实请求
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });
  const records = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    title: `Order-${(i + 1).toString().padStart(3, '0')}`,
    price: 100 + i * 3,
    status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'pending' : 'error',
  }));
  mock.onGet('orders:list').reply((config) => {
    const page = parseInt(config.params?.page) || 1;
    const pageSize = parseInt(config.params?.pageSize) || 10;
    const start = (page - 1) * pageSize;
    const items = records.slice(start, start + pageSize);
    return [200, { data: items, meta: { page, pageSize, count: records.length } }];
  });
};

class DemoPluginCombine extends Plugin {
  table!: TableBlockModel;

  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jscolumn-combine:'));
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    // 数据源与集合定义
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'orders',
      title: 'Orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id', title: 'ID' },
        { name: 'title', type: 'string', interface: 'input', title: 'Title' },
        { name: 'price', type: 'double', interface: 'number', title: 'Price' },
        { name: 'status', type: 'string', interface: 'input', title: 'Status' },
      ],
    });

    // 表格模型
    this.table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      subModels: {
        columns: [
          // 标题列（普通）
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' } },
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' } },
                },
              },
            },
          },
          // 组合列：将 title（status） - price 合并为一列展示
          {
            use: 'JSColumnModel',
            stepParams: {
              tableColumnSettings: { title: { title: '概览' }, width: { width: 240 } },
              jsSettings: {
                runJs: {
                  code: `
const title = String(ctx.record?.title ?? '');
const status = String(ctx.record?.status ?? '');
const price = String(ctx.record?.price ?? '');
ctx.element.innerHTML = '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
  + '<strong>' + title + '</strong>'
  + '<span style="color:#999">（' + status + '）</span>'
  + '<span style="color:#999"> - ' + price + '</span>'
  + '</div>';
                  `.trim(),
                },
              },
            },
          },
        ],
      },
    }) as TableBlockModel;

    // 兜底：提供 filterManager，避免 bindToTarget 报错
    const filterMgr: any = (() => {
      try {
        return new FilterManager(this.table);
      } catch (e) {
        return { bindToTarget() {} } as any;
      }
    })();
    this.table.context.defineProperty('filterManager', { value: filterMgr });

    // 路由
    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="表格 + JSColumn（组合字段）">
              <FlowModelRenderer model={this.table} showFlowSettings />
            </Card>
          </div>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowEngine, DemoPluginCombine],
}).getRootComponent();
