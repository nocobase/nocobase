/**
 * defaultShowCode: true
 * title: 表格列：阈值预警（JSFieldModel）
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-threshold'));
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'score', type: 'double', title: 'Score' },
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
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'score' } },
            },
            subModels: {
              field: {
                use: 'JSFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'score' } },
                  jsSettings: {
                    runJs: {
                      code: `
const v = Number(ctx.value ?? 0);
const danger = v < 40; const warn = v >= 40 && v < 70; const ok = v >= 70;
const color = danger ? '#ff4d4f' : warn ? '#faad14' : '#52c41a';
const icon = danger ? '⚠️' : warn ? '🛈' : '✔️';
const tip = danger ? '低于阈值 40' : warn ? '建议提升' : '达标';
ctx.element.innerHTML = '<span title="'+tip+'" style="color:'+color+';font-weight:600">'+icon+' '+v+'</span>';
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
          <Card style={{ margin: 12 }} title="Users（JS 列：Score 阈值预警）">
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
