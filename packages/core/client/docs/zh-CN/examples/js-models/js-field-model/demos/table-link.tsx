/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表格列：动态链接（JSFieldModel）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { registerJsFieldDemoModels } from './utils';
import { Card } from 'antd';
import { api } from './api';
import { MockFlowModelRepository } from '@nocobase/client';

class DemoPlugin extends Plugin {
  table: any;
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-link'));
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'name', type: 'string', title: 'Name', interface: 'input' },
        { name: 'meta', type: 'json', title: 'Meta', interface: 'json' },
      ],
    });

    await registerJsFieldDemoModels(this.flowEngine);

    this.table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        columns: [
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
            },
            subModels: {
              field: {
                use: 'JSFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                  jsSettings: {
                    runJs: {
                      code: `
// 读取当前行 record.meta.email，渲染 mailto 链接
const email = ctx.record?.meta?.email || '';
const name = String(ctx.value ?? '');
const href = email ? 'mailto:'+email : '#';
ctx.element.innerHTML = '<a href="'+href+'" style="text-decoration:underline;">'+name+'</a>';
                      `.trim(),
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    this.table.context.defineProperty('filterManager', { value: new FilterManager(this.table) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="Users（JS 列：Name → mailto 链接）">
            <FlowModelRenderer model={this.table} showFlowSettings />
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
