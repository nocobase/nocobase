import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import {
  createRouteSwitch,
  RouteRedirectProps,
  AdminLayout,
  AuthLayout,
  RouteSchemaRenderer,
  ConfigProvider,
  ClientSDK,
} from '../';
import { UseRequestProvider } from 'ahooks';
import { extend } from 'umi-request';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const request = extend({
  prefix: process.env.API_BASE_PATH,
  timeout: 30000,
});

request.use(async (ctx, next) => {
  const { headers } = ctx.req.options as any;
  const token = localStorage.getItem('NOCOBASE_TOKEN');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Hostname'] = process.env.API_HOSTNAME;
  }
  await next();
});

const client = new ClientSDK({
  request,
});

console.log('process.env.API_BASE_PATH', process.env.API_BASE_PATH);

// console.log = () => {}

const RouteSwitch = createRouteSwitch({
  components: {
    AdminLayout,
    AuthLayout,
    RouteSchemaRenderer,
  },
});

const App = () => {
  const { data, loading } = useRequest('routes:getAccessible', {
    formatResult: (result) => result?.data,
  });

  if (loading) {
    return <Spin size={'large'} className={'nb-spin-center'} />;
  }

  return (
    <div>
      <Router initialEntries={['/admin']}>
        <RouteSwitch routes={data} />
      </Router>
    </div>
  );
};

export default () => {
  return (
    <ConfigProvider client={client}>
      <App />
    </ConfigProvider>
  );
};
