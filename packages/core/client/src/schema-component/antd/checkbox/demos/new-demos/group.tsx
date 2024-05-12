


import { Plugin, SchemaComponent, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
  },
];

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test: {
      type: 'array',
      title: 'Test',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();

