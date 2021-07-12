import React, { useMemo } from 'react';
import {
  Link,
  useLocation,
  useRouteMatch,
  MemoryRouter as Router,
} from 'react-router-dom';
import { createRouteSwitch, RouteRedirectProps } from '..';
import { AdminLayout } from '../../admin-layout';
import { AuthLayout } from '../../auth-layout';
import { RouteSchemaRenderer } from '../../route-schema-renderer';

const RouteSwitch = createRouteSwitch({
  components: {
    AdminLayout,
    AuthLayout,
    RouteSchemaRenderer,
  },
});

const routes: Array<RouteRedirectProps> = [
  {
    type: 'redirect',
    from: '/',
    to: '/admin',
    exact: true,
  },
  {
    type: 'route',
    path: '/admin/:name(.+)?',
    component: 'AdminLayout',
    title: `后台`,
    uiSchemaKey: 'qqzzjakwkwl',
  },
  {
    type: 'route',
    component: 'AuthLayout',
    children: [
      {
        type: 'route',
        path: '/login',
        component: 'RouteSchemaRenderer',
        title: `登录`,
        uiSchemaKey: 'dtf9j0b8p9u',
      },
      {
        type: 'route',
        path: '/register',
        component: 'RouteSchemaRenderer',
        title: `注册`,
        uiSchemaKey: '46qlxqam3xk',
      },
    ],
  },
];

export default () => {
  return (
    <div>
      <Router initialEntries={['/']}>
        <RouteSwitch routes={routes} />
      </Router>
    </div>
  );
};
