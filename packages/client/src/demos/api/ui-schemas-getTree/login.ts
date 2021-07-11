export default {
  type: 'object',
  properties: {
    email: {
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
    password: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      'x-component-props': {
        placeholder: '密码',
        style: {
          // width: 240,
        },
      },
    },
    actions: {
      type: 'void',
      'x-component': 'Div',
      properties: {
        submit: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            block: true,
            type: 'primary',
            useAction: '{{ useLogin }}',
            style: {
              width: '100%',
            },
          },
          title: '登录',
        },
      },
    },
    registerlink: {
      type: 'void',
      'x-component': 'Div',
      properties: {
        link: {
          type: 'void',
          'x-component': 'Action.Link',
          'x-component-props': {
            to: '/register',
          },
          title: '注册账号',
        },
      },
    },
  },
};
