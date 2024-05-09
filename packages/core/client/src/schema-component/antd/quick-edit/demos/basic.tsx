
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, BlockSchemaComponentPlugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormBlockProvider',
  'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
  'x-decorator-props': {
    collection: 'users',
  },
  'x-component': 'FormV2',
  'x-use-component-props': 'useCreateFormBlockProps',
  properties: {
    nickname: {
      default: 'aaa',
      'x-collection-field': 'roles.long-text',
      'x-component': 'CollectionField',
      'x-component-props': {
        ellipsis: true,
      },
      'x-decorator': 'QuickEdit',
      'x-decorator-props': {
        labelStyle: {
          display: 'none',
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
