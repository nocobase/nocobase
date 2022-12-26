# SchemaInitializer

用于各种 schema 的初始化。新增的 schema 可以插入到某个已有 schema 节点的任意位置，包括：

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

SchemaInitializer 的核心包括 `<SchemaInitializer.Button />` 和 `<SchemaInitializer.Item />` 两个组件。`<SchemaInitializer.Button />` 用于创建 Schema 的下拉菜单按钮，下拉菜单的菜单项为 `<SchemaInitializer.Item/>`。

### `<SchemaInitializerProvider />`

### `<SchemaInitializer.Button />`

### `<SchemaInitializer.Item/>`
