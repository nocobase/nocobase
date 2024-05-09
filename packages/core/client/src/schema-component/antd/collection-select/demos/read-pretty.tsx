
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-component': 'ShowFormData',
  'x-decorator': 'FormV2',
  'x-read-pretty': true,
  properties: {
    test: {
      type: 'string',
      default: 'users',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
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
