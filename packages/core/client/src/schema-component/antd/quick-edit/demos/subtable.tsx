
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, BlockSchemaComponentPlugin } from '@nocobase/client';

const schema = {
  name: 'test',
  type: 'void',
  'x-decorator': 'FormBlockProvider',
  'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
  'x-decorator-props': {
    dataSource: 'main',
    collection: 'users',
  },
  'x-component': 'div',
  properties: {
    '45i9guirvtz': {
      type: 'void',
      'x-component': 'FormV2',
      'x-use-component-props': 'useCreateFormBlockProps',
      properties: {
        roles: {
          type: 'string',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': 'users.roles',
          'x-component-props': {
            fieldNames: {
              label: 'name',
              value: 'name',
            },
            addMode: 'modalAdd',
            mode: 'SubTable',
          },
          default: null,
          properties: {
            e2l1f5wo2st: {
              type: 'void',
              'x-component': 'AssociationField.SubTable',
              properties: {
                '9x9jysv3hka': {
                  type: 'void',
                  'x-decorator': 'TableV2.Column.Decorator',
                  'x-component': 'TableV2.Column',
                  properties: {
                    'long-text': {
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
                      'x-disabled': false,
                    },
                  },
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
  plugins: [DemoPlugin, BlockSchemaComponentPlugin],
  designable: true,
});

export default app.getRootComponent();
