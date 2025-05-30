import { FormButtonGroup, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelComponent } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: 'input box',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
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

class HelloFlowModel extends FlowModel {
  SchemaField: any;
  form: Form;

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
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });
    const model = this.flowEngine.createModel({
      use: 'HelloFlowModel',
      props: {
        schema,
      },
    });
    this.router.add('root', { path: '/', element: <FlowModelComponent model={model} /> });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
