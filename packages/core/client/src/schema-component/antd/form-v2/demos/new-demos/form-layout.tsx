
import { ISchema, Plugin, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      'x-component-props': {
        layout: 'horizontal', // 'vertical' | 'horizontal' | 'inline
        labelCol: 6,
        wrapperCol: 10,
      },
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
        password: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Password',
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
