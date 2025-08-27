/**
 * defaultShowCode: true
 * title: TableModel - hidden 行为（Block/Column/Actions）
 */

import React from 'react';
import {
  ActionModel,
  Application,
  CollectionActionModel,
  Plugin,
  RecordActionModel,
  TableActionsColumnModel,
  TableColumnModel,
  TableCustomColumnModel,
  TableModel,
  ReadPrettyFieldModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space, Switch, Tag, Typography } from 'antd';

import { api } from '../../core/flow-models/demos/table/api';
import { FilterManager } from '../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';

const { Text } = Typography;

class HiddenTableDemo extends Plugin {
  tableModel: TableModel;
  topAction: CollectionActionModel;
  rowAction: RecordActionModel;
  usernameColumn: TableColumnModel;

  async load() {
    // 仅 mock API；将上下文 api 指向 mock 实例
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    let ds = dsm.getDataSource('main');
    if (!ds) {
      dsm.addDataSource({ key: 'main', displayName: 'Main' });
      ds = dsm.getDataSource('main');
    }
    ds!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'username', type: 'string', title: 'Username' },
        { name: 'nickname', type: 'string', title: 'Nickname' },
      ],
    });

    this.flowEngine.registerModels({
      TableModel,
      TableColumnModel,
      TableCustomColumnModel,
      TableActionsColumnModel,
      ActionModel,
      CollectionActionModel,
      RecordActionModel,
      ReadPrettyFieldModel,
    });

    this.tableModel = this.flowEngine.createModel({
      use: 'TableModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } },
        tableSettings: {},
      },
      subModels: {
        actions: [
          {
            use: 'CollectionActionModel',
            stepParams: { buttonSettings: { general: { title: 'Delete' } } },
            props: { position: 'right' },
          },
        ],
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
              fieldSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'users',
                  fieldPath: 'username',
                },
              },
              tableColumnSettings: {
                fieldSettings: {
                  init: {
                    dataSourceKey: 'main',
                    collectionName: 'users',
                    fieldPath: 'username',
                  },
                },
              },
            },
            subModels: {
              field: {
                use: 'ReadPrettyFieldModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                      fieldPath: 'username',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }) as TableModel;

    this.topAction = (this.tableModel.subModels as any).actions[0] as ActionModel as CollectionActionModel;
    const actionsCol = (this.tableModel.subModels as any).columns[0] as TableActionsColumnModel;
    this.rowAction = (actionsCol.subModels as any).actions[0] as ActionModel as RecordActionModel;
    this.usernameColumn = (this.tableModel.subModels as any).columns[1] as TableColumnModel;

    // 提供 filterManager 到当前区块上下文，避免 refreshSettings 绑定时报错
    this.tableModel.context.defineProperty('filterManager', { value: new FilterManager(this.tableModel) });

    const DemoPage: React.FC = () => {
      const [configMode, setConfigMode] = React.useState<boolean>(this.flowEngine.flowSettings.enabled);
      const [blockHidden, setBlockHidden] = React.useState(false);
      const [topActionHidden, setTopActionHidden] = React.useState(false);
      const [rowActionHidden, setRowActionHidden] = React.useState(false);
      const [columnHidden, setColumnHidden] = React.useState(false);

      const setConfig = (v: boolean) => {
        setConfigMode(v);
        v ? this.flowEngine.flowSettings.enable() : this.flowEngine.flowSettings.disable();
      };
      const toggleHidden = (setter: (v: boolean) => void, v: boolean, model: any) => {
        setter(v);
        model.setHidden(v);
      };

      return (
        <div style={{ padding: 16 }}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space>
              <Text strong>配置模式</Text>
              <Switch checked={configMode} onChange={setConfig} />
              <Tag color={configMode ? 'blue' : 'default'}>
                {configMode ? 'flowSettings.enabled = true' : 'flowSettings.enabled = false'}
              </Tag>
            </Space>
          </Card>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="BlockModel（表格区块）">
              <Space>
                <Text>隐藏表格区块</Text>
                <Switch checked={blockHidden} onChange={(v) => toggleHidden(setBlockHidden, v, this.tableModel)} />
              </Space>
              <div style={{ marginTop: 8 }}>
                <FlowModelRenderer
                  model={this.tableModel}
                  showFlowSettings
                  hiddenFallback={
                    <div style={{ padding: 8, background: '#fffbe6', border: '1px dashed #faad14', color: '#faad14' }}>
                      占位：无权限查看表格
                    </div>
                  }
                />
              </div>
            </Card>

            <Card size="small" title="Column / Actions（表格内隐藏）">
              <Space wrap>
                <Space>
                  <Text>隐藏顶栏动作 Delete</Text>
                  <Switch
                    checked={topActionHidden}
                    onChange={(v) => toggleHidden(setTopActionHidden, v, this.topAction)}
                  />
                </Space>
                <Space>
                  <Text>隐藏行内动作 View</Text>
                  <Switch
                    checked={rowActionHidden}
                    onChange={(v) => toggleHidden(setRowActionHidden, v, this.rowAction)}
                  />
                </Space>
                <Space>
                  <Text>隐藏列 Username</Text>
                  <Switch
                    checked={columnHidden}
                    onChange={(v) => toggleHidden(setColumnHidden, v, this.usernameColumn)}
                  />
                </Space>
              </Space>
              <div style={{ marginTop: 8 }}>
                <FlowModelRenderer model={this.tableModel} showFlowSettings />
              </div>
            </Card>
          </Space>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <DemoPage />
        </FlowEngineProvider>
      ),
    });
  }
}

const app = new Application({ router: { type: 'memory', initialEntries: ['/'] }, plugins: [HiddenTableDemo] });
export default app.getRootComponent();
