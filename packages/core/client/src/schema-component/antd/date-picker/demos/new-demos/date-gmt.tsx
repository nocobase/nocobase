
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test1: {
      type: 'string',
      default: '2024-01-01 10:10:10',
      title: 'Test1',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        gmt: true,
      },
    },
    test2: {
      type: 'string',
      default: '2024-01-01 10:10:10',
      title: 'Test2',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true,
        gmt: true,
      },
    },
  },
}

const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();


