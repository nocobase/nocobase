import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import {
  SchemaComponent,
  Plugin,
  FormBlockProvider,
  ISchema,
  useCreateFormBlockDecoratorProps,
  useCreateFormBlockProps,
  FormItem,
  VariablesProvider,
} from '@nocobase/client';

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: 'Title',
        type: 'string',
        'x-component': 'Input',
      } as ISchema,
    },
    {
      type: 'double',
      name: 'number',
      interface: 'number',
      uiSchema: {
        title: 'Number',
        type: 'number',
        'x-component': 'InputNumber',
      } as ISchema,
    },
  ],
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    cardItem: {
      type: 'void',
      'x-acl-action': 'tests:create',
      'x-decorator': 'FormBlockProvider',
      'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
      'x-decorator-props': {
        dataSource: 'main',
        collection: 'tests',
      },
      'x-settings': 'blockSettings:createForm',
      'x-component': 'CardItem',
      'x-component-props': {
        title: 'When number > 10, title is disabled',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCreateFormBlockProps',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-linkage-rules': [
                {
                  condition: {
                    $and: [
                      {
                        number: {
                          $gt: 10,
                        },
                      },
                    ],
                  },
                  actions: [
                    {
                      targetFields: ['title'],
                      operator: 'disabled',
                    },
                  ],
                },
              ],
              properties: {
                row1: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        number: {
                          type: 'string',
                          title: 'Number',
                          'x-decorator': 'FormItem',
                          'x-component': 'CollectionField',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-collection-field': 'tests.number',
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
                        title: {
                          type: 'string',
                          title: 'Title',
                          'x-decorator': 'FormItem',
                          'x-component': 'CollectionField',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-collection-field': 'tests.title',
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
    },
  },
};

const Demo = () => {
  return (
    <VariablesProvider>
      <SchemaComponent
        schema={schema}
        scope={{ useCreateFormBlockDecoratorProps, useCreateFormBlockProps }}
        components={{ FormBlockProvider, FormItem }}
      />
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
  schemaSettings: [],
  dataSourceManager: {
    collections: [collection],
  },
});

export default app.getRootComponent();
