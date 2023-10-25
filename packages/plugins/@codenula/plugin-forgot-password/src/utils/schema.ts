import { ISchema } from '@formily/react';
export const verifyOtp: ISchema = {
    type: 'object',
    name: 'passwordForm',
    'x-component': 'FormV2',
    properties: {
      
      otp: {
        type: 'integer',
        'x-component': 'Password',
        required: true,
        'x-decorator': 'FormItem',
        'x-component-props': {
          placeholder: '{{"Enter OTP"}}',
          style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
        },
      },
      actions: {
        type: 'void',
        'x-component': 'div',
        properties: {
          submit: {
            title: '{{"Verify OTP"}}',
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              htmlType: 'submit',
              block: true,
              type: 'primary',
              useAction: `{{ useVerifyOtp }}`,
              style: { width: '100%', height: '44px' },
            },
          },
        },
      },
   
  
    },
  };
  export const resetPassword: ISchema = {
    type: 'object',
    name: 'passwordForm',
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
      // password: {
      //   type: 'string',
      //   'x-component': 'Password',
      //   required: true,
      //   'x-decorator': 'FormItem',
      //   'x-component-props': {
      //     placeholder: '{{"Password"}}',
      //     style: { backgroundColor: '#e7f0fe', color: 'blue', height: '50px', padding: '10px 19px' },
      //   },
      // },
      actions: {
        type: 'void',
        'x-component': 'div',
        properties: {
          submit: {
            title: '{{"Send OTP"}}',
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              htmlType: 'submit',
              block: true,
              type: 'primary',
              useAction: `{{ useSetNewPassword }}`,
              style: { width: '100%', height: '44px' },
            },
          },
        },
      },
    },
  };