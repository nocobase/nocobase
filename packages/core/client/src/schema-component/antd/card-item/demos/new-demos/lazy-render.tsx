
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
  'x-component': 'div',
  'x-component-props': {
    style: {
      height: 300,
      overflow: 'auto',
      border: '1px solid #f0f0f0',
    },
  },
  properties: {
    block1: {
      type: 'void',
      'x-component': 'CardItem',
      'x-component-props': {
        title: 'Block 1',
      },
      'x-settings': 'simpleSettings',
      properties: {
        hello: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'Hello Card!',
        },
      },
    },
    block2: {
      type: 'void',
      'x-component': 'CardItem',
      'x-settings': 'simpleSettings',
      'x-component-props': {
        title: 'Block 2',
      },
      properties: {
        hello: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'Hello Card!',
        },
      },
    },
    block3: {
      type: 'void',
      'x-component': 'CardItem',
      'x-settings': 'simpleSettings',
      'x-component-props': {
        title: 'Block 3',
        lazyRender: {
          threshold: 1,
        },
      },
      properties: {
        hello: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'Hello Card!',
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
    this.app.schemaSettingsManager.add(simpleSettings)
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin],
  delayResponse: 500,
});

export default app.getRootComponent();
