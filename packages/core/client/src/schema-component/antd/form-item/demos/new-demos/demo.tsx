import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import {
  SchemaComponent,
  Plugin,
  VariablesProvider,
  ISchema,
  FormItem,
  useCreateFormBlockDecoratorProps,
  useCreateFormBlockProps,
  FormBlockProvider,
} from '@nocobase/client';

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Title',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
  ],
};

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
        collection: 'tests',
      },
      'x-component': 'CardItem',
      properties: {
        form: {
          type: 'object',
          'x-decorator': 'DndContext',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCreateFormBlockProps',
          properties: {
            title: {
              type: 'string',
              title: 'Title',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-settings': 'fieldSettings:FormItem',
              default: 'constant',
              'x-collection-field': 'tests.title',
              required: true,
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
