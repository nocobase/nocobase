/**
 * defaultShowCode: true
 * title: JSCollectionActionModel - table 批量操作
 */

import {
  Application,
  FilterManager,
  MockFlowModelRepository,
  Plugin,
  TableActionsColumnModel,
  TableBlockModel,
  TableColumnModel,
  DisplayTextFieldModel,
  JSCollectionActionModel,
  JSRecordActionModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import { PluginFlowEngine } from '@nocobase/client';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });

  const records = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    title: `Order-${(i + 1).toString().padStart(3, '0')}`,
    status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'pending' : 'draft',
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jscollection-action:'));

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
        actions: [
          {
            use: 'JSCollectionActionModel',
            stepParams: {
              buttonSettings: {
                general: {
                  title: '{{t("查看详情")}}',
                  type: 'link',
                },
              },
              clickSettings: {
                runJs: {
                  code: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  (ctx.message?.warning ?? console.warn)('请至少勾选一条记录');
  return;
}
const ids = rows.map((item) => item.id).join(', ');
if (ctx.viewer?.drawer) {
  await ctx.viewer.drawer({
    width: '40%',
    content: '<div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,&#39;Segoe UI&#39;,Roboto,sans-serif;">'
      + '<h3 style="margin:0 0 12px;">批量操作</h3>'
      + '<div>勾选的 ID：' + ids + '</div>'
      + '<div style="color:#999;margin-top:12px;">实际项目中可以在这里调用 ctx.api 或 ctx.resource 执行批量更新。</div>'
      + '</div>',
  });
}
(ctx.message?.success ?? console.log)('演示完成，共选中 ' + rows.length + ' 条');
                `.trim(),
                },
              },
            },
          } as any,
        ],
        columns: [
          {
            use: 'TableActionsColumnModel',
            subModels: {
              actions: [
                {
                  use: 'JSRecordActionModel',
                  stepParams: {
                    buttonSettings: {
                      general: {
                        title: '{{t("批量标记为完成")}}',
                        type: 'primary',
                      },
                    },
                    clickSettings: {
                      runJs: {
                        code: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  (ctx.message?.warning ?? console.warn)('请至少勾选一条记录');
  return;
}
const ids = rows.map((item) => item.id).join(', ');
if (ctx.viewer?.drawer) {
  await ctx.viewer.drawer({
    width: '40%',
    content: '<div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,&#39;Segoe UI&#39;,Roboto,sans-serif;">'
      + '<h3 style="margin:0 0 12px;">批量操作</h3>'
      + '<div>勾选的 ID：' + ids + '</div>'
      + '<div style="color:#999;margin-top:12px;">实际项目中可以在这里调用 ctx.api 或 ctx.resource 执行批量更新。</div>'
      + '</div>',
  });
}
(ctx.message?.success ?? console.log)('演示完成，共选中 ' + rows.length + ' 条');
                        `.trim(),
                      },
                    },
                  },
                } as any,
              ],
            },
          },
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
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'status' } },
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'status' } },
                },
              },
            },
          },
        ],
      },
    }) as TableBlockModel;

    this.table.setProps({ rowSelection: { type: 'checkbox' } });

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
            <Card title="JSCollectionAction 示例">
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
