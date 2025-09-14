/**
 * defaultShowCode: true
 * title: 表格列：状态 Emoji（JSFieldModel）
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-emoji'));
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
        { name: 'status', type: 'string', title: 'Status', interface: 'input' },
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
                use: 'DisplayTextFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                },
              },
            },
          },
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'status' } },
            },
            subModels: {
              field: {
                use: 'JSFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'status' } },
                  jsSettings: {
                    runJs: {
                      code: `
const v = String(ctx.value || '').toLowerCase();
const emoji = v === 'active' ? '✅' : v === 'pending' ? '⏳' : '⛔️';
ctx.element.innerHTML = '<span>'+emoji+' '+(ctx.value ?? '')+'</span>';
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
          <Card style={{ margin: 12 }} title="Users（JS 列：Status Emoji）">
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
