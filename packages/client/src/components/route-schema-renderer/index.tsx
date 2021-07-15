import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { SchemaRenderer } from '../../schemas';
import { useForm } from '@formily/react';
import { useHistory } from 'react-router-dom';

export function useLogin() {
  const form = useForm();
  const history = useHistory();
  return {
    async run() {
      await form.submit();
      history.push('/admin');
      console.log(form.values);
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
      <SchemaRenderer scope={{ useLogin, useRegister }} schema={data} />
    </div>
  );
}

export default RouteSchemaRenderer;
