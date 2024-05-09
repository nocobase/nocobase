
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, BlockSchemaComponentPlugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'List.Decorator',
  'x-use-decorator-props': 'useListBlockDecoratorProps',
  'x-decorator-props': {
    collection: 'roles',
    dataSource: 'main',
    action: 'list',
    params: {
      pageSize: 10,
    },
  },
  'x-component': 'CardItem',
  properties: {
    list: {
      type: 'array',
      'x-component': 'List',
      properties: {
        item: {
          type: 'object',
          'x-component': 'List.Item',
          'x-read-pretty': true,
          'x-use-component-props': 'useListItemProps',
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
              'x-index': 1,
            },
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-decorator': 'FormItem',
              'x-index': 2,
            },
          },
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
  plugins: [DemoPlugin, BlockSchemaComponentPlugin],
  designable: true,
});

export default app.getRootComponent();
