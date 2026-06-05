/**
 * defaultShowCode: true
 * title: TableBlock + JSColumnModel（点击打开抽屉查看详情）
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
  const records = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    title: `Order-${(i + 1).toString().padStart(3, '0')}`,
    price: 100 + i * 3,
    status: i % 2 === 0 ? 'done' : 'pending',
  }));
  mock.onGet('orders:list').reply((config) => {
    const page = parseInt(config.params?.page) || 1;
    const pageSize = parseInt(config.params?.pageSize) || 10;
    const start = (page - 1) * pageSize;
    const items = records.slice(start, start + pageSize);
    return [200, { data: items, meta: { page, pageSize, count: records.length } }];
  });
};

class DemoPluginDrawer extends Plugin {
  table!: TableBlockModel;

  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jscolumn-drawer:'));
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

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
          // 操作列（JSColumn：点击打开抽屉，展示当前行 JSON）
          {
            use: 'JSColumnModel',
            stepParams: {
              tableColumnSettings: { title: { title: '操作' } },
              jsSettings: {
                runJs: {
                  code: `
ctx.element.innerHTML = "<a href='#' style='color:#1677ff;'>查看</a>";
const link = ctx.element.querySelector('a');
if (link) {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const pk = (ctx.collection && ctx.collection.getFilterByTK && ctx.collection.getFilterByTK(ctx.record)) ?? ctx.recordIndex;
    const content = "<div style='padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,Roboto,sans-serif;'>"
      + "<h3 style='margin:0 0 12px;'>行数据预览（#" + pk + "）</h3>"
      + "<pre style='background:#f5f5f5;padding:12px;border-radius:6px;'>" + JSON.stringify(ctx.record, null, 2) + "</pre>"
      + "</div>";
    await ctx.viewer.drawer({ width: '50%', content });
  });
}
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

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="表格 + JSColumn（抽屉详情）">
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
  plugins: [PluginFlowEngine, DemoPluginDrawer],
}).getRootComponent();
