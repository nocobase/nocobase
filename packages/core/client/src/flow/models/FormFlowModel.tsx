/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, FlowsSettings } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { BlockFlowModel } from './BlockFlowModel';

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
  use: 'FormFlowModel',
  // props: {
  //   schema,
  // },
  stepParams: {
    defaultFlow: {
      step1: {
        schema: JSON.stringify(schema, null, 2),
      },
    },
  },
};

export class FormFlowModel extends BlockFlowModel {
  SchemaField: any;
  form: Form;

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
  }
  render() {
    return (
      <Card>
        <FormProvider form={this.form}>
          <this.SchemaField schema={this.props.schema} />
          <FormButtonGroup>
            <Submit onSubmit={console.log}>Submit</Submit>
          </FormButtonGroup>
          <br />
          <Card>
            <pre>{JSON.stringify(this.form.values, null, 2)}</pre>
          </Card>
        </FormProvider>
      </Card>
    );
  }
}

FormFlowModel.registerFlow('defaultFlow', {
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
      async handler(ctx, model: FormFlowModel, params) {
        try {
          model.setProps('schema', JSON.parse(params.schema));
          model.form.clearFormGraph();
        } catch (error) {
          // skip
        }
      },
    },
  },
});
