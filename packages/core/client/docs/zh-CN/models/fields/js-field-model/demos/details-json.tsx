/**
 * defaultShowCode: true
 * title: 详情：JSON 美化预览（JSFieldModel）
 */
import React from 'react';
import { Application, Plugin, FilterManager, DetailsBlockModel } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { api } from './api';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  details: DetailsBlockModel;
  async load() {
    this.flowEngine.flowSettings.forceEnable();
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

    this.details = this.flowEngine.createModel({
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users', filterByTk: 1 } },
      },
      subModels: {
        grid: {
          use: 'DetailsGridModel',
          subModels: {
            items: [
              {
                use: 'DetailsItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                },
                subModels: {
                  field: {
                    use: 'ReadPrettyFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                    },
                  },
                },
              },
              {
                use: 'DetailsItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'meta' } },
                },
                subModels: {
                  field: {
                    use: 'JSFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'meta' } },
                      jsSettings: {
                        runJs: {
                          code: `
const obj = ctx.value ?? {};
const pretty = JSON.stringify(obj, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;');
ctx.element.innerHTML = '<pre style="max-height:220px;overflow:auto;background:#f6f8fa;padding:12px;border-radius:8px">'+ pretty +'</pre>';
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

    this.details.context.defineProperty('filterManager', { value: new FilterManager(this.details) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="User Detail（JS 字段：Meta JSON 预览）">
            <FlowModelRenderer model={this.details} showFlowSettings />
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
