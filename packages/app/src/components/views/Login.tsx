import React from 'react';
import { Tooltip, Card, Button } from 'antd';
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

export function Login(props: any) {
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
      <h2>登录</h2>
      
      <SchemaForm
        onSubmit={async values => {
          console.log(values);
          const { data = {} } = await request('/users:login', {
            method: 'post',
            data: values,
          });
          if (data.data && data.data.token) {
            localStorage.setItem('NOCOBASE_TOKEN', data.data.token);
            // @ts-ignore
            setInitialState({
              ...initialState,
              currentUser: data.data,
            });
            await (window as any).routesReload();
            history.push(redirect || '/');
          }
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
            password: {
              type: 'password',
              title: '',
              required: true,
              'x-component-props': {
                size: 'large',
                style: {
                  width: '100%',
                },
                placeholder: '密码',
              },
              'x-props': {
                help: <Link to={'/lostpassword'}>忘记密码？</Link>,
              },
            },
            ...(props.fields || {}),
          },
        }}
      >
        <FormButtonGroup>
          <Submit size={'large'}>登录</Submit>
          <Button
            size={'large'}
            onClick={() => {
              history.push('/register');
            }}
          >
            注册账户
          </Button>
        </FormButtonGroup>
      </SchemaForm>
    </div>
  );
}
