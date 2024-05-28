import {
  DetailsBlockProvider,
  ISchema,
  useDetailsPaginationProps,
  useDetailsWithPaginationDecoratorProps,
  useDetailsWithPaginationProps,
  VariablesProvider,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

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
    {
      key: 'isPromotion',
      name: 'isPromotion',
      type: 'boolean',
      interface: 'checkbox',
      description: null,
      collectionName: 'book',
      uiSchema: {
        type: 'boolean',
        'x-component': 'Checkbox',
        title: 'Is promotion',
      },
    },
    {
      key: 'promotionPrice',
      name: 'promotionPrice',
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
        title: 'Promotion price',
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
  'x-decorator': 'DetailsBlockProvider',
  'x-acl-action': 'book:list',
  'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
  'x-decorator-props': {
    collection: 'book',
    action: 'list',
    params: {
      pageSize: 1,
    },
  },
  'x-component': 'CardItem',
  'x-settings': 'blockSettings:detailsWithPagination',
  'x-component-props': {
    // title: ' When name is ‘mamber’ ,hide title',
  },
  properties: {
    details: {
      type: 'void',
      'x-pattern': 'readPretty',
      'x-component': 'Details',
      'x-use-component-props': 'useDetailsWithPaginationProps',
      properties: {
        grid: {
          type: 'void',
          'x-component': 'Grid',
          'x-linkage-rules': [
            {
              condition: {
                $and: [
                  {
                    isPromotion: {
                      $isFalsy: true,
                    },
                  },
                ],
              },
              actions: [
                {
                  targetFields: ['promotionPrice'],
                  operator: 'none',
                },
              ],
            },
          ],
          properties: {
            row: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                col: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    name: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-collection-field': 'book.name',
                    },
                  },
                },
                col1: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    author: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-collection-field': 'book.author',
                    },
                  },
                },
              },
            },

            row2: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                col: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    price: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-collection-field': 'book.price',
                    },
                  },
                },
                col1: {
                  type: 'void',
                  'x-component': 'Grid.Col',

                  properties: {
                    isPromotion: {
                      type: 'boolean',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-collection-field': 'book.isPromotion',
                    },
                  },
                },
                col2: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    promotionPrice: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                      'x-collection-field': 'book.promotionPrice',
                    },
                  },
                },
              },
            },
          },
        },
        pagination: {
          'x-component': 'Pagination',
          'x-read-pretty': false,
          'x-use-component-props': 'useDetailsPaginationProps',
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <VariablesProvider>
      <ExtendCollectionsProvider collections={[bookCollection]}>
        <SchemaComponent schema={schema} />
      </ExtendCollectionsProvider>
    </VariablesProvider>
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
  components: { DetailsBlockProvider },
  scopes: {
    useDetailsWithPaginationDecoratorProps,
    useDetailsWithPaginationProps,
    useDetailsPaginationProps,
  },
  apis: {
    'book:list': {
      data: [
        {
          id: 1,
          name: 'book1',
          price: 335,
          author: 'Harper Lee',
          publishedDate: '1995-04-10',
          isPromotion: false,
          promotionPrice: 200,
        },
      ],
      meta: {
        count: 1,
        page: 1,
        pageSize: 1,
        totalPage: 2,
      },
    },
  },
});

export default app.getRootComponent();
