
import React from 'react';
import {
  TableBlockProvider,
  useTableBlockProps,
  SchemaComponent,
  Plugin,
  ISchema
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'roles', // roles 表
        action: 'list', // 获取 roles 的列表
        params: {
          pageSize: 2,
        },
        showIndex: true,
        dragSort: false,
      },
      properties: {
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps', // 自动注入 Table 所需的 props
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Role UID',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty', // 这里要设置为 true
                },
              },
            },
            column2: {
              type: 'void',
              title: 'Role name',
              'x-component': 'TableV2.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
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
  plugins: [DemoPlugin],
  components: {
    TableBlockProvider,
  },
  scopes: {
    useTableBlockProps,
  },
});

export default app.getRootComponent();
