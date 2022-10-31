# 邻近位置插入

与 DOM 的 [insert adjacent](https://dom.spec.whatwg.org/#insert-adjacent) 概念相似，Schema 也提供了 `dn.insertAdjacent()` 方法用于解决邻近位置的插入问题。

## 邻近位置

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

## useDesignable()

获取当前 schema 节点设计器的 API

```ts
const {
  designable,         // 是否可以配置
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
