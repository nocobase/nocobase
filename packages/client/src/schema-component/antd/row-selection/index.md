---
nav:
  path: /client
group:
  path: /schema-components
---

# RowSelection - 行选择器 <Badge>待定</Badge>

用表格视图展示可选项数据，功能上与 Radio.Group 和 CheckBox.Group 一致。

## JSON Schema

[rowSelection](https://ant.design/components/table/#rowSelection)

单选

```ts
{
  type: 'number',
  'x-component': 'RowSelection',
  'x-component-props': {
    rowKey: 'id',
    rowSelection: {
      type: 'radio',
    },
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
      { id: 3, name: 'Name3' },
    ],
  },
  default: 1,
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

多选

```ts
{
  type: 'number',
  'x-component': 'RowSelection',
  'x-component-props': {
    rowKey: 'id',
    rowSelection: {
      type: 'radio',
    },
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
      { id: 3, name: 'Name3' },
    ],
  },
  default: 1,
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