
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test1: {
      type: 'number',
      title: 'Test1',
      default: 100,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        unitConversion: 10,
      },
    },
    test2: {
      type: 'number',
      title: 'Test2',
      default: 100,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        unitConversion: 10,
        unitConversionType: '/',
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
