import React from 'react';
import {
  TableBlockProvider,
  useTableBlockProps,
  SchemaComponent,
  Plugin,
  ExtendCollectionsProvider,
  ISchema,
  useTableBlockDecoratorProps,
  FormItem,
  CardItem,
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
    {
      key: 'author',
      name: 'author',
      type: 'string',
      interface: 'input',
      description: null,
      collectionName: 'book',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: 'Author',
      },
    },
    {
      key: 'publishedDate',
      name: 'publishedDate',
      type: 'date',
      interface: 'datetime',
      description: null,
      collectionName: 'book',
      uiSchema: {
        type: 'string',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: false,
        },
        title: 'Published date',
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
    block: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-acl-action': 'book:list',
      'x-use-decorator-props': 'useTableBlockDecoratorProps',
      'x-decorator-props': {
        collection: 'book', // book 表
        action: 'list', // 获取 book 的列表
        params: {
          pageSize: 2,
        },
        showIndex: true,
        dragSort: false,
        dataSource: 'main',
      },
      'x-settings': 'blockSettings:table',
      'x-component': 'CardItem',
      properties: {
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-decorator': 'DndContext',
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
              'x-decorator': 'TableV2.Column.Decorator',
              'x-settings': 'fieldSettings:TableColumn',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-decorator': null,
                  'x-decorator-props': {
                    labelStyle: {
                      display: 'none',
                    },
                  },

                  'x-collection-field': 'book.name',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: 'Price',
              'x-decorator': 'TableV2.Column.Decorator',
              'x-settings': 'fieldSettings:TableColumn',
              'x-component': 'TableV2.Column',
              properties: {
                price: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-decorator': null,
                  'x-decorator-props': {
                    labelStyle: {
                      display: 'none',
                    },
                  },
                  'x-collection-field': 'book.price',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              title: 'Author',
              'x-component-props': {
                width: 200,
              },
              'x-decorator': 'TableV2.Column.Decorator',
              'x-settings': 'fieldSettings:TableColumn',
              'x-component': 'TableV2.Column',
              properties: {
                author: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-collection-field': 'book.author',
                  'x-decorator': null,
                  'x-decorator-props': {
                    labelStyle: {
                      display: 'none',
                    },
                  },
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              title: 'Published Date',
              'x-component': 'TableV2.Column',
              'x-component-props': {
                width: 200,
              },
              'x-decorator': 'TableV2.Column.Decorator',
              'x-settings': 'fieldSettings:TableColumn',
              properties: {
                publishedDate: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-collection-field': 'book.publishedDate',
                  'x-decorator': null,
                  'x-decorator-props': {
                    labelStyle: {
                      display: 'none',
                    },
                  },
                  'x-read-pretty': true,
                },
              },
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <ExtendCollectionsProvider collections={[bookCollection]}>
      <SchemaComponent schema={schema} />
    </ExtendCollectionsProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin],
  components: {
    TableBlockProvider,
    FormItem,
    CardItem,
  },
  scopes: {
    useTableBlockProps,
    useTableBlockDecoratorProps,
  },
  apis: {
    'book:list': {
      data: [
        {
          id: 1,
          name: 'book1',
          price: 35,
          author: 'Harper Lee',
          publishedDate: '1995-04-10',
        },
        {
          id: 2,
          name: 'book2',
          price: 28,
          author: 'Jane Austen',
          publishedDate: '1866-01-01',
        },
      ],
      meta: {
        count: 1,
        page: 1,
        totalPage: 1,
      },
    },
  },
});

export default app.getRootComponent();
