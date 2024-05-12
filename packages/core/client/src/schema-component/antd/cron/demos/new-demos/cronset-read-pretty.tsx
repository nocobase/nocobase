
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'string',
      default: '0 0 0 * * ?',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'CronSet',
      'x-component-props': {
        options: [
          {
            label: '{{t("Daily")}}',
            value: '0 0 0 * * ?',
          },
          {
            label: '{{t("Weekly")}}',
            value: '* * * * * ?',
          },
        ],
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

