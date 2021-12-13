# RadioGroup - 单选框

## Interface

```ts
export const radioGroup: FieldOptions = {
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '单选框',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Radio.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: select.operations,
};
```