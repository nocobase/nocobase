import { AntdSchemaComponentProvider, Plugin, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import React from 'react';

const scope = [
  { label: 'v1', value: 'v1' },
  { label: 'Date', value: '$date', children: [{ label: 'Now', value: 'now' }] },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `替换模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
      },
    },
  },
};

const Demo = () => {
  return (
    <AntdSchemaComponentProvider>
      <SchemaComponent schema={schema} />
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
