import 'antd/dist/antd.css'
import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { useMemo } from 'react';
import {
  MemoryRouter as Router,
} from 'react-router-dom';
import {
  createRouteSwitch,
  AdminLayout,
  AuthLayout,
  RouteSchemaRenderer,
} from '@nocobase/client';
import { UseRequestProvider } from 'ahooks';
import { extend } from 'umi-request';

const request = extend({
  prefix: process.env.API_URL,
  timeout: 1000,
});

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
    return <Spin/>
  }

  return (
    <div>
      {/* <Router initialEntries={['/admin']}> */}
        <RouteSwitch routes={data} />
      {/* </Router> */}
    </div>
  );
};

export default function IndexPage() {
  return (
    <UseRequestProvider
      value={{
        requestMethod: (service) => request(service),
      }}
    >
      <App />
    </UseRequestProvider>
  );
}
