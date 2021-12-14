# CheckboxGroup - 复选框

## Interface

```ts
export const checkboxGroup: FieldOptions = {
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '复选框',
  default: {
    interface: 'checkboxGroup',
    type: 'json',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Checkbox.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Checkbox.Group.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: multipleSelect.operations,
};
```