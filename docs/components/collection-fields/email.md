# Email - 电子邮箱

## Interface

```ts
export const email: FieldOptions = {
  name: 'email',
  type: 'object',
  group: 'basic',
  order: 4,
  title: '电子邮箱',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-validator': 'email',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operations: string.operations,
};
```