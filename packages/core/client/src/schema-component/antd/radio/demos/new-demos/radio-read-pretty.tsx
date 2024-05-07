
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
      type: 'boolean',
      title: 'Test1',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio',
    },
    test2: {
      type: 'boolean',
      title: 'Test2',
      default: false,
      'x-decorator': 'FormItem',
      'x-component': 'Radio',
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
