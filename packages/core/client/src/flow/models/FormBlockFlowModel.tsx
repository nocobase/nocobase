/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { observable } from '@formily/reactive';
import { FormButtonGroup, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { uid } from '@formily/shared';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import * as icons from '@ant-design/icons';
import { FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Button, Modal, Space, Dropdown } from 'antd';
import { FlowPage, FlowPageComponent } from '../FlowPage';
import { BlockFlowModel } from './BlockFlowModel';
import { createFormActionInitializers } from '../../modules/blocks/data-blocks/form/createFormActionInitializers';
import { useCompile } from '../../schema-component';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: 'input box',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: 'Hello, NocoBase!',
      required: true,
      'x-component-props': {
        style: {
          width: 240,
        },
      },
    },
    textarea: {
      type: 'string',
      title: 'text box',
      required: true,
      default: 'This is a text box.',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        style: {
          width: 400,
        },
      },
    },
  },
};

const initParams = {
  use: 'FormBlockFlowModel',
  stepParams: {
    defaultFlow: {
      step1: {
        schema: JSON.stringify(schema, null, 2),
      },
    },
  },
};
export class ActionFlowModel extends FlowModel {
  render() {
    return (
      <Button
        onClick={() => {
          this.dispatchEvent('onClick');
        }}
        {...this.props}
      />
    );
  }
}
// 属性流
ActionFlowModel.registerFlow({
  key: 'actionPropsFlow',
  title: '按钮配置',
  auto: true,
  steps: {
    setProps: {
      title: '按钮属性设置',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-component': 'Input',
        },
        type: {
          type: 'string',
          title: '类型',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
      },
      defaultParams: {
        type: 'primary',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        console.log('Setting props:', params);
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
      },
    },
  },
});
// 事件流
ActionFlowModel.registerFlow({
  key: 'actionEventFlow',
  on: {
    eventName: 'onClick',
  },
  title: '按钮事件',
  steps: {
    confirm: {
      title: '确认操作配置',
      uiSchema: {
        title: {
          type: 'string',
          title: '弹窗提示标题',
          'x-component': 'Input',
        },
        content: {
          type: 'string',
          title: '弹窗提示内容',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: '确认操作',
        content: '你点击了按钮，是否确认？',
      },
      handler(ctx, params) {
        Modal.confirm({
          ...params,
        });
      },
    },
  },
});

export class FormBlockFlowModel extends BlockFlowModel {
  SchemaField: any;
  form: Form;
  actions: Array<ActionFlowModel> = observable.shallow([]);

  static getInitParams() {
    return initParams;
  }

  onInit(options: any): void {
    this.SchemaField = createSchemaField({
      components: {
        Input,
        FormItem,
      },
    });
    this.form = createForm();
    const { actions = [] } = options;
    actions.forEach((action) => {
      this.addSubModel('actions', action);
    });
  }
  addAction(action) {
    const model = this.addSubModel('actions', action);
    model.save();
  }

  renderActions() {
    const { items } = createFormActionInitializers?.options || {};
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const compile = useCompile();
    return (
      <Space style={{ marginTop: '10px' }}>
        {this.actions.map((action) => {
          return <FlowModelRenderer key={action.uid} model={action} showFlowSettings={true} />;
        })}
        <Dropdown
          menu={{
            onClick: (info) => {
              const item = items.find((v) => v.name === info.key);
              this.addAction({
                use: 'ActionFlowModel',
                stepParams: {
                  actionPropsFlow: {
                    setProps: {
                      title: item.title,
                      type: 'primary',
                    },
                  },
                },
              });
            },
            items: items.map((v) => {
              return {
                ...v,
                key: v.name,
                label: compile(v.title),
              };
            }) as any,
          }}
        >
          <Button>Add action</Button>
        </Dropdown>
      </Space>
    );
  }

  renderFields() {
    return (
      <>
        <this.SchemaField schema={this.props.schema} />
        <Dropdown
          menu={{
            onClick: (info) => {
              this.addAction({
                use: 'ActionFlowModel',
                props: {
                  children: `新字段 ${uid()}`,
                },
              });
            },
            items: [{ key: 'submit', label: 'Submit' }],
          }}
        >
          <Button>Add field</Button>
        </Dropdown>
      </>
    );
  }

  render() {
    return (
      <Card>
        <FormProvider form={this.form}>
          {this.renderFields()}
          <FormButtonGroup>{this.renderActions()}</FormButtonGroup>
          <br />
          <Card>
            <pre>{JSON.stringify(this.form.values, null, 2)}</pre>
          </Card>
        </FormProvider>
      </Card>
    );
  }
}

FormBlockFlowModel.define({
  title: 'Form',
  group: 'Content',
  defaultOptions: {
    use: 'FormBlockFlowModel',
    stepParams: {
      defaultFlow: {
        step1: {
          schema: JSON.stringify(schema, null, 2),
        },
      },
    },
  },
});

FormBlockFlowModel.registerFlow<FormBlockFlowModel>('defaultFlow', {
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        schema: {
          type: 'string',
          title: 'Formily Schema',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            autoSize: true,
          },
        },
      },
      async handler(ctx, params) {
        try {
          ctx.model.setProps('schema', JSON.parse(params.schema));
          ctx.model.form.clearFormGraph();
        } catch (error) {
          // skip
        }
      },
    },
  },
});
