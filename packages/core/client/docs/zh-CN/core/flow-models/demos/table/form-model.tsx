import { FormButtonGroup, FormDialog, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { FlowModel } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    aaa: {
      type: 'string',
      title: 'input box 1',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    bbb: {
      type: 'string',
      title: 'input box 2',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    ccc: {
      type: 'string',
      title: 'input box 3',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    ddd: {
      type: 'string',
      title: 'input box 4',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};

export class FormModel extends FlowModel {
  SchemaField: any;
  form: Form;
  render() {
    return (
      <div>
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
      </div>
    );
  }

  async openEditDialog() {
    await this.applyAutoFlows();
    const dialog = FormDialog('Pop-up form', () => {
      return this.render();
    });
    await dialog.open({});
  }
}

FormModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.model.SchemaField = createSchemaField({
          components: {
            Input,
            FormItem,
          },
        });
        ctx.model.form = createForm();
        ctx.model.setProps('schema', schema);
      },
    },
  },
});
