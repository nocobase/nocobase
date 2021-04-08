import React from 'react';
import { Tooltip, Card, Button, message } from 'antd';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  createFormActions,
  createAsyncFormActions,
  Submit,
  Reset,
  FormButtonGroup,
  registerFormFields,
  FormValidator,
  setValidationLanguage,
} from '@formily/antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link, history, request, useModel, useLocation } from 'umi';

export function LostPassword(props: any) {
  const actions = createFormActions();
  const {
    initialState = {},
    loading,
    error,
    refresh,
    setInitialState,
  } = useModel('@@initialState');
  const { redirect } = props.location.query;

  if (loading) {
    return null;
  }

  const { systemSettings = {} } = initialState as any;

  console.log({ systemSettings });

  const { title } = systemSettings || {};

  return (
    <div className={'users-form'}>
      <h1>{title || 'NocoBase'}</h1>
      <h2>忘记密码</h2>
      <SchemaForm
        onSubmit={async values => {
          console.log(values);
          const { data = {} } = await request('/users:lostpassword', {
            method: 'post',
            data: values,
          });
          message.success(`重置链接已发送至邮箱 ${values.email}，请注意查收！`);
        }}
        actions={actions}
        schema={{
          type: 'object',
          properties: {
            email: {
              type: 'string',
              title: '',
              required: true,
              'x-component-props': {
                size: 'large',
                placeholder: '邮箱',
              },
            },
          },
        }}
      >
        <FormButtonGroup>
          <Submit block size={'large'}>获取新密码</Submit>
          <div style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <Link to={'/login'}>使用已有账号登录</Link>
          </div>
        </FormButtonGroup>
      </SchemaForm>
    </div>
  );
}
