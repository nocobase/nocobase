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
  FormEffectHooks,
  FormValidator,
  setValidationLanguage,
} from '@formily/antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link, history, request, useModel } from 'umi';

const { onFieldValueChange$ } = FormEffectHooks;

const useLinkageValidateEffects = () => {
  const { setFieldState, getFieldState } = createFormActions();
  onFieldValueChange$('*(password,confirm)').subscribe(fieldState => {
    const selfName = fieldState.name;
    const selfValue = fieldState.value;
    const otherName = selfName == 'password' ? 'confirm' : 'password';
    const otherValue = getFieldState(otherName, state => state.value);
    setFieldState(otherName, state => {
      if (selfValue && otherValue && selfValue !== otherValue) {
        state.errors = ['两次密码输入不一致'];
      } else {
        state.errors = [];
      }
    });
    setFieldState(selfName, state => {
      if (selfValue && otherValue && selfValue !== otherValue) {
        state.errors = ['两次密码输入不一致'];
      } else {
        state.errors = [];
      }
    });
  });
};

export function Register(props: any) {
  const actions = createFormActions();
  const {
    initialState = {},
    loading,
    error,
    refresh,
    setInitialState,
  } = useModel('@@initialState');

  if (loading) {
    return null;
  }

  const { systemSettings = {} } = initialState as any;

  console.log({ systemSettings });

  const { title } = systemSettings || {};

  return (
    <div className={'users-form'}>
      <h1>{title}</h1>
      <h2>注册</h2>
      <SchemaForm
        effects={() => {
          useLinkageValidateEffects();
        }}
        onSubmit={async values => {
          console.log(values);
          try {
            const { data = {} } = await request('/users:register', {
              method: 'post',
              data: values,
            });
            await actions.reset({
              validate: false,
              forceClear: true,
            });
            message.success('注册成功，将跳转登录页');
            setTimeout(() => {
              history.push('/login');
            }, 1000);
          } catch (error) {
            if (typeof error.data === 'string') {
              message.error(error.data);
            }
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
            // nickname: {
            //   type: 'string',
            //   title: '',
            //   'x-component-props': {
            //     size: 'large',
            //     placeholder: '昵称',
            //   },
            // },
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
            },
            confirm: {
              type: 'password',
              title: '',
              required: true,
              'x-component-props': {
                size: 'large',
                style: {
                  width: '100%',
                },
                placeholder: '确认密码',
              },
            },
            ...(props.fields || {}),
          },
        }}
      >
        <FormButtonGroup align={'start'}>
          <Submit block size={'large'}>注册</Submit>
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
