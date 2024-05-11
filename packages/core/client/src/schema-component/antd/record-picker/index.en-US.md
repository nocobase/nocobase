# RecordPicker

Used for selecting associated fields.

## JSON Schema

### Examples

<code src="./demos/demo1.tsx"></code>

Select options through a popup window, where the options are displayed in a table. Configure it within the specific `RecordPicker.RowSelection` node, and it is only effective when `x-read-pretty: false`.

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

When `x-read-pretty: true`, you can configure the schema of the selected item in `RecordPicker.SelectedItem`.

```ts
{
  type: 'array',
  'x-pattern': 'readPretty',
  'x-component': 'RecordPicker',
  properties: {
    item: {
      'x-component': 'RecordPicker.SelectedItem',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'name'
        },
      },
      properties: {
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
