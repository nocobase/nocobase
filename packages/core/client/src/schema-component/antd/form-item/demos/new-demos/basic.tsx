
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, SchemaSettings, ISchema } from '@nocobase/client';

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DndContext',
  'x-component': 'FormV2',
  properties: {
    username: {
      type: 'string',
      title: 'Username',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-settings': 'simpleSettings',
      required: true,
    },
    nickname: {
      type: 'string',
      title: 'Nickname',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-settings': 'simpleSettings',
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
  designable: true,
  plugins: [DemoPlugin],
  schemaSettings: [simpleSettings],
});

export default app.getRootComponent();


