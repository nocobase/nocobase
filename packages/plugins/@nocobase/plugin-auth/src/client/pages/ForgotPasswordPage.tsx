import { ISchema, useForm } from '@formily/react';
import { SchemaComponent, useAPIClient } from '@nocobase/client';
import { useAuthTranslation } from '../locale';
import React from 'react';
import { message } from 'antd';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthenticator } from '../authenticator';

const getForgotPasswordForm = (): ISchema => ({
  type: 'object',
  name: 'forgotPasswordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      'x-component': 'Input',
      title: '{{t("Reset password")}}',
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
          title: '{{t("Send reset email")}}',
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
              const [loading, setLoading] = React.useState(false);
              return {
                async run() {
                  await form.submit();
                  setLoading(true);
                  try {
                    await api.auth.lostPassword(form.values);
                  } finally {
                    setLoading(false);
                  }
                  message.success(t('Reset email sent successfully'));
                  form.reset();
                },
                loading,
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
      'x-content': '{{t("Back to login")}}',
    },
  },
});

export const ForgotPasswordPage = () => {
  const { t } = useAuthTranslation();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);

  if (!authenticator?.options?.enableResetPassword) {
    return <Navigate to="/not-found" replace={true} />;
  }

  return <SchemaComponent schema={getForgotPasswordForm()} scope={{ t }} />;
};
