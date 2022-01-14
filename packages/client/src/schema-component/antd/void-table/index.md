---
nav:
  path: /client
group:
  path: /schema-components
---

# VoidTable - 表格（数据展示） <Badge>待定</Badge>

VoidTable 只用作数据展示，如果需要可以录入数据的表格字段，请使用 [ArrayTable](array-table)。

## JSON Schema

VoidTable 的 props 与 antd 的 [Table](https://ant.design/components/table/#API) 一致。

```ts
{
  type: 'void',
  'x-component': 'VoidTable',
  'x-component-props': {
    rowKey: 'id',
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
      { id: 3, name: 'Name3' },
    ],
  },
}
```

另外，dataSource 也可以由 AsyncDataProvider 提供

```ts
{
  type: 'void',
  'x-decorator': 'AsyncDataProvider',
  'x-decorator-props': {
    request: { url: '/users' },
  },
  'x-component': 'VoidTable',
  'x-component-props': {
    rowKey: 'id',
  },
}
```

为了更好的支持 columns 的渲染，添加了 VoidTable.Column 用于配置表格列，VoidTable.Column 写在 properties 里，属性与 antd 的 [Table.Column](https://ant.design/components/table/#Column) 一致。

```ts
{
  type: 'void',
  'x-component': 'VoidTable',
  'x-component-props': {
    rowKey: 'id',
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
      { id: 3, name: 'Name3' },
    ],
  },
  properties: {
    column1: {
      type: 'void',
      'x-component': 'VoidTable.Column',
      'x-component-props': {
        title: 'Name',
      },
      properties: {
        name: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    },
  },
}
```
