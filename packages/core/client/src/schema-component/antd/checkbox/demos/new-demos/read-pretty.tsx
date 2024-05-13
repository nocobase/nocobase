import { Plugin, SchemaComponent, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'boolean',
      default: true,
      title: 'Test1',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    test2: {
      type: 'boolean',
      default: false,
      title: 'Test2',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    test3: {
      type: 'boolean',
      default: false,
      title: 'Test3',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-component-props': {
        showUnchecked: true,
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
