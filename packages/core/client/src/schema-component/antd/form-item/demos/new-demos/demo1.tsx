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
        required: true,
        description: 'description1',
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
        description: 'description2',
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
              default: '{{$nForm.number}}',
              'x-collection-field': 'tests.title',
              required: true,
            },
            number: {
              type: 'string',
              title: 'Number',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-settings': 'fieldSettings:FormItem',
              'x-collection-field': 'tests.number',
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
