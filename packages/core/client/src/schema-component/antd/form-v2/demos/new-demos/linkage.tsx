
import { Plugin, ISchema, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      properties: {
        username: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Username',
          required: true,
        },
        nickname: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Nickname',
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
