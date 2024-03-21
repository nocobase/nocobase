import { observer, useFieldSchema } from '@formily/react';
import {
  Application,
  BlockItem,
  Plugin,
  DragHandler,
  Grid,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';

const Block = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        Block {fieldSchema.title}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'Block' },
);

const schema = {
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  name: 'grid1',
  'x-component': 'Grid',
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        col11: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block1: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '1',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'a9m97uffyku',
              'x-async': false,
              'x-index': 1,
            },
            block2: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '2.1',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'lensw462z8w',
              'x-async': false,
              'x-index': 2,
            },
            block234: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '2.2',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'lensw462z81',
              'x-async': false,
              'x-index': 3,
            },
          },
          'x-uid': '4shevom50rl',
          'x-async': false,
          'x-index': 1,
        },
        col12: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block3: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '3',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'kp4kjknbs2l',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'u7n3beze0gr',
          'x-async': false,
          'x-index': 2,
        },
      },
      'x-uid': 'qfl04eq71tt',
      'x-async': false,
      'x-index': 1,
    },
    row2: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        col21: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block4: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '4',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'v5bd5kcyhat',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'bwg0mv89atk',
          'x-async': false,
          'x-index': 1,
        },
        col22: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            block5: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              title: '5',
              'x-decorator': 'BlockItem',
              'x-component': 'Block',
              'x-uid': 'noh1flz5oqg',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'oz0rypr2rlj',
          'x-async': false,
          'x-index': 2,
        },
      },
      'x-uid': '5igqpmvilz1',
      'x-async': false,
      'x-index': 2,
    },
  },
};

const Root = () => {
  return (
    <SchemaComponentProvider components={{ Grid, Block, BlockItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
