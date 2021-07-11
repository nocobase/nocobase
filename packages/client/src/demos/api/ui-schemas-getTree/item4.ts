export default {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '邮箱或用户名',
        style: {
          // width: 240,
        },
      },
    },
  },
}