/**
 * defaultShowCode: true
 * title: DetailsBlock + JSFieldModel（金额格式化）
 */

import {
  Application,
  DetailsBlockModel,
  DetailsGridModel,
  DetailsItemModel,
  DisplayTextFieldModel,
  JSFieldModel,
  FilterManager,
  MockFlowModelRepository,
  Plugin,
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
  const rec = { id: 1, title: 'Order-001', price: 199.0, discount: 0.15, status: 'pending' };
  mock.onGet('orders:get').reply((config) => {
    const id = Number((config as any).params?.filterByTk);
    return [200, { data: id === 1 ? rec : null }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsfield-details:'));
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
        { name: 'discount', type: 'double', interface: 'number', title: 'Discount' },
        { name: 'status', type: 'string', interface: 'input', title: 'Status' },
      ],
    });

    const details = this.flowEngine.createModel({
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', filterByTk: 1 } },
      },
      subModels: {
        grid: {
          use: 'DetailsGridModel',
          subModels: {
            items: [
              // 标题（普通显示）
              {
                use: 'DetailsItemModel',
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
              // 价格（JSField 格式化 + 折扣说明）
              {
                use: 'DetailsItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'price' } },
                },
                subModels: {
                  field: {
                    use: 'JSFieldModel',
                    stepParams: {
                      jsSettings: {
                        runJs: {
                          code: `
const price = Number(ctx.value ?? ctx.record?.price) || 0;
const discount = Number(ctx.record?.discount || 0);
const finalPrice = price * (1 - discount);
const fmt = (n) => '¥' + (Number(n) || 0).toFixed(2);

ctx.element.innerHTML =
  '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,system-ui,Roboto,sans-serif;">' +
    '<div><strong>应付金额：</strong><span style="color:#52c41a;">' + fmt(finalPrice) + '</span></div>' +
    '<div style="color:#999">原价 ' + fmt(price) + '，折扣 ' + (discount * 100).toFixed(0) + '%</div>' +
  '</div>';
                          `.trim(),
                        },
                      },
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
        return new FilterManager(details);
      } catch (e) {
        return { bindToTarget() {} } as any;
      }
    })();
    details.context.defineProperty('filterManager', { value: filterMgr });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="详情页 + JSField（金额格式化）">
              <FlowModelRenderer model={details} showFlowSettings />
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
