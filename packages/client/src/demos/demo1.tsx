import React, { useEffect } from 'react';
import { Spin } from 'antd';
import {
  RouteSwitch,
  useGlobalAction,
  AdminLayout,
  AuthLayout,
  DefaultPage,
} from '@nocobase/client';
import {
  Link,
  useHistory,
  useLocation,
  useRouteMatch,
  MemoryRouter as Router,
} from 'react-router-dom';
import { UseRequestProvider } from 'ahooks';
import { request } from './api';

const templates = {
  AdminLayout,
  AuthLayout,
  DefaultPage,
};

function App() {
  const { data, loading } = useGlobalAction('routes:getAccessible');
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <Router initialEntries={['/login']}>
        <RouteSwitch components={templates} routes={data} />
      </Router>
    </div>
  );
}

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
