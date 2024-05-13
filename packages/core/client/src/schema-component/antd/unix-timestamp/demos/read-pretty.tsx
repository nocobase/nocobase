
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'number',
      title: 'Test',
      default: 1712016000000,
      'x-decorator': 'FormItem',
      'x-component': 'UnixTimestamp',
    },
    test2: {
      type: 'number',
      title: 'Test(accuracy: second)',
      'x-decorator': 'FormItem',
      default: 1712016000,
      'x-component': 'UnixTimestamp',
      'x-component-props': {
        accuracy: 'second',
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


