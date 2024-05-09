
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-read-pretty': true,
  properties: {
    read1: {
      interface: 'string',
      type: 'string',
      default:
        'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
      title: `Test`,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    read2: {
      interface: 'string',
      type: 'string',
      title: `Test(ellipsis)`,
      'x-decorator': 'FormItem',
      default:
        'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        ellipsis: true,
        style: {
          width: '100px',
        },
      },
    },
    read3: {
      interface: 'string',
      type: 'string',
      title: `Test(autop)`,
      default:
        'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        autop: true,
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
