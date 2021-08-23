import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { request, SchemaRenderer } from '../../schemas';
import { useForm } from '@formily/react';
import { useHistory } from 'react-router-dom';

function Div(props) {
  return <div {...props}></div>
}

export function useLogin() {
  const form = useForm();
  const history = useHistory();
  return {
    async run() {
      await form.submit();
      const { data } = await request('users:login', {
        method: 'post',
        data: form.values,
      });
      history.push('/admin');
      localStorage.setItem('NOCOBASE_TOKEN', data?.data?.token);
      console.log('NOCOBASE_TOKEN', data?.data?.token);
    },
  };
}

export function useRegister() {
  const form = useForm();
  return {
    async run() {
      await form.submit();
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
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <SchemaRenderer components={{ Div }} scope={{ useLogin, useRegister }} schema={data} />
    </div>
  );
}

export default RouteSchemaRenderer;
