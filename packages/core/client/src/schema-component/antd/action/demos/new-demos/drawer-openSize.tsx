
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const schema: ISchema = {
  name: 'test',
  type: 'void',
  'x-component': 'Action',
  title: 'Open Drawer',
  'x-component-props': {
    openSize: 'large', // open drawer size
  },
  properties: {
    drawer: {
      type: 'void',
      title: 'Drawer Title',
      'x-component': 'Action.Drawer',
      properties: {
        // Drawer content
        hello: {
          type: 'void',
          'x-content': 'Hello',
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
