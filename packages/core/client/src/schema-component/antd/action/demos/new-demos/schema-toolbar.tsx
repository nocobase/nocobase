import { SchemaComponent, Plugin, SchemaSettings, ISchema } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

const myActionSettings = new SchemaSettings({
  name: 'myActionSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const schema: ISchema = {
  type: 'void',
  name: 'test',
  'x-component': 'ActionBar',
  'x-component-props': {
    layout: 'two-columns',
  },
  properties: {
    a1: {
      title: 'Action 1',
      'x-component': 'Action',
      'x-action': 'a1',
      'x-align': 'right',
      'x-settings': 'myActionSettings',
    },
    a2: {
      title: 'Action 2',
      'x-component': 'Action',
      'x-action': 'a2',
      'x-align': 'right',
      'x-settings': 'myActionSettings',
    },
    a3: {
      title: 'Action 3',
      'x-component': 'Action',
      'x-action': 'a1',
      'x-align': 'left',
      'x-settings': 'myActionSettings',
    },
    a4: {
      title: 'Action 4',
      'x-component': 'Action',
      'x-action': 'a2',
      'x-align': 'left',
      'x-settings': 'myActionSettings',
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
  designable: true,
  schemaSettings: [myActionSettings],
  apis: {
    test: { data: { result: 'ok' } },
  }
});

export default app.getRootComponent();

