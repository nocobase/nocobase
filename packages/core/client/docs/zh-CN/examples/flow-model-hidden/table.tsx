/**
 * defaultShowCode: true
 * title: TableModel - hidden 简明示例
 */

import React from 'react';
import {
  Application,
  Plugin,
  TableModel,
  TableColumnModel,
  TableActionsColumnModel,
  CollectionActionModel,
  RecordActionModel,
  ReadPrettyFieldModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space, Switch } from 'antd';
import { api } from './api';
import { FilterManager } from '../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';

class DemoPlugin extends Plugin {
  table!: TableModel;
  topAction!: CollectionActionModel;
  rowAction!: RecordActionModel;
  col!: TableColumnModel;

  async load() {
    // 配置模式 + API mock + 最小数据源/集合（使用 enable，允许在页面内切换开关）
    this.flowEngine.flowSettings.enable();
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'username', type: 'string', title: 'Username' },
      ],
    });

    this.flowEngine.registerModels({
      TableModel,
      TableColumnModel,
      TableActionsColumnModel,
      CollectionActionModel,
      RecordActionModel,
      ReadPrettyFieldModel,
    });

    // 一个顶栏动作 + 一个行内动作 + 一个字段列
    this.table = this.flowEngine.createModel({
      use: 'TableModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        actions: [{ use: 'CollectionActionModel', stepParams: { buttonSettings: { general: { title: 'Delete' } } } }],
        columns: [
          {
            use: 'TableActionsColumnModel',
            subModels: {
              actions: [{ use: 'RecordActionModel', stepParams: { buttonSettings: { general: { title: 'View' } } } }],
            },
          },
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
            },
            subModels: {
              field: {
                use: 'ReadPrettyFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
                },
              },
            },
          },
        ],
      },
    }) as TableModel;

    this.topAction = (this.table.subModels as any).actions[0] as CollectionActionModel;
    this.rowAction = ((this.table.subModels as any).columns[0].subModels as any).actions[0] as RecordActionModel;
    this.col = (this.table.subModels as any).columns[1] as TableColumnModel;

    // 提供 filterManager，避免刷新流程绑定时报错
    this.table.context.defineProperty('filterManager', { value: new FilterManager(this.table) });

    const Page = () => {
      const [cfg, setCfg] = React.useState(false);
      const [hideBlock, setHideBlock] = React.useState(false);
      const [hideTop, setHideTop] = React.useState(false);
      const [hideRow, setHideRow] = React.useState(false);
      const [hideCol, setHideCol] = React.useState(false);
      return (
        <div style={{ padding: 16 }}>
          <div>
            <span>配置模式</span>
            <Switch
              checked={cfg}
              onChange={(v) => {
                setCfg(v);
                v ? this.flowEngine.flowSettings.enable() : this.flowEngine.flowSettings.disable();
              }}
            />
          </div>
          <Card style={{ marginTop: 12 }} title="表格区块（Block）">
            <div style={{ marginBottom: 8 }}>
              <span>隐藏区块</span>
              <Switch checked={hideBlock} onChange={(v) => (setHideBlock(v), this.table.setHidden(v))} />
            </div>
            <FlowModelRenderer model={this.table} showFlowSettings />
          </Card>
          <Card title="列与动作（Column/Action）">
            <div style={{ marginBottom: 8 }}>
              <span>隐藏顶栏动作</span>
              <Switch checked={hideTop} onChange={(v) => (setHideTop(v), this.topAction.setHidden(v))} />
              <span>隐藏行内动作</span>
              <Switch checked={hideRow} onChange={(v) => (setHideRow(v), this.rowAction.setHidden(v))} />
              <span>隐藏列 Username</span>
              <Switch checked={hideCol} onChange={(v) => (setHideCol(v), this.col.setHidden(v))} />
            </div>
            <FlowModelRenderer model={this.table} showFlowSettings />
          </Card>
        </div>
      );
    };

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
