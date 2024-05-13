import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'test',
  'x-component': 'Action',
  'x-component-props': {
    ghost: true, // ButtonProps
    type: 'dashed', // ButtonProps
    danger: true, // ButtonProps
    title: 'Open', // title
  },
  // title: 'Open', // It's also possible here
}

const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
