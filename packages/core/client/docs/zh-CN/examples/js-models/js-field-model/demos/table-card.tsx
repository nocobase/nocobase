/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表格列：摘要卡片（JSFieldModel）
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
    this.flowEngine.flowSettings.enable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-card'));
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
        { name: 'status', type: 'string', title: 'Status' },
        { name: 'meta', type: 'json', title: 'Meta' },
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
const name = String(ctx.value ?? '');
const status = String(ctx.record?.status ?? '').toLowerCase();
const city = String(ctx.record?.meta?.city ?? '');
const dot = status==='active'?'#52c41a':status==='pending'?'#faad14':'#ff4d4f';
ctx.element.innerHTML = [
  '<div style="display:flex;align-items:center;gap:8px">',
  '  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+dot+'"></span>',
  '  <div style="line-height:1">',
  '    <div style="font-weight:600">'+name+'</div>',
  '    <div style="font-size:12px;color:#999">'+(city||'-')+'</div>',
  '  </div>',
  '</div>'
].join('');
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
          <Card style={{ margin: 12 }} title="Users（JS 列：摘要卡片）">
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
