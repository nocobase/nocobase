# TextArea - 多行文本

## Interface

```ts
export const textarea: FieldOptions = {
  name: 'textarea',
  type: 'object',
  group: 'basic',
  order: 2,
  title: '多行文本',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
```