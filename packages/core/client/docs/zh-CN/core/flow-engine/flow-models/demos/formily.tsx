import { FormButtonGroup, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelComponent, FlowsSettings } from '@nocobase/flow-engine';
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

class FormilyFlowModel extends FlowModel {
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

FormilyFlowModel.registerFlow('defaultFlow', {
  autoApply: true,
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
      async handler(ctx, model: FormilyFlowModel, params) {
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

class PluginFormilyModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ FormilyFlowModel });
    const model = this.flowEngine.createModel({
      use: 'FormilyFlowModel',
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
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelComponent model={model} />
          <br />
          <FlowsSettings model={model} />
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFormilyModel],
});

export default app.getRootComponent();
