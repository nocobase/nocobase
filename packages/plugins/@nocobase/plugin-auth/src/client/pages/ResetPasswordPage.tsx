import { ISchema, useForm } from '@formily/react';
import { SchemaComponent, useAPIClient, useNavigateNoUpdate } from '@nocobase/client';
import { useAuthTranslation } from '../locale';
import React, { useEffect } from 'react';
import { Button, message, Result } from 'antd';

const getResetPasswordForm = (): ISchema => ({
  type: 'object',
  name: 'resetPasswordForm',
  'x-component': 'FormV2',
  properties: {
    password: {
      type: 'string',
      'x-component': 'Password',
      title: '{{t("New password")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Please enter new password")}}' },
    },
    confirmPassword: {
      type: 'string',
      'x-component': 'Password',
      title: '{{t("Confirm password")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Please enter the same password again")}}' },
      'x-validator': `{{(value, rules, {form}) => {
        if (!value) {
          return '';
        }
        if (value !== form.values.password) {
          return t("The passwords entered twice are inconsistent");
        }
      }}}`,
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("Confirm")}}',
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
              const resetToken = new URLSearchParams(window.location.search).get('resetToken');
              return {
                async run() {
                  await form.submit();
                  await api.auth.resetPassword({ ...form.values, resetToken });
                  message.success(t("Password reset successful"));
                  setTimeout(() => {
                    window.location.href = '/signin';
                  }, 1000);
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
      'x-content': '{{t("Go to login")}}',
    },
  },
});

export const ResetPasswordPage = () => {
  const { t } = useAuthTranslation();
  const api = useAPIClient();
  const resetToken = new URLSearchParams(window.location.search).get('resetToken');
  const navigate = useNavigateNoUpdate();
  const [expired, setExpired] = React.useState(false);

  useEffect(() => {
    api.auth.checkResetToken({ resetToken }).then(() => {
      setExpired(false);
    }).catch((error) => {
      setExpired(true);
    });
  }, []);

  if (!resetToken || expired) {
    return <Result
      status="403"
      title={t('Reset link has expired')}
      extra={<Button type="primary" onClick={() => navigate('/signin')}>{t('Go to login')}</Button>}
    />;
  }

  return <SchemaComponent schema={getResetPasswordForm()} scope={{ t }} />;
};
