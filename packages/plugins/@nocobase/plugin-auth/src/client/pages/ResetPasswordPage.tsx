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
      title: '{{t("新密码")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("请输入新密码")}}' },
    },
    confirmPassword: {
      type: 'string',
      'x-component': 'Password',
      title: '{{t("确认密码")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("请再次输入相同的密码")}}' },
      'x-validator': `{{(value, rules, {form}) => {
        if (!value) {
          return '';
        }
        if (value !== form.values.password) {
          return t("两次输入的密码不一致");
        }
      }}}`,
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("确认")}}',
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
                  message.success(t("密码重置成功"));
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
      'x-content': '{{t("去登录")}}',
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
      title="重置链接已失效"
      extra={<Button type="primary" onClick={() => navigate('/signin')}>去登录</Button>}
    />;
  }

  return <SchemaComponent schema={getResetPasswordForm()} scope={{ t }} />;
};
