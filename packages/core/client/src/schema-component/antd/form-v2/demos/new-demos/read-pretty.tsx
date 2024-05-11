
import { Plugin, ISchema, SchemaComponent, useFormBlockProps, FormBlockProvider } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormBlockProvider',
      'x-component-props': {
        collection: 'users',
        action: 'get',
        filterByTk: 1,
        dataSource: 'main',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormBlockProps',
          'x-pattern': 'readPretty', // 增加 x-read-pretty 属性
          properties: {
            username: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
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
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: {
    FormBlockProvider
  },
  scopes: { useFormBlockProps }
});

export default app.getRootComponent();
