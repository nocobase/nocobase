/**
 * defaultShowCode: true
 * title: JSRecordActionModel - 行内自定义动作
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

  const records = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    title: `Task-${i + 1}`,
    owner: ['Alice', 'Bob', 'Cindy'][i % 3],
    status: i % 2 === 0 ? '进行中' : '已完成',
  }));

  mock.onGet('tasks:list').reply((config) => {
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsrecord-action:'));

    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'tasks',
      title: 'Tasks',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id', title: 'ID' },
        { name: 'title', type: 'string', interface: 'input', title: 'Title' },
        { name: 'owner', type: 'string', interface: 'input', title: 'Owner' },
        { name: 'status', type: 'string', interface: 'input', title: 'Status' },
      ],
    });

    this.table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks' } } },
      subModels: {
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
                        title: '{{t("查看详情")}}',
                        type: 'link',
                      },
                    },
                    clickSettings: {
                      runJs: {
                        code: `
if (!ctx.record) {
  (ctx.message?.error ?? console.error)('未读取到当前记录');
  return;
}
if (ctx.viewer?.drawer) {
  await ctx.viewer.drawer({
    width: '40%',
    content: '<div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,&#39;Segoe UI&#39;,Roboto,sans-serif;">'
      + '<h3 style="margin:0 0 12px;">记录详情</h3>'
      + '<div>ID：' + ctx.record.id + '</div>'
      + '<div>标题：' + ctx.record.title + '</div>'
      + '<div>负责人：' + ctx.record.owner + '</div>'
      + '<div>状态：' + ctx.record.status + '</div>'
      + '</div>',
  });
}
(ctx.message?.success ?? console.log)('已查看记录 ' + ctx.record.title);
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
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'title' } },
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'title' } },
                },
              },
            },
          },
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'owner' } },
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'owner' } },
                },
              },
            },
          },
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'status' } },
            },
            subModels: {
              field: {
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'tasks', fieldPath: 'status' } },
                },
              },
            },
          },
        ],
      },
    }) as TableBlockModel;

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
            <Card title="JSRecordAction 示例">
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
