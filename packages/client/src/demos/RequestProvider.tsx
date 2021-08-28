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
} from '../';
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
  await next();
});

export const RequestProvider = (props) => {
  return (
    <UseRequestProvider
      value={{
        requestMethod: (service) => request(service),
      }}
    >
      {props.children}
    </UseRequestProvider>
  );
};
