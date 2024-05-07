
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test: {
      type: 'string',
      title: 'Test',
      default: 'admin',
      'x-decorator': 'FormItem',
      'x-component': 'AssociationSelect',
      'x-pattern': 'readPretty',
      'x-component-props': {
        service: {
          resource: 'roles',
          action: 'list',
        },
        fieldNames: {
          label: 'title',
          value: 'name',
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
});

export default app.getRootComponent();
