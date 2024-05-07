
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
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
            value: 'every_week',
          },
          {
            label: '{{t("Monthly")}}',
            value: 'every_month',
          },
          {
            label: '{{t("Yearly")}}',
            value: 'every_year',
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
