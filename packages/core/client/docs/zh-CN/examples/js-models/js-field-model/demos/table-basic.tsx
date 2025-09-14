/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表格列：按值着色渲染（JSFieldModel）
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-basic'));
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
        { name: 'score', type: 'double', title: 'Score', interface: 'number' },
      ],
    });

    await registerJsFieldDemoModels(this.flowEngine);

    this.table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        columns: [
          // 常规列：Name
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
          // JS 列：Status → 彩色标签渲染
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
const color = v === 'active' ? '#52c41a' : v === 'pending' ? '#faad14' : '#ff4d4f';
ctx.element.innerHTML = 
  '<span style="display:inline-block;padding:0 8px;border-radius:10px;background:'+color+'20;color:'+color+';font-weight:600;">'
  + (ctx.value ?? '') + '</span>';
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

    // 提供 filterManager，避免刷新流程绑定时报错
    this.table.context.defineProperty('filterManager', { value: new FilterManager(this.table) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="Users（JS 列：Status 彩色标签）">
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
