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
import { Redirect, history, request, useModel, useHistory } from 'umi';
import api from '@/api-client';
import { useRequest } from 'umi';

const { onFieldValueChange$ } = FormEffectHooks

const useLinkageValidateEffects = () => {
  const { setFieldState, getFieldState } = createFormActions()
  onFieldValueChange$('*(password,confirm)').subscribe(fieldState => {
    const selfName = fieldState.name
    const selfValue = fieldState.value
    const otherName = selfName == 'password' ? 'confirm' : 'password'
    const otherValue = getFieldState(otherName, state => state.value)
    setFieldState(otherName, state => {
      if (selfValue && otherValue && selfValue !== otherValue) {
        state.errors = ['两次密码输入不一致']
      } else {
        state.errors = []
      }
    })
    setFieldState(selfName, state => {
      if (selfValue && otherValue && selfValue !== otherValue) {
        state.errors = ['两次密码输入不一致']
      } else {
        state.errors = []
      }
    })
  })
}

export function ResetPassword(props: any) {
  const actions = createFormActions();
  const { initialState = {}, loading: stateLoading, error, refresh, setInitialState } = useModel('@@initialState');

  const history = useHistory<any>();
  // @ts-ignore
  const { token } = history.location.query;
  console.log({ token })
  const { data = {}, loading } = useRequest(() => {
    return api.resource('users').getUserByResetToken({
      token,
    });
  });

  if (stateLoading || loading) {
    return null;
  }

  if (!data.id) {
    return <Redirect to={'/login'}/>
  }

  const { systemSettings = {} } = initialState as any;

  console.log({systemSettings});

  const { title } = systemSettings || {};

  return (
    <div className={'users-form'}>
      <h1>{title || 'NocoBase'}</h1>
      <h2>重置密码</h2>
      <SchemaForm 
      effects={() => {
        useLinkageValidateEffects()
      }}
      initialValues={{
        email: data.email,
      }}
      onSubmit={async (values) => {
        console.log(values);
        const { data = {} } = await request('/users:resetpassword', {
          method: 'post',
          data: {
            ...values,
            reset_token: token,
          },
        });
        await actions.reset({
          validate: false,
          forceClear: true,
        });
        message.success('密码重置成功，将跳转至登录页');
        setTimeout(() => {
          history.push('/login');
        }, 1000);
      }} actions={actions} schema={{
        type: 'object',
        properties: {
          email: {
            type: 'string',
            title: '',
            required: true,
            'x-component-props': {
              size: 'large',
              placeholder: '邮箱',
              disabled: true,
            }
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
            }
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
            }
          },
        }
      }}>
        <FormButtonGroup align={'start'}>
          <Submit size={'large'}>重置密码</Submit>
          <Button size={'large'} onClick={() => {
            history.push('/login');
          }}>使用已有账号登录</Button>
        </FormButtonGroup>
      </SchemaForm>
    </div>
  );
}
