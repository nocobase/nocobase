# Icon - 图标

## Interface

```ts
export const icon: FieldOptions = {
  name: 'icon',
  type: 'object',
  group: 'basic',
  order: 8,
  title: '图标',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'IconPicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'IconPicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
```