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

const collections = [
  {
    name: 'test',
    fields: [
      {
        name: 'o2m',
        type: 'hasMany',
        interface: 'o2m',
        description: null,
        collectionName: 'test',
        parentKey: null,
        reverseKey: null,
        sourceKey: 'id',
        foreignKey: 'id',
        onDelete: 'SET NULL',
        uiSchema: {
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: true,
          },
          title: 'o2m',
        },
        target: 'test1',
        targetKey: 'id',
      },
    ],
  },
  {
    name: 'test1',
    fields: [
      {
        name: 'title',
        type: 'string',
        interface: 'input',
        description: null,
        collectionName: 'test1',
        parentKey: null,
        reverseKey: null,
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'title',
        },
      },
      {
        name: 'number',
        type: 'double',
        interface: 'number',
        description: null,
        collectionName: 'test1',
        parentKey: null,
        reverseKey: null,
        uiSchema: {
          'x-component-props': {
            step: '1',
            stringMode: true,
          },
          type: 'number',
          'x-component': 'InputNumber',
          title: 'number',
        },
      },
    ],
  },
];

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    block: {
      type: 'void',
      'x-acl-action': 'tests:create',
      'x-decorator': 'FormBlockProvider',
      'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
      'x-decorator-props': {
        dataSource: 'main',
        collection: 'test',
      },
      'x-component': 'CardItem',
      properties: {
        form: {
          type: 'object',
          'x-decorator': 'DndContext',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCreateFormBlockProps',
          properties: {
            o2m: {
              type: 'string',
              title: 'Sub-table',
              'x-decorator': 'FormItem',
              'x-collection-field': 'test.o2m',
              'x-component': 'CollectionField',
              'x-settings': 'fieldSettings:FormItem',
              'x-component-props': {
                fieldNames: {
                  value: 'id',
                  label: 'id',
                },
                mode: 'SubTable',
              },
              properties: {
                subTable: {
                  type: 'void',
                  'x-component': 'AssociationField.SubTable',
                  'x-initializer': 'table:configureColumns',
                  'x-initializer-props': {
                    action: false,
                  },
                  properties: {
                    column1: {
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-settings': 'fieldSettings:TableColumn',
                      'x-component': 'TableV2.Column',
                      properties: {
                        title: {
                          'x-collection-field': 'test1.title',
                          'x-component': 'CollectionField',
                          'x-component-props': {
                            ellipsis: true,
                          },
                          'x-decorator': 'FormItem',
                          'x-decorator-props': {
                            labelStyle: {
                              display: 'none',
                            },
                          },
                          default: '{{$iteration.number}}',
                        },
                      },
                    },
                    column2: {
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-settings': 'fieldSettings:TableColumn',
                      'x-component': 'TableV2.Column',
                      properties: {
                        number: {
                          'x-collection-field': 'test1.number',
                          'x-component': 'CollectionField',
                          'x-component-props': {
                            ellipsis: true,
                          },
                          'x-decorator': 'FormItem',
                          'x-decorator-props': {
                            labelStyle: {
                              display: 'none',
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
    collections: collections,
  },
});

export default app.getRootComponent();
