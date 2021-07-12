export const register = {
  key: '46qlxqam3xk',
  type: 'object',
  properties: {
    username: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '用户名',
        style: {
          // width: 240,
        },
      },
    },
    pwd1: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      'x-component-props': {
        placeholder: '密码',
        checkStrength: true,
        style: {
          // width: 240,
        },
      },
    },
    pwd2: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      'x-component-props': {
        placeholder: '密码',
        checkStrength: true,
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
          title: '注册',
          'x-component': 'Action',
          'x-component-props': {
            block: true,
            type: 'primary',
            useAction: '{{ useRegister }}',
            style: {
              width: '100%',
            },
          },
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
            to: '/login',
          },
          title: '使用已有账号登录',
        },
      },
    },
  },
}
