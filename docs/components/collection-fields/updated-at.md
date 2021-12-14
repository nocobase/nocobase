# UpdatedAt - 最后更新时间

## Interface

```ts
export const updatedAt: FieldOptions = {
  name: 'updatedAt',
  type: 'object',
  group: 'systemInfo',
  order: 2,
  title: '最后更新时间',
  sortable: true,
  default: {
    type: 'date',
    field: 'updated_at',
    // name,
    uiSchema: {
      type: 'datetime',
      title: '最后更新时间',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'DatePicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operations: datetime.operations,
};
```