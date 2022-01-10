import React from 'react';
import { uid } from '@formily/shared';
import { observer, useFieldSchema } from '@formily/react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SchemaComponent, SchemaComponentProvider, Grid } from '@nocobase/client';

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
  return (
    <Droppable id={fieldSchema.name} data={{ schema: fieldSchema }}>
      <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
        Block {fieldSchema.name}
        <Draggable id={fieldSchema.name} data={{ schema: fieldSchema }}>
          Drag
        </Draggable>
      </div>
    </Droppable>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Grid, Block }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Grid',
          'x-uid': uid(),
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid.Row',
              'x-uid': uid(),
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Block',
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Block',
                    },
                  },
                },
              },
            },
            [uid()]: {
              type: 'void',
              'x-component': 'Grid.Row',
              'x-uid': uid(),
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Block',
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'void',
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
