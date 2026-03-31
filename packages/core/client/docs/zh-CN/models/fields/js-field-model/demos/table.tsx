/**
 * defaultShowCode: true
 * title: TableBlock + JSFieldModel（按状态着色）
 */

import {
  Application,
  CollectionActionModel,
  DisplayTextFieldModel,
  FilterManager,
  Plugin,
  RecordActionModel,
  TableActionsColumnModel,
  TableBlockModel,
  TableColumnModel,
  JSFieldModel,
  MockFlowModelRepository,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { PluginFlowEngine } from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  // ACL：允许全部，避免 aclCheck 触发真实请求
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });
  const records = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    title: `Order-${(i + 1).toString().padStart(3, '0')}`,
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

class DemoPlugin extends Plugin {
  table!: TableBlockModel;

  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsfield-table:'));
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
        { name: 'status', type: 'string', interface: 'input', title: 'Status' },
      ],
    });

    this.table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      subModels: {
        columns: [
          // 标题列（普通显示）
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
          // 状态列（JSField：按值着色）
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'status' } },
            },
            subModels: {
              field: {
                use: 'JSFieldModel',
                stepParams: {
                  jsSettings: {
                    runJs: {
                      code: `
const status = String(ctx.value ?? ctx.record?.status ?? '').toLowerCase();
const color = status === 'done' ? '#52c41a' : status === 'pending' ? '#faad14' : '#ff4d4f';
const text = status || 'unknown';
const html = '<span style="display:inline-flex;align-items:center;gap:6px;">'
  + '<i style="width:8px;height:8px;border-radius:50%;background:' + color + ';display:inline-block;"></i>'
  + '<span style="color:' + color + ';text-transform:capitalize;">' + text + '</span>'
  + '</span>';
ctx.element.innerHTML = html;
                      `.trim(),
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }) as TableBlockModel;

    // 绑定 filterManager，避免刷新流程绑定时报错（兜底避免上下文缺失）
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
            <Card title="表格 + JSField（状态徽标）">
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
  plugins: [PluginFlowEngine, DemoPlugin],
}).getRootComponent();
