import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    separator: {
      type: 'string',
      title: 'Separator',
      default: '0,0.00',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        {
          value: '0,0.00',
          label: '100,000.00',
        },
        {
          value: '0.0,00',
          label: '100.000,00',
        },
        {
          value: '0 0,00',
          label: '100 000.00',
        },
        {
          value: '0.00',
          label: '100000.00',
        },
      ],
    },
    test2: {
      type: 'number',
      title: 'Test2',
      default: 1234567.89,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-pattern': 'readPretty',
      'x-reactions': {
        dependencies: ['separator'],
        fulfill: {
          schema: {
            'x-component-props': {
              separator: '{{$deps[0]}}',
              step: 0.01,
            },
          },
        },
      },
    },
  },
};
const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
