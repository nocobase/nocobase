import { ISchema, useForm } from '@formily/react';
import { SchemaComponent, useAPIClient } from '@nocobase/client';
import { useAuthTranslation } from '../locale';
import React from 'react';
import { message } from 'antd';

const getForgotPasswordForm = (): ISchema => ({
  type: 'object',
  name: 'forgotPasswordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      'x-component': 'Input',
      title: '{{t("重置密码")}}',
      required: true,
      'x-validator': `{{(value) => {
        if (!value) {
          return '';
        }
        if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
          return t("Please enter a valid email");
        }
      }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Please enter your email")}}', style: {} },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("发送重置邮件")}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: () => {
              const form = useForm();
              const api = useAPIClient();
              const { t } = useAuthTranslation();
              return {
                async run() {
                  await form.submit();
                  await api.auth.lostPassword(form.values);
                  message.success(t("Reset email sent successfully"));
                },
              };
            },
          },
        },
      },
    },
    signUp: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '/signin',
      },
      'x-content': '{{t("返回登录")}}',
    },
  },
});

export const ForgotPasswordPage = () => {
  const { t } = useAuthTranslation();
  return <SchemaComponent schema={getForgotPasswordForm()} scope={{ t }} />;
};
