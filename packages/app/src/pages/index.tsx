import 'antd/dist/antd.css';
import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import {
  createRouteSwitch,
  AdminLayout,
  AuthLayout,
  RouteSchemaRenderer,
  ConfigProvider,
  ClientSDK,
} from '@nocobase/client';
import { extend } from 'umi-request';

console.log(`${location.protocol}//${location.hostname}:${process.env.API_PORT}/api/`);

const request = extend({
  prefix: `${location.protocol}//${location.hostname}:${process.env.API_PORT}/api/`,
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

const client = new ClientSDK({ request });

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
    return <Spin />;
  }

  return (
    <div>
      <RouteSwitch routes={data} />
    </div>
  );
};

export default function IndexPage() {
  return (
    <ConfigProvider client={client}>
      <App />
    </ConfigProvider>
  );
}
