/**
 * defaultShowCode: true
 * title: 表格工具栏 JS Action（集合级）
 */
import {
  Application,
  CollectionActionModel,
  JSCollectionActionModel,
  Plugin,
  TableBlockModel,
  TableColumnModel,
  ReadPrettyFieldModel,
  FilterManager,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { setupApiMock } from './api';
import React from 'react';

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.enable();
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
      TableBlockModel,
      TableColumnModel,
      ReadPrettyFieldModel,
      CollectionActionModel,
      JSCollectionActionModel,
    });

    const table = this.flowEngine.createModel({
      use: 'TableBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        actions: [
          {
            use: 'JSCollectionActionModel',
            stepParams: {
              buttonSettings: { general: { title: 'JS action' } },
              clickSettings: {
                runJs: {
                  code: `const rows = ctx.selectedRows || ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) { ctx.message.warning('请选择数据'); } else { ctx.message.success('已选择 ' + rows.length + ' 条'); }
await ctx.refresh();`,
                },
              },
            },
          },
        ],
        columns: [
          {
            use: 'TableColumnModel',
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
        ],
      },
    }) as TableBlockModel;

    // 绑定 FilterManager（部分刷新链路依赖）
    table.context.defineProperty('filterManager', { value: new FilterManager(table) });

    const Page = () => (
      <div style={{ padding: 16 }}>
        <Card title="集合级 JS Action">
          <FlowModelRenderer model={table} showFlowSettings />
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
