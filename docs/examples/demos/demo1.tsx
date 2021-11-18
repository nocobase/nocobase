import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import {
  createRouteSwitch,
  RouteRedirectProps,
  AdminLayout,
  AuthLayout,
  RouteSchemaRenderer,
  ConfigProvider,
  ClientSDK,
} from '@nocobase/client';
import { UseRequestProvider } from 'ahooks';
import { extend } from 'umi-request';

const request = extend({
  prefix: process.env.API_URL,
  timeout: 30000,
});

request.use(async (ctx, next) => {
  const { headers } = ctx.req.options as any;
  const token = localStorage.getItem('NOCOBASE_TOKEN');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  headers['X-Hostname'] = window.location.hostname;
  await next();
});

const client = new ClientSDK({
  request,
});

console.log('process.env.API_URL', process.env.API_URL);

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
      <Router>
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
