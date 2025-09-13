/**
 * defaultShowCode: true
 * title: 表格列：迷你趋势（JSFieldModel，Unicode 条形）
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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('jsfield-demo:table-sparkline'));
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
// 以 id 生成稳定的“伪历史序列”，用 Unicode "▁▂▃▄▅▆▇" 渲染迷你趋势
const id = Number(ctx.record?.id || 1);
const base = Number(ctx.value ?? 0);
const seq = Array.from({length: 10}).map((_,i)=> ( (id*17 + i*13 + base) % 100 ));
const min = Math.min(...seq), max = Math.max(...seq) || 1;
const blocks = ['▁','▂','▃','▄','▅','▆','▇'];
const str = seq.map(v=> blocks[Math.max(0, Math.min(6, Math.floor((v-min)/(max-min+1e-6)*6)))]).join('');
ctx.element.innerHTML = '<span style="font-size:14px;letter-spacing:1px;color:#666">'+str+'</span>';
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
          <Card style={{ margin: 12 }} title="Users（JS 列：迷你趋势）">
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
