
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { Button } from 'antd';
import React from 'react';

const ComponentButton = (props) => {
  return <Button {...props}>Custom Component</Button>;
};

const schema: ISchema = {
  type: 'void',
  name: 'test',
  'x-component': 'Space',
  properties: {
    test1: {
      type: 'void',
      'x-component': 'Action',
      'x-component-props': {
        component: 'ComponentButton', // string type
      },
    },
    test2: {
      type: 'void',
      'x-component': 'Action',
      'x-component-props': {
        component: ComponentButton, // ComponentType type
      },
    },
  },
}

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ ComponentButton }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
