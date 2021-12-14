# Password - 密码

## Interface

```ts
export const password: FieldOptions = {
  name: 'password',
  type: 'object',
  group: 'basic',
  order: 7,
  title: '密码',
  default: {
    type: 'password',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Password.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
```