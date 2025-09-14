/**
 * defaultShowCode: true
 * title: 表单：JavaScript 自定义项（JavaScriptItemModel）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { registerJsFieldDemoModels } from '../../../models/fields/js-field-model/demos/utils';
import MockAdapter from 'axios-mock-adapter';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    // 开启配置态
    this.flowEngine.flowSettings.forceEnable();

    // mock 数据源与集合
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'name', type: 'string', title: 'Name', interface: 'input' },
        { name: 'code', type: 'string', title: 'Code', interface: 'input' },
      ],
    });

    // 注册系统内常用模型（含：CreateFormModel、FormItemModel、各基础可编辑字段、Markdown/Divider 等、FormJavaScriptFieldEntryModel、FormSubmitActionModel、JavaScriptItemModel 等）
    await registerJsFieldDemoModels(this.flowEngine);

    // 创建 CreateFormModel（空表单，使用右上角 Fields 菜单添加项）
    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
        },
      },
    });

    // 注入 FilterManager（BlockModel.refresh 依赖）
    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    // 绑定 API Mock 到应用内置 APIClient（与 Application 期望类型一致）
    const mock = new MockAdapter(this.app.apiClient.axios);
    mock.onPost('users:create').reply((config) => {
      try {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
        // 简单返回提交的数据，模拟创建成功
        return [200, { data: { id: Date.now(), ...body } }];
      } catch (e) {
        return [200, { data: {} }];
      }
    });

    // 路由挂载
    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card
            style={{ margin: 12 }}
            title="Create User（添加 Fields：普通字段 / JavaScript field / JavaScript block）"
          >
            <FlowModelRenderer model={this.form} showFlowSettings />
          </Card>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
