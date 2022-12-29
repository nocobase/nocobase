import { render, screen, fireEvent } from '@testing-library/react';
import { observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { DndContext, DragHandler } from '@nocobase/client';
import React from 'react';
import { BlockItem } from '../BlockItem';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';

const Block = observer((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      Block {fieldSchema.name}
      <DragHandler />
    </div>
  );
});

const App = () => {
  return (
    <SchemaComponentProvider components={{ DndContext, BlockItem, Block }}>
      <SchemaComponent
        schema={{
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
        }}
      />
    </SchemaComponentProvider>
  );
};

describe('blockItem', () => {
  it('blockItem', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
