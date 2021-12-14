# Markdown

## Interface

```ts
export const markdown: FieldOptions = {
  name: 'markdown',
  type: 'object',
  title: 'Markdown',
  group: 'media',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Markdown',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Markdown.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
```