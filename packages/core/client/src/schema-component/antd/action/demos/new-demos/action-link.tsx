import React from 'react';
import { ISchema, SchemaComponent, Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

const schema: ISchema = {
  name: 'test',
  type: 'void',
  properties: {
    test: {
      type: 'void',
      'x-component': 'Action.Link',
      title: 'Edit',
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

const app = mockApp({ plugins: [DemoPlugin] });

export default app.getRootComponent();
