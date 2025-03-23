import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { AntdSchemaComponentProvider, Plugin, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import React from 'react';

const scope = [
  { label: 'v1', value: 'v1' },
  { label: 'Date', value: '$nDate', children: [{ label: 'Now', value: 'now' }] },
];

const useFormBlockProps = () => {
  return {
    form: createForm({
      initialValues: {},
    }),
  };
};

const schema = {
  type: 'object',
  'x-component': 'FormV2',
  'x-use-component-props': 'useFormBlockProps',
  properties: {
    input: {
      type: 'string',
      title: `输入项`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        variableHelperMapping: {
          rules: [
            {
              variable: '$nDate.*',
              helpers: ['date.*'],
            },
          ],
        },
      },
    },
    output: {
      type: 'void',
      title: `输出`,
      'x-decorator': 'FormItem',
      'x-component': 'OutPut',
    },
  },
};

const OutPut = observer(() => {
  const form = useForm();
  return <div>Current input value: {form.values.input}</div>;
});

const Demo = () => {
  return (
    <AntdSchemaComponentProvider>
      <SchemaComponent schema={schema} scope={{ useFormBlockProps }} components={{ OutPut }} />
    </AntdSchemaComponentProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
