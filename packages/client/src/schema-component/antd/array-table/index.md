---
nav:
  path: /client
group:
  path: /schema-components
---

# ArrayTable - 表格（数据录入） <Badge>待定</Badge>

ArrayTable 更侧重于数据录入，如果需要动态的表格数据展示，请使用 [VoidTable](void-table)。

## JSON Schema

ArrayTable 的 props 与 antd 的 [Table](https://ant.design/components/table/#API) 基本一致。但并不直接用 Table 组件的 columns 和 dataSource。dataSource 由表单提供，默认值写在 default 里；为了更好的支持 columns 的渲染，添加了 ArrayTable.Column 用于配置表格列，ArrayTable.Column 写在 properties 里，属性与 antd 的 [Table.Column](https://ant.design/components/table/#Column) 一致。

```ts
{
  type: 'array',
  'x-component': 'ArrayTable',
  default: [
    { id: 1, name: 'Name1' },
    { id: 2, name: 'Name2' },
    { id: 3, name: 'Name3' },
  ],
  properties: {
    column1: {
      type: 'void',
      'x-component': 'ArrayTable.Column',
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
