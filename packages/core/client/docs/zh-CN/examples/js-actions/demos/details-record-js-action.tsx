/**
 * defaultShowCode: true
 * title: 详情工具栏 JS Action（记录级）
 */
import {
  Application,
  DetailsBlockModel,
  DetailsGridModel,
  JSRecordActionModel,
  Plugin,
  RecordActionModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { FilterManager } from '@nocobase/client';
import { setupApiMock } from './api';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    // 将 mock 安装到应用自带的 APIClient 上
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
      DetailsBlockModel,
      DetailsGridModel,
      RecordActionModel,
      JSRecordActionModel,
    });

    const details = this.flowEngine.createModel({
      use: 'DetailsBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users', filterByTk: 1 } } },
      subModels: {
        grid: { use: 'DetailsGridModel' },
        actions: [
          {
            use: 'JSRecordActionModel',
            stepParams: {
              buttonSettings: { general: { title: 'JS action' } },
              clickSettings: {
                runJs: {
                  code: `if (!ctx.record) ctx.message.error('无记录'); else ctx.message.success('ID：' + (ctx.filterByTk ?? ctx.record?.id));`,
                },
              },
            },
          },
        ],
      },
    }) as DetailsBlockModel;

    // 绑定 FilterManager，避免刷新链路依赖报错
    details.context.defineProperty('filterManager', { value: new FilterManager(details) });

    const Page = () => (
      <div style={{ padding: 16 }}>
        <Card title="记录级 JS Action">
          <FlowModelRenderer model={details} showFlowSettings />
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
