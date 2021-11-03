export const login = {
  key: 'dtf9j0b8p9u',
  type: 'object',
  title: '{{t("Login")}}',
  properties: {
    email: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '{{t("Email")}}',
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
        placeholder: '{{t("Password")}}',
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
          title: '{{t("Login")}}',
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
          title: '{{t("Register an account")}}',
        },
      },
    },
  },
};
