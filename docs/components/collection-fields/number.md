# Number - 数字

## Interface

```ts
export const number: FieldOptions = {
  name: 'number',
  type: 'object',
  group: 'basic',
  order: 5,
  title: '数字',
  sortable: true,
  default: {
    type: 'float',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '0',
      },
      'x-decorator': 'FormItem',
      'x-designable-bar': 'InputNumber.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '精度',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: '0',
      enum: [
        { value: '0', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
      ],
    },
  },
  operations: [
    { label: '等于', value: 'eq', selected: true },
    { label: '不等于', value: 'ne' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'gte' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'lte' },
    // {label: '介于', value: 'between'},
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
};
```