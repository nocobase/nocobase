/**
 * defaultShowCode: true
 * title: CreateFormModel - hidden 行为（Field/Action/Block）
 */

import React from 'react';
import {
  Application,
  CollectionFieldFormItemModel,
  CreateFormModel,
  FormActionModel,
  FormFieldGridModel,
  FormSubmitActionModel,
  FormFieldModel,
  Plugin,
} from '@nocobase/client';
import { FlowModelRenderer, FlowEngineProvider } from '@nocobase/flow-engine';
import { Card, Space, Switch, Tag, Typography } from 'antd';
import { api } from '../../core/flow-models/demos/table/api';
import { FilterManager } from '../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';

const { Text } = Typography;

class HiddenFormDemo extends Plugin {
  formModel: CreateFormModel;
  usernameItem: CollectionFieldFormItemModel;
  nicknameItem: CollectionFieldFormItemModel;
  submitAction: FormSubmitActionModel;

  async load() {
    // 仅 mock API；将上下文 api 指向 mock 实例
    this.flowEngine.context.defineProperty('api', { value: api });

    // 添加数据源与集合
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

    // 注册所需模型
    this.flowEngine.registerModels({
      // 表单
      CreateFormModel,
      FormFieldGridModel,
      CollectionFieldFormItemModel,
      FormFieldModel,
      FormActionModel,
      FormSubmitActionModel,
    });

    // 创建 CreateFormModel，包含 grid(items) + actions
    this.formModel = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } },
        formSettings: { init: {} },
      },
      subModels: {
        grid: {
          use: 'FormFieldGridModel',
          subModels: {
            items: [
              {
                use: 'CollectionFieldFormItemModel',
                stepParams: {
                  editItemSettings: {
                    init: {},
                    label: {},
                  },
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                      fieldPath: 'username',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'FormFieldModel',
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
              {
                use: 'CollectionFieldFormItemModel',
                stepParams: {
                  editItemSettings: {
                    init: {},
                    label: {},
                  },
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                      fieldPath: 'nickname',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'FormFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'users',
                          fieldPath: 'nickname',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        actions: [
          {
            use: 'FormSubmitActionModel',
            stepParams: {
              buttonSettings: { general: { title: 'Submit' } },
            },
          },
        ],
      },
    }) as CreateFormModel;

    // 拿到子模型引用
    const grid = (this.formModel.subModels as any).grid as FormFieldGridModel;
    this.usernameItem = (grid.subModels as any).items[0] as CollectionFieldFormItemModel;
    this.nicknameItem = (grid.subModels as any).items[1] as CollectionFieldFormItemModel;
    this.submitAction = (this.formModel.subModels as any).actions[0] as FormActionModel as FormSubmitActionModel;

    // 提供 filterManager，以避免 BlockModel.refreshSettings 中的绑定报错
    this.formModel.context.defineProperty('filterManager', { value: new FilterManager(this.formModel) });

    const DemoPage: React.FC = () => {
      const [configMode, setConfigMode] = React.useState<boolean>(this.flowEngine.flowSettings.enabled);
      const [blockHidden, setBlockHidden] = React.useState(false);
      const [usernameHidden, setUsernameHidden] = React.useState(false);
      const [actionHidden, setActionHidden] = React.useState(false);

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
            <Card size="small" title="BlockModel（表单区块）">
              <Space>
                <Text>隐藏表单区块</Text>
                <Switch checked={blockHidden} onChange={(v) => toggleHidden(setBlockHidden, v, this.formModel)} />
              </Space>
              <div style={{ marginTop: 8 }}>
                <FlowModelRenderer
                  model={this.formModel}
                  showFlowSettings
                  hiddenFallback={
                    <div style={{ padding: 8, background: '#fffbe6', border: '1px dashed #faad14', color: '#faad14' }}>
                      占位：无权限查看表单
                    </div>
                  }
                />
              </div>
            </Card>

            <Card size="small" title="FieldModel / ActionModel（表单内隐藏）">
              <Space wrap>
                <Space>
                  <Text>隐藏字段 username</Text>
                  <Switch
                    checked={usernameHidden}
                    onChange={(v) => toggleHidden(setUsernameHidden, v, this.usernameItem)}
                  />
                </Space>
                <Space>
                  <Text>隐藏动作 Submit</Text>
                  <Switch
                    checked={actionHidden}
                    onChange={(v) => toggleHidden(setActionHidden, v, this.submitAction)}
                  />
                </Space>
              </Space>
              <div style={{ marginTop: 8 }}>
                <FlowModelRenderer model={this.formModel} showFlowSettings />
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

const app = new Application({ router: { type: 'memory', initialEntries: ['/'] }, plugins: [HiddenFormDemo] });
export default app.getRootComponent();
