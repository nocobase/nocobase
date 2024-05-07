
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
    test: {
      type: 'boolean',
      title: 'Test',
      default: 1,
      'x-decorator': 'FormItem',
      'x-component': 'RemoteSelect',
      'x-component-props': {
        fieldNames: {
          label: 'title',
          value: 'id',
        },
        service: {
          resource: 'posts',
          action: 'list',
        },
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
  apis: {
    'posts:list': {
      data: [
        {
          id: 1,
          title: 'title1',
        },
        {
          id: 2,
          title: 'title2',
        },
      ],
    },
  },
  delayResponse: 300,
});

export default app.getRootComponent();
