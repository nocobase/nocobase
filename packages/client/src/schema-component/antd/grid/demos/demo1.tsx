import { observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { BlockItem, DragHandler, Grid, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const Block = observer((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      Block {fieldSchema.title}
      <DragHandler />
    </div>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Grid, Block, BlockItem }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'grid1',
          'x-component': 'Grid',
          'x-uid': uid(),
          properties: {
            row1: {
              type: 'void',
              'x-component': 'Grid.Row',
              'x-uid': uid(),
              properties: {
                col11: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block1: {
                      type: 'void',
                      title: '1',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                    block2: {
                      type: 'void',
                      title: '2',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
                col12: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block3: {
                      type: 'void',
                      title: '3',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
              },
            },
            row2: {
              type: 'void',
              'x-component': 'Grid.Row',
              'x-uid': uid(),
              properties: {
                col21: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block4: {
                      type: 'void',
                      title: '4',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
                col22: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    block5: {
                      type: 'void',
                      title: '5',
                      'x-decorator': 'BlockItem',
                      'x-component': 'Block',
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
