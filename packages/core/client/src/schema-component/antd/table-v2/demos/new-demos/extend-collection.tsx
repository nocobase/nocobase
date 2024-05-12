
import React from 'react';
import {
  TableBlockProvider,
  useTableBlockProps,
  SchemaComponent,
  Plugin,
  ExtendCollectionsProvider,
  ISchema
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

const bookCollection = {
  key: 'book',
  name: 'book',
  title: 'book',
  fields: [
    {
      key: 'id',
      name: 'id',
      type: 'bigInt',
      interface: 'integer',
      collectionName: 'book',
      autoIncrement: true,
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-pattern': 'readPretty',
      },
    },
    {
      key: 'name',
      name: 'name',
      type: 'string',
      interface: 'input',
      description: null,
      collectionName: 'book',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: 'name',
      },
    },
    {
      key: 'rlzyzn3rke7',
      name: 'price',
      type: 'double',
      interface: 'number',
      description: null,
      collectionName: 'book',
      uiSchema: {
        'x-component-props': {
          step: '1',
          stringMode: true,
        },
        type: 'number',
        'x-component': 'InputNumber',
        title: 'price',
      },
    },
  ],
  logging: true,
  autoGenId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  template: 'general',
  view: false,
  schema: 'public',
  filterTargetKey: 'id',
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'book', // book 表
        action: 'list', // 获取 book 的列表
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
              title: 'Name',
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
              title: 'Price',
              'x-component': 'TableV2.Column',
              properties: {
                price: {
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
  return <ExtendCollectionsProvider collections={[bookCollection]}>
    <SchemaComponent schema={schema} />
  </ExtendCollectionsProvider>;
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
  apis: {
    'book:list': {
      data: [
        {
          id: 1,
          name: 'book1',
          price: 35,
        },
        {
          id: 2,
          name: 'book2',
          price: 28,
        },
      ],
      meta: {
        count: 1,
        page: 1,
        totalPage: 1,
      },
    },
  }
});

export default app.getRootComponent();
