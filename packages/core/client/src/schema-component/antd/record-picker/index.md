---
group:
  title: Schema Components
  order: 3
---

# RecordPicker <Badge>待定</Badge>

## JSON Schema

### Examples

<code src="./demos/demo1.tsx"></code>

通过弹窗选择可选项，可选项用表格展示，在特定的 `RecordPicker.RowSelection` 节点里配置，仅当 `x-read-pretty: false` 时有效。

```ts
{
  type: 'array',
  default: [
    { id: 1, name: 'tag1' },
    { id: 2, name: 'tag2' },
  ],
  'x-component': 'RecordPicker',
  properties: {
    rowSelection: {
      'x-component': 'RecordPicker.RowSelection',
    },
  },
}
```

`x-read-pretty: true` 时，可以在 `RecordPicker.SelectedItem` 里配置选中项的 schema。

```ts
{
  type: 'array',
  'x-read-pretty': true,
  'x-component': 'RecordPicker',
  properties: {
    item: {
      'x-component': 'RecordPicker.SelectedItem',
      'x-component-props': {
        // label、value 与字段的映射关系
        fieldNames: {
          value: 'id',
          label: 'name'
        },
      },
      properties: {
        // 弹窗显示详情
        drawer1: {
          'x-component': 'Action.Drawer',
          type: 'void',
          title: 'Drawer Title',
          properties: {
            hello1: {
              'x-content': 'Hello',
              title: 'T1',
            },
            footer1: {
              'x-component': 'Action.Drawer.Footer',
              type: 'void',
              properties: {
                close1: {
                  type: 'void',
                  title: 'Close',
                  'x-component': 'Action',
                  'x-component-props': {
                    // useAction: '{{ useCloseAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
```
