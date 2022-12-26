# Schema 的设计能力

Schema 的设计能力主要体现在

- 邻近位置插入，可用于
  - 插入新的 schema 节点
  - 现有 schema 节点的拖拽移动
- schema 参数修改

设计器核心 API 和参数有：

- 设计器 API：`createDesignable()` & `useDesignable()`
- Schema 参数：`x-designer`，用于适配设计器组件

## 设计器 API

### createDesignable()

```ts
import { Schema } from '@nocobase/client';

const current = new Schema({
  type: 'void',
  'x-component': 'div',
});

const {
  designable,         // 是否可以配置
  remove,
  insertAdjacent,     // 在某位置插入，四个位置：beforeBegin、afterBegin、beforeEnd、afterEnd
  insertBeforeBegin,  // 在当前节点的前面插入
  insertAfterBegin,   // 在当前节点的第一个子节点前面插入
  insertBeforeEnd,    // 在当前节点的最后一个子节点后面
  insertAfterEnd,     // 在当前节点的后面
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

React Hook 场景也可以用 `useDesignable()` 获取当前 schema 组件设计器的 API

```ts
const {
  designable,         // 是否可以配置
  remove,
  insertAdjacent,     // 在某位置插入，四个位置：beforeBegin、afterBegin、beforeEnd、afterEnd
  insertBeforeBegin,  // 在当前节点的前面插入
  insertAfterBegin,   // 在当前节点的第一个子节点前面插入
  insertBeforeEnd,    // 在当前节点的最后一个子节点后面
  insertAfterEnd,     // 在当前节点的后面
} = useDesignable();

const schema = {
  name: uid(),
  'x-component': 'Hello',
};

// 在当前节点的前面插入
insertBeforeBegin(schema);
// 等同于
insertAdjacent('beforeBegin', schema);

// 在当前节点的第一个子节点前面插入
insertAfterBegin(schema);
// 等同于
insertAdjacent('afterBegin', schema);

// 在当前节点的最后一个子节点后面
insertBeforeEnd(schema);
// 等同于
insertAdjacent('beforeEnd', schema);

// 在当前节点的后面
insertAfterEnd(schema);
// 等同于
insertAdjacent('afterEnd', schema);
```

## 邻近位置插入

与 DOM 的 [insert adjacent](https://dom.spec.whatwg.org/#insert-adjacent) 概念相似，Schema 也提供了 `insertAdjacent()` 方法用于解决邻近位置的插入问题。

四个邻近位置

```ts
{
  properties: {
    // beforeBegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterBegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeEnd 在当前节点的最后一个子节点后面
      },
    },
    // afterEnd 在当前节点的后面
  },
}
```

和 HTML 标签一样，Schema 组件库的组件也是可以相互组合，通过 insertAdjacent API 按实际需要插入在合理的邻近位置。

### 插入新的 schema 节点

在 Schema 组件里，可以直接通过 `useDesignable()` 在当前 Schema 的相邻位置插入新节点：


示例

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

### 现有 schema 节点的拖拽移动

insertAdjacent 等方法也可用于节点的拖拽移动

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

## `x-designer` 的应用

`x-designer` 通常只在 BlockItem、CardItem、FormItem 等包装器组件中使用。

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

说明：NocoBase 提供的 Schema 设计器是以工具栏形式直接嵌入于界面，当激活界面配置时（`designable = true`），`x-designer` 组件（设计器工具栏）会显示出来，就可以通过工具栏更新当前 schema 组件了，工具栏提供的设计能力包括：

- 拖拽移动：DndContext + DragHandler
- 插入新节点：SchemaInitializer
- 参数配置：SchemaSettings
