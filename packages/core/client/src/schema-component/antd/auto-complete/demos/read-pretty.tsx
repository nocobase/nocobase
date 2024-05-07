
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { SchemaComponent, Plugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'boolean',
      title: 'Test',
      default: 'aaa',
      'x-decorator': 'FormItem',
      'x-component': 'AutoComplete',
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

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
