---
group:
  title: Client
  path: /client
---

# SchemaComponent

## Components

### SchemaComponentProvider

### SchemaComponent

### RecursionComponent

## Hooks

### useDesignable()

获取当前 schema 节点设计器的 API

```ts
const {
  designable,         // 是否可以配置
  patch,              // 更新当前节点配置
  remove,             // 移除当前节点
  insertAdjacent,     // 在某位置插入
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
insertAdjacent('beforebegin', schema);

// 在当前节点的第一个子节点前面插入
insertAfterBegin(schema);
// 等同于
insertAdjacent('afterbegin', schema);

// 在当前节点的最后一个子节点后面
insertBeforeEnd(schema);
// 等同于
insertAdjacent('beforeend', schema);

// 在当前节点的后面
insertAfterEnd(schema);
// 等同于
insertAdjacent('afterend', schema);
```

几个插入的位置：

```ts
{
  properties: {
    // beforebegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterbegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeend 在当前节点的最后一个子节点后面
      },
    },
    // afterend 在当前节点的后面
  },
}
```

## Examples

<code src="./demos/demo1.tsx" />
