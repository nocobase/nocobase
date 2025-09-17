/**
 * defaultShowCode: true
 * title: CreateForm + JSItemModel（实时预览与联动）
 */

import {
  Application,
  CreateFormModel,
  FormGridModel,
  FormItemModel,
  JSItemModel,
  JSEditableFieldModel,
  NumberFieldModel,
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
  // 简单写入/读取接口（本例 CreateForm 不调用刷新，仅占位）
  mock.onPost('orders:create').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    return [200, { data: { id: Date.now(), ...data } }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    // 强制开启 Flow 设置模式（演示时方便查看“JavaScript settings”）
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsitem-create:'));

    // 提供 API 与 mock
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    // 数据源与集合
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

    // 注册所需模型
    const form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } },
      },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 标题
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: '商品1' },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' },
                      },
                    },
                  },
                },
              },
              // 价格
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'price' },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: 100 },
                  },
                },
                subModels: {
                  field: {
                    use: 'NumberFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'price' },
                      },
                    },
                  },
                },
              },
              // 数量
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'quantity' },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: 10 },
                  },
                },
                subModels: {
                  field: {
                    use: 'NumberFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'quantity' },
                      },
                    },
                  },
                },
              },
              // 折扣
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'discount' },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: 0.2 },
                  },
                },
                subModels: {
                  field: {
                    use: 'NumberFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'discount' },
                      },
                    },
                  },
                },
              },
              // JSItem - 实时预览
              {
                use: 'JSItemModel',
                stepParams: {
                  jsSettings: {
                    runJs: {
                      code: `
const render = (values) => {
  const data = values || (ctx.form && ctx.form.getFieldsValue ? ctx.form.getFieldsValue() : {}) || {};
  const price = Number(data.price) || 0;
  const quantity = Number(data.quantity) || 1;
  const discount = Number(data.discount) || 0;
  const total = price * quantity;
  const final = total * (1 - discount);
  const fmt = (n) => '¥' + (Number(n) || 0).toFixed(2);
  ctx.element.innerHTML =
    '<div style="padding:8px 12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;">' +
    '  <div style="font-weight:600;color:#389e0d;">预计实付：' + fmt(final) + '</div>' +
    '  <div style="color:#999">小计 ' + fmt(total) + '，折扣 ' + Math.round(discount * 100) + '%</div>' +
    '</div>';
};

render(ctx.form?.getFieldsValue?.());

var registerPreviewFlow = function(){
  if (!ctx.blockModel || !ctx.model) return;
  var flowKey = 'jsItemPreview_' + ctx.model.uid;
  ctx.blockModel.registerFlow(flowKey, {
    title: '实时预览刷新',
    on: 'formValuesChange',
    steps: {
      preview: {
        async handler(flowCtx) {
          var form = flowCtx.form;
          var values = form && form.getFieldsValue ? form.getFieldsValue() : {};
          render(values);
        },
      },
    },
  });
};

registerPreviewFlow();
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
            <Card title="CreateForm + JSItem（实时预览）">
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
