import { uid } from '@formily/shared';
import { Application, CreateFormModel, FormFieldGridModel, NumberEditableFieldModel, Plugin } from '@nocobase/client';
import {
  Converters,
  CreateModelOptions,
  FlowContext,
  FlowModelRenderer,
  useFlowContext,
  VariableInput,
} from '@nocobase/flow-engine';
import { Card, Space } from 'antd';
import React, { useMemo, useState } from 'react';

class PluginEditableFieldModelExample extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ CreateFormModel, NumberEditableFieldModel, FormFieldGridModel });

    // 设置mock数据源和集合
    const mainDataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');
    mainDataSource.addCollection({
      name: 'users',
      title: 'Users',
      fields: [
        {
          name: 'orgid',
          type: 'integer',
          title: 'Org ID',
          interface: 'number',
          uiSchema: {},
          defaultValue: null,
        },
      ],
    });

    const EditableFieldModelExample = () => {
      const [value, setValue] = useState(0);

      const flowContext = useFlowContext();
      flowContext.defineProperty('user', {
        value: { name: 'John', email: 'john@example.com' },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
          },
        },
      });

      // 创建完整的模型层级：CreateFormModel -> FormFieldGridModel -> NumberEditableFieldModel
      const fieldModel = useMemo(() => {
        const engine = flowContext.engine;

        // 创建完整的模型层级结构
        const createFormOptions: CreateModelOptions = {
          use: 'CreateFormModel',
          sortIndex: 5,
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
            },
          },
          subKey: 'items',
          subType: 'array',
          subModels: {
            grid: {
              use: 'FormFieldGridModel',
              subKey: 'grid',
              sortIndex: 0,
              stepParams: {},
              subType: 'object',
              subModels: {
                fields: [
                  {
                    use: 'NumberEditableFieldModel',
                    uid: uid(),
                    sortIndex: 0,
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'users',
                          fieldPath: 'orgid',
                        },
                      },
                    },
                    subKey: 'fields',
                    subType: 'array',
                  },
                ],
              },
            },
          },
        };

        const createFormModel = engine.createModel(createFormOptions);
        // createFormModel.applyAutoFlows();
        // 获取 NumberEditableFieldModel 实例
        const fieldModel = createFormModel.subModels.grid['subModels'].fields[0];

        // 确保字段已创建, 仅这个demo需要，实际场景中field会以及自动在form渲染时创建了
        // if (!fieldModel.field) {
        //   fieldModel.field = fieldModel.createField();
        // }

        return fieldModel;
      }, [flowContext]);

      const InputComponent = useMemo(() => {
        const Component = (props) => {
          const { value, onChange, ...otherProps } = props;

          React.useEffect(() => {
            if (fieldModel.field) {
              // 设置字段值
              fieldModel.field.setValue(value);

              // 设置onChange回调
              if (onChange) {
                fieldModel.field.setComponentProps({
                  onChange: (val) => onChange(val),
                });
              }
            }
          }, [value, onChange]);

          fieldModel.setProps({ ...otherProps });
          return (
            <div style={{ flexGrow: 1 }}>
              <FlowModelRenderer model={fieldModel} showFlowSettings={false} />
            </div>
          );
        };
        return Component;
      }, [fieldModel]);

      const getMetaTree = () => {
        const baseMetaTree = flowContext.getPropertyMetaTree();
        baseMetaTree.splice(0, 0, {
          name: 'NumberField',
          title: 'Number Field',
          type: 'number',
          render: InputComponent,
        });
        return baseMetaTree;
      };

      const converters: Converters = {
        resolveValueFromPath: (item) => {
          if (item?.paths[0] === 'NumberField' || !item) {
            return 0;
          }
          return undefined;
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="利用某个表格中的数字字段组件作为变量输入框" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <VariableInput
                value={value}
                onChange={setValue}
                metaTree={getMetaTree}
                converters={converters}
                style={{ width: 300 }}
              />
              <div>
                <code>{JSON.stringify(value)}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <EditableFieldModelExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginEditableFieldModelExample],
});

export default app.getRootComponent();
