
import { App as AntdApp } from 'antd';
import { ISchema, useAPIClient } from '@nocobase/client';
import { SchemaComponent, Plugin, ActionProps } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const useCustomActionProps = (): ActionProps => {
  const api = useAPIClient();
  const { message } = AntdApp.useApp();

  return {
    onClick: async () => {
      const { data } = await api.request({ url: 'test' });
      if (data.data.result === 'ok') {
        message.success('Success!');
      }
    },
  };
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-component': 'Space',
  properties: {
    test0: {
      type: 'void',
      'x-component': 'Action',
      title: 'test2',
      'x-use-component-props': 'useCustomActionProps', // string type
    },
    test1: {
      type: 'void',
      'x-component': 'Action',
      title: 'test1',
      'x-use-component-props': useCustomActionProps, // function type
    },
    test2: {
      type: 'void',
      'x-component': 'Action',
      title: 'test2',
      'x-use-component-props': function useCustomActionProps(): ActionProps {
        // inline function type
        const api = useAPIClient();
        const { message } = AntdApp.useApp();

        return {
          onClick: async () => {
            const { data } = await api.request({ url: 'test' });
            if (data.data.result === 'ok') {
              message.success('Success!');
            }
          },
        };
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useCustomActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: { result: 'ok' } },
  }
});

export default app.getRootComponent();
