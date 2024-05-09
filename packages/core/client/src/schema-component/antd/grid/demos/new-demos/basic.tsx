

import { useFieldSchema } from '@formily/react';
import { observer } from '@formily/reactive-react';
import {
  SchemaComponent,
  ISchema,
  Plugin,
  DragHandler
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';

import React from 'react';

const MyBlock = observer(
  () => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        {fieldSchema.title}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'MyBlock' },
);

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-component': 'Grid',
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        col1: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block1: {
              type: 'void',
              title: 'row1 - col1 - block1',
              'x-decorator': 'BlockItem',
              'x-component': 'MyBlock',
            },
            block2: {
              type: 'void',
              title: 'row1 - col1 - block2',
              'x-decorator': 'BlockItem',
              'x-component': 'MyBlock',
            },
          },
        },
        col2: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block1: {
              type: 'void',
              title: 'row1 - col2 - block1',
              'x-decorator': 'BlockItem',
              'x-component': 'MyBlock',
            },
          },
        },
      },
    },
    row2: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        col1: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block4: {
              type: 'void',
              title: 'row2 - col1 - block1',
              'x-decorator': 'BlockItem',
              'x-component': 'MyBlock',
            },
          },
        },
        col2: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block1: {
              type: 'void',
              title: 'row2 - col2 - block1',
              'x-decorator': 'BlockItem',
              'x-component': 'MyBlock',
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ MyBlock }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
