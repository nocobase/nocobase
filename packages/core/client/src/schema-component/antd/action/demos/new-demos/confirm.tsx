
import { App as AntdApp } from 'antd';
import { ActionProps, ISchema, SchemaComponent, Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

function useActionProps(): ActionProps {
  const { message } = AntdApp.useApp();

  return {
    confirm: {
      // confirm props
      title: 'Delete',
      content: 'Are you sure you want to delete it?',
    },
    onClick() {
      // after confirm ok
      message.success('Deleted!');
    },
  };
}
const schema: ISchema = {
  type: 'void',
  name: 'test',
  'x-component': 'Action',
  title: 'Delete',
  'x-use-component-props': 'useActionProps',
}

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useActionProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
