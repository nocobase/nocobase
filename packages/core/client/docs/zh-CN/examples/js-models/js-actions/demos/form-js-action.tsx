/**
 * defaultShowCode: true
 * title: 表单工具栏 JS Action（表单级）
 */
import {
  Application,
  FormActionModel,
  FormGridModel,
  FormItemModel,
  CreateFormModel,
  InputFieldModel,
  JSFormActionModel,
  Plugin,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    // 注入 mock API（安装到应用 APIClient）
    const { setupApiMock } = await import('./api');
    setupApiMock(this.app.apiClient);
    const dsm = this.flowEngine.context.dataSourceManager;
    if (!dsm.getDataSource('main')) {
      dsm.addDataSource({ key: 'main', displayName: 'Main' });
    }
    const ds = dsm.getDataSource('main')!;
    if (!ds.getCollection('users')) {
      ds.addCollection({
        name: 'users',
        title: 'Users',
        filterTargetKey: 'id',
        fields: [
          { name: 'id', type: 'bigInt', title: 'ID' },
          { name: 'name', type: 'string', title: 'Name' },
        ],
      });
    }

    this.flowEngine.registerModels({
      CreateFormModel,
      FormGridModel,
      FormItemModel,
      InputFieldModel,
      FormActionModel,
      JSFormActionModel,
    });

    const form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                },
                subModels: { field: { use: 'InputFieldModel' } },
              },
            ],
          },
        },
        actions: [
          {
            use: 'JSFormActionModel',
            stepParams: {
              buttonSettings: { general: { title: 'JS action' } },
              clickSettings: {
                runJs: { code: `const v = ctx.form?.getFieldValue?.(['name']); ctx.message.success('name=' + v);` },
              },
            },
          },
        ],
      },
    });

    // 绑定 FilterManager，避免刷新链路依赖报错
    const { FilterManager } = await import('@nocobase/client');
    form.context.defineProperty('filterManager', { value: new FilterManager(form) });

    const Page = () => (
      <div style={{ padding: 16 }}>
        <Card title="表单级 JS Action">
          <FlowModelRenderer model={form} showFlowSettings />
        </Card>
      </div>
    );

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Page />
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
