import React from 'react';
import { useFieldSchema, observer, ISchema } from '@formily/react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, DragHandler, SchemaSettings } from '@nocobase/client';

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const MyBlock = observer(
  () => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="nc-block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        {fieldSchema.name}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'MyBlock' },
);

const schema: ISchema = {
  type: 'void',
  name: 'test',
  'x-component': 'DndContext',
  properties: {
    block1: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-component': 'MyBlock',
      'x-settings': 'simpleSettings',
    },
    block2: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-component': 'MyBlock',
      'x-settings': 'simpleSettings',
    },
    block3: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-component': 'MyBlock',
      'x-settings': 'simpleSettings',
    },
  },
}

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ MyBlock }} />;
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
