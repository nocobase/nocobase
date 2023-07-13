import { observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { BlockItem, DndContext, DragHandler, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const Block = observer(
  () => {
    const fieldSchema = useFieldSchema();
    return (
      <div
        className="nc-block-item"
        style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}
      >
        Block {fieldSchema.name}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'Block' },
);

const schema = {
  type: 'void',
  name: 'page',
  'x-component': 'DndContext',
  'x-uid': uid(),
  properties: {
    block1: {
      'x-decorator': 'BlockItem',
      'x-component': 'Block',
      'x-uid': uid(),
    },
    block2: {
      'x-decorator': 'BlockItem',
      'x-component': 'Block',
      'x-uid': uid(),
    },
    block3: {
      'x-decorator': 'BlockItem',
      'x-component': 'Block',
      'x-uid': uid(),
    },
  },
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ DndContext, BlockItem, Block }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
