
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
      properties: {
        grid: {
          type: 'void',
          'x-component': 'Grid',
          properties: {
            row1: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                col1: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    username: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      title: 'Username',
                      required: true,
                    },
                  },
                },
                col2: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    nickname: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      title: 'Nickname',
                    },
                  },
                },
              },
            },
            row2: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                col1: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    password: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      title: 'Password',
                    },
                  },
                },
              },
            },
          },
        },
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

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
