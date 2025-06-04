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
import { CreateSubmitActionFlowModel } from './CreateSubmitActionFlowModel';

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

export class FormBlockFlowModel extends BlockFlowModel {
  SchemaField: any;
  form: Form;
  actions: Array<CreateSubmitActionFlowModel> = observable.shallow([]);

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
    this.flowEngine.registerAction({
      name: 'showConfirm',
      title: '显示确认弹窗',
      uiSchema: {
        title: {
          type: 'string',
          title: '弹窗标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        message: {
          type: 'string',
          title: '弹窗内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      handler: async (ctx, params) => {
        return new Promise((resolve) => {
          Modal.confirm({
            title: params.title,
            content: params.message,
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
              ctx.exit();
            },
          });
        });
      },
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
                use: 'CreateSubmitActionFlowModel',
                stepParams: {
                  actionPropsFlow: {
                    setProps: {
                      title: compile(item.title),
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
            onClick: (info) => {},
            items: [{ key: 'field', label: 'Field' }],
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
