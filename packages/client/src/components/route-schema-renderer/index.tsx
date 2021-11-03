import React, { useContext, useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { SchemaRenderer } from '../../schemas';
import { useForm } from '@formily/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSystemSettings } from '../admin-layout/SiteTitle';
import { useClient } from '../../constate';
import { useCompile } from '../../hooks/useCompile';

function Div(props) {
  return <div {...props}></div>;
}

export function useLogin() {
  const form = useForm();
  const history = useHistory();
  const location = useLocation<any>();
  const query = new URLSearchParams(location.search);
  const redirect = query.get('redirect');
  const { request } = useClient();
  return {
    async run() {
      await form.submit();
      const { data } = await request('users:login', {
        method: 'post',
        data: form.values,
      });
      history.push(redirect || '/admin');
      localStorage.setItem('NOCOBASE_TOKEN', data?.token);
    },
  };
}

export function useRegister() {
  const form = useForm();
  const history = useHistory();
  const { request } = useClient();
  return {
    async run() {
      await form.submit();
      const { data } = await request('users:register', {
        method: 'post',
        data: form.values,
      });
      message.success('注册成功，将跳转登录页');
      setTimeout(() => {
        history.push('/login');
      }, 1000);
      console.log(form.values);
    },
  };
}

export function RouteSchemaRenderer({ route }) {
  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree/${route.uiSchemaKey}`,
    {
      refreshDeps: [route],
      formatResult: (result) => result?.data,
    },
  );
  const compile = useCompile();
  const { title } = useSystemSettings();
  if (loading) {
    return <Spin size={'large'} className={'nb-spin-center'} />;
  }
  return (
    <div>
      <Helmet>
        <title>{title ? `${compile(data.title)} - ${title}` : compile(data.title)}</title>
      </Helmet>
      <SchemaRenderer
        components={{ Div }}
        scope={{ useLogin, useRegister }}
        schema={data}
      />
    </div>
  );
}

export default RouteSchemaRenderer;
