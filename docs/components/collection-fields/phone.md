# Phone - 手机号码

## Interface

```ts
export const phone: FieldOptions = {
  name: 'phone',
  type: 'object',
  group: 'basic',
  order: 3,
  title: '手机号码',
  sortable: true,
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-validator': 'phone',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operations: string.operations,
};
```