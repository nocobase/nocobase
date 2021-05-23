import React from 'react';
import {
  Link,
  useLocation,
  useRouteMatch,
  MemoryRouter as Router,
} from 'react-router-dom';
import {
  RouteSwitch,
  AuthLayout,
  AdminLayout,
  PageTemplate,
} from '@nocobase/client';

const routes = [
  {
    path: '/admin/:slug(.+)?',
    component: 'AdminLayout',
  },
  {
    component: 'AuthLayout',
    routes: [
      {
        name: 'login',
        path: '/login',
        component: 'PageTemplate',
        title: '登录',
      },
      {
        name: 'register',
        path: '/register',
        component: 'PageTemplate',
        title: '注册',
      },
    ],
  },
  {
    type: 'redirect',
    from: '/',
    to: '/admin',
    exact: true,
  },
];

const components = {
  AuthLayout,
  AdminLayout,
  PageTemplate,
};

function App() {
  const location = useLocation();
  return (
    <div>
      <div>{location.pathname}</div>
      <ul>
        <li><Link to={'/login'}>path=/login</Link></li>
        <li><Link to={'/register'}>path=/register</Link></li>
        <li><Link to={'/'}>path=/</Link></li>
        <li><Link to={'/admin/welcome'}>path=/admin/welcome</Link></li>
      </ul>
      <RouteSwitch routes={routes} components={components} />
    </div>
  );
}

export default () => {
  return (
    <Router initialEntries={['/login']}>
      <App />
    </Router>
  );
};
