import {
  DetailsBlockProvider,
  ISchema,
  Plugin,
  SchemaComponent,
  useDetailsPaginationProps,
  useDetailsWithPaginationDecoratorProps,
  useDetailsWithPaginationProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DetailsBlockProvider',
  'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
  'x-decorator-props': {
    collection: 'roles',
    action: 'list',
    params: {
      pageSize: 1,
    },
  },
  'x-component': 'CardItem',
  properties: {
    details: {
      type: 'void',
      'x-pattern': 'readPretty',
      'x-component': 'Details',
      'x-use-component-props': 'useDetailsWithPaginationProps',
      properties: {
        name: {
          type: 'string',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-index': 1,
        },
        title: {
          type: 'string',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-index': 2,
        },
        pagination: {
          'x-component': 'Pagination',
          'x-read-pretty': false,
          'x-use-component-props': 'useDetailsPaginationProps',
          'x-index': 3,
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponent
      schema={schema}
      scope={{
        useDetailsWithPaginationDecoratorProps,
        useDetailsWithPaginationProps,
        useDetailsPaginationProps,
      }}
    />
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: { DetailsBlockProvider },
});

export default app.getRootComponent();
