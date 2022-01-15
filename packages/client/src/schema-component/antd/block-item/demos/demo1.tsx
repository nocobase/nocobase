import React from 'react';
import { uid } from '@formily/shared';
import { observer, useField, useFieldSchema } from '@formily/react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SchemaComponent, SchemaComponentProvider, BlockItem, DndContext } from '@nocobase/client';

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
    data: props.data,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}

const Block = observer((props) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  return (
    <Droppable id={field.address.toString()} data={{ schema: fieldSchema }}>
      <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
        Block {fieldSchema.name}
        <Draggable id={field.address.toString()} data={{ schema: fieldSchema }}>
          Drag
        </Draggable>
      </div>
    </Droppable>
  );
});

export default function App() {
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
}
