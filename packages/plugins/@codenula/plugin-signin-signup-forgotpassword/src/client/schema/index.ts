import { ISchema } from '@formily/react';
export const signupSchema: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
          if (!value) {
            return "Please enter your email";
          }
        
            if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
              return "Please enter a valid email";
            }
          
        }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Email"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    username: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
          if (!value) {
            return "Please enter your username ";
          }
          if (value.includes('@')) {
            if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
              return "Please enter a valid email";
            }
          } else {
            return /^[^@.<>"'/]{2,16}$/.test(value) || "Please enter a valid username";
          }
        }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Username"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Password"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Sign up"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useBasicSignUp }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
    signin: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signinLink }}',
        style: {
          height: '50px',
          padding: '10px 19px',
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '20px',
        },
      },
      'x-content': '{{"Login with an existing account"}}',
      'x-visible': '{{ allowSignUp }}',
    },
  },
};
export const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    account: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
          if (!value) {
            return "Please enter your username or email";
          }
          if (value.includes('@')) {
            if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
              return "Please enter a valid email";
            }
          } else {
            return /^[^@.<>"'/]{2,16}$/.test(value) || "Please enter a valid username";
          }
        }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Username/Email"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Password"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Sign in"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useBasicSignIn }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
    signup: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signupLink }}',
        style: {
          height: '50px',
          padding: '10px 19px',
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '20px',
        },
      },
      'x-content': '{{"Create an account test"}}',
      'x-visible': '{{ allowSignUp }}',
    },
    forgotPassword: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ forgotPasswordLink }}',
        style: {
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '3px',
        },
      },
      'x-content': '{{"Forgot Password?"}}',
      'x-visible': '{{ allowSignUp }}',
    },
  },
};
export const forgotPasswordForm: ISchema = {
  type: 'object',
  name: 'forgotPasswordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
          if (!value) {
            return "Please enter your username or email";
          }
          if (value.includes('@')) {
            if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
              return "Please enter a valid email";
            }
          } else {
            return /^[^@.<>"'/]{2,16}$/.test(value) || "Please enter a valid username";
          }
        }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': {
        placeholder: '{{"Enter your email"}}',
        style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      },
    },

    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{"Send Reset Link"}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useForgotPasswordEmailSubmit }}`,
            style: { width: '100%', height: '44px' },
          },
        },
      },
    },
    signup: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signinLink }}',
        style: {
          height: '50px',
          padding: '10px 19px',
          with: '100%',
          display: 'block',
          textAlign: 'center',
          marginTop: '20px',
        },
      },
      'x-content': '{{"Sign in"}}',
      'x-visible': 'true',
    },
  },
};
