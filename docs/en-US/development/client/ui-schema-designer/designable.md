# Schema design capabilities

The design capabilities of Schema are mainly

- Neighborhood insertion, which can be used to
  - Insertion of new schema nodes
  - Drag-and-drop movement of existing schema nodes
- schema parameter modification

The core designer APIs and parameters are

- Designer API: `createDesignable()` & `useDesignable()`
- Schema parameters: `x-designer`, used to adapt the designer component

## Designer API

### createDesignable()

```ts
import { Schema } from '@nocobase/client';

const current = new Schema({
  type: 'void',
  'x-component': 'div',
});

const {
  designable, // whether it is configurable
  remove,
  insertAdjacent, // insert at a position, four positions: beforeBegin, afterBegin, beforeEnd, afterEnd
  insertBeforeBegin, // insert in front of the current node
  insertAfterBegin, // insert in front of the first child node of the current node
  insertBeforeEnd, // after the last child of the current node
  insertAfterEnd, // after the current node
} = createDesignable({
  current,
});

const newSchema = {
  type: 'void',
  name: 'hello',
  'x-component': 'Hello',
};

insertAfterBegin(newSchema);

console.log(current.toJSON());
{
  type: 'void',
  'x-component': 'div',
  properties: {
    hello: {
      type: 'void',
      'x-component': 'Hello',
    },
  },
}
```

### useDesignable()

React Hook scenarios can also use `useDesignable()` to get the API of the current schema component designer

```ts
const {
  designable, // whether it is configurable
  remove,
  insertAdjacent, // insert at a position, four positions: beforeBegin, afterBegin, beforeEnd, afterEnd
  insertBeforeBegin, // insert in front of the current node
  insertAfterBegin, // insert in front of the first child node of the current node
  insertBeforeEnd, // after the last child of the current node
  insertAfterEnd, // after the current node
} = useDesignable();

const schema = {
  name: uid(),
  'x-component': 'Hello',
};

// Insert in front of the current node
insertBeforeBegin(schema);
// Equivalent to
insertAdjacent('beforeBegin', schema);

// insert in front of the first child of the current node
insertAfterBegin(schema);
// Equivalent to
insertAdjacent('afterBegin', schema);

// after the last child of the current node
insertBeforeEnd(schema);
// Equivalent to
insertAdjacent('beforeEnd', schema);

// After the current node
insertAfterEnd(schema);
// Equivalent to
insertAdjacent('afterEnd', schema);
```
## Neighborhood insertion

Similar to the DOM's [insert adjacent](https://dom.spec.whatwg.org/#insert-adjacent) concept, Schema also provides the `insertAdjacent()` method for solving the insertion of adjacent positions.

The four adjacent positions

```ts
{
  properties: {
    // beforeBegin insert before the current node
    node1: {
      properties: {
        // afterBegin inserted before the first child of the current node
        // ...
        // beforeEnd after the last child of the current node
      },
    },
    // afterEnd after the current node
  },
}
```
Like HTML tags, the components of the Schema component library can be combined with each other and inserted in reasonable proximity as needed via the insertAdjacent API.

### Inserting a new schema node

Within a Schema component, a new node can be inserted directly into the adjacent position of the current Schema with `useDesignable()`.

Example

```tsx
import React from 'react';
import { SchemaComponentProvider, SchemaComponent, useDesignable } from '@nocobase/client';
import { observer, Schema, useFieldSchema } from '@formily/react';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const Hello = observer((props) => {
  const { insertAdjacent } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <h1>{fieldSchema.name}</h1>
      <Space>
        <Button
          onClick={() => {
            insertAdjacent('beforeBegin', {
              'x-component': 'Hello',
            });
          }}
        >
          before begin
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('afterBegin', {
              'x-component': 'Hello',
            });
          }}
        >
          after begin
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('beforeEnd', {
              'x-component': 'Hello',
            });
          }}
        >
          before end
        </Button>
        <Button
          onClick={() => {
            insertAdjacent('afterEnd', {
              'x-component': 'Hello',
            });
          }}
        >
          after end
        </Button>
      </Space>
      <div style={{ margin: 50 }}>{props.children}</div>
    </div>
  );
});

const Page = observer((props) => {
  return <div>{props.children}</div>;
});

export default () => {
  return (
    <SchemaComponentProvider components={{ Page, Hello }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            hello1: {
              type: 'void',
              'x-component': 'Hello',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
```

### Drag-and-drop movement of existing schema nodes

Methods such as insertAdjacent can also be used to drag and drop nodes

```tsx
import React from 'react';
import { uid } from '@formily/shared';
import { observer, useField, useFieldSchema } from '@formily/react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { SchemaComponent, SchemaComponentProvider, createDesignable, useDesignable } from '@nocobase/client';

const useDragEnd = () => {
  const { refresh } = useDesignable();

  return ({ active, over }: DragEndEvent) => {
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;

    if (!activeSchema || !overSchema) {
      return;
    }

    const dn = createDesignable({
      current: overSchema,
    });

    dn.on('insertAdjacent', refresh);
    dn.insertBeforeBeginOrAfterEnd(activeSchema);
  };
};

const Page = observer((props) => {
  return <DndContext onDragEnd={useDragEnd()}>{props.children}</DndContext>;
});

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
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <Droppable id={field.address.toString()} data={{ schema: fieldSchema }}>
      <div style={{ marginBottom: 20, padding: '20px', background: '#f1f1f1' }}>
        Block {fieldSchema.name}{' '}
        <Draggable id={field.address.toString()} data={{ schema: fieldSchema }}>
          Drag
        </Draggable>
      </div>
    </Droppable>
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Page, Block }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            block1: {
              'x-component': 'Block',
            },
            block2: {
              'x-component': 'Block',
            },
            block3: {
              'x-component': 'Block',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}
```
## Applications of `x-designer` 

`x-designer` is usually used only in wrapper components such as BlockItem, CardItem, FormItem, etc.

```ts
{
  type: 'object',
  properties: {
    title: {
      type: 'string',
      title: '标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-designer': 'FormItem.Designer',
    },
    status: {
      type: 'string',
      title: '状态',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-designer': 'FormItem.Designer',
    },
  },
}
```

Note: The Schema designer provided by NocoBase is directly embedded in the interface in the form of a toolbar. When the UI configuration is activated (`designable = true`), the `x-designer` component (designer toolbar) will be displayed and the current schema component can be updated through the toolbar.

- Drag and Drop: DndContext + DragHandler
- Inserting new nodes: SchemaInitializer
- Parameter configuration: SchemaSettings
