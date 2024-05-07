
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
      title: 'Test',
      default:
        'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    test2: {
      type: 'string',
      title: 'Test(ellipsis)',
      default:
        'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        ellipsis: true,
        style: {
          width: 100,
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
