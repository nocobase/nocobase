# Time - 时间

## Interface

```ts
export const time: FieldOptions = {
  name: 'time',
  type: 'object',
  group: 'datetime',
  order: 2,
  title: '时间',
  sortable: true,
  default: {
    dataType: 'time',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'TimePicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'TimePicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.format': {
      type: 'string',
      title: '时间格式',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'HH:mm:ss',
      enum: [
        {
          label: '24小时制',
          value: 'HH:mm:ss',
        },
        {
          label: '12小时制',
          value: 'hh:mm:ss a',
        },
      ],
    },
  },
  operations: [
    { label: '等于', value: 'eq', selected: true },
    { label: '不等于', value: 'neq' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'gte' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'lte' },
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
};
```