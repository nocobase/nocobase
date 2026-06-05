/**
 * defaultShowCode: true
 * title: EditForm + JSItemModel（打开抽屉预览）
 */

import {
  Application,
  EditFormModel,
  FormGridModel,
  FormItemModel,
  JSItemModel,
  JSEditableFieldModel,
  FilterManager,
  MockFlowModelRepository,
  Plugin,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import { PluginFlowEngine } from '@nocobase/client';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  // ACL：允许全部，避免 aclCheck 触发真实请求
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });
  const record = { id: 1, title: 'Order-001', price: 199, quantity: 2, discount: 0.1 };
  mock.onGet('orders:get').reply((config) => {
    const id = Number(config.params?.filterByTk);
    return [200, { data: id === 1 ? record : null }];
  });
  mock.onPost('orders:update').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    return [200, { data: { ...record, ...data } }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsitem-edit:'));
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
        { name: 'quantity', type: 'integer', interface: 'number', title: 'Quantity' },
        { name: 'discount', type: 'double', interface: 'number', title: 'Discount' },
      ],
    });

    const form = this.flowEngine.createModel({
      use: 'EditFormModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', filterByTk: 1 } },
      },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 标题、价格
              ...(['title', 'price'] as const).map((name) => ({
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: name },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: name },
                      },
                    },
                  },
                },
              })),
              // JSItem - 打开抽屉预览当前表单值
              {
                use: 'JSItemModel',
                stepParams: {
                  jsSettings: {
                    runJs: {
                      code: `
ctx.element.innerHTML = '<button type="button" style="padding:6px 10px;border:1px solid #1890ff;background:#fff;color:#1890ff;border-radius:4px;cursor:pointer;">打开预览</button>';
const btn = ctx.element.querySelector('button');
if (btn) {
  btn.addEventListener('click', async () => {
    const values = ctx.form.getFieldsValue();
    const pre = JSON.stringify(values, null, 2).replace(/</g, '&lt;');
    const content = '<div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,sans-serif;">'
      + '<h3 style="margin:0 0 12px;">提交前预览</h3>'
      + '<pre style="background:#f5f5f5;padding:12px;border-radius:6px;">' + pre + '</pre>'
      + '</div>';
    await ctx.viewer.drawer({ width: '48%', content });
  });
}
                      `.trim(),
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    // 提供 filterManager，避免 refreshSettings 绑定时报错（兜底避免上下文缺失）
    const filterMgr: any = (() => {
      try {
        return new FilterManager(form);
      } catch (e) {
        return { bindToTarget() {} } as any;
      }
    })();
    form.context.defineProperty('filterManager', { value: filterMgr });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="EditForm + JSItem（抽屉预览）">
              <FlowModelRenderer model={form} showFlowSettings />
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
