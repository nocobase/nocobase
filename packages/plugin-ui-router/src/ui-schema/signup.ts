export const signup = {
  key: '46qlxqam3xk',
  type: 'object',
  title: '{{t("Sign up")}}',
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
        checkStrength: true,
        style: {
          // width: 240,
        },
      },
      'x-reactions': [
        {
          dependencies: ['.confirm_password'],
          fulfill: {
            state: {
              errors:
                '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
            },
          },
        },
      ],
    },
    confirm_password: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      'x-component-props': {
        placeholder: '{{t("Confirm password")}}',
        checkStrength: true,
        style: {
          // width: 240,
        },
      },
      'x-reactions': [
        {
          dependencies: ['.password'],
          fulfill: {
            state: {
              errors:
                '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
            },
          },
        },
      ],
    },
    actions: {
      type: 'void',
      'x-component': 'Div',
      properties: {
        submit: {
          type: 'void',
          title: '{{t("Sign up")}}',
          'x-component': 'Action',
          'x-component-props': {
            block: true,
            type: 'primary',
            useAction: '{{ useSignup }}',
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
            to: '/signin',
          },
          title: '{{t("Log in with an existing account")}}',
        },
      },
    },
  },
}
