import React, { useMemo } from 'react';
import {
  Link,
  useLocation,
  useRouteMatch,
  MemoryRouter as Router,
} from 'react-router-dom';
import { createRouteSwitch, RouteRedirectProps } from '..';

const RouteSwitch = createRouteSwitch({
  components: {
    Home: (props) => {
      console.log({ props });
      return <div>Home {props.children}</div>;
    },
    Login: () => <div>Login</div>,
  },
});

export default () => {
  const routes: Array<RouteRedirectProps> = [
    {
      type: 'route',
      path: '/login',
      exact: true,
      component: 'Login',
    },
    {
      type: 'route',
      path: '/home',
      component: 'Home',
      routes: [
        {
          type: 'route',
          path: '/home/123',
          exact: true,
          component: 'Login',
        },
      ],
    },
  ];
  return (
    <div>
      <Router initialEntries={['/home/123']}>
        <RouteSwitch routes={routes} />
      </Router>
    </div>
  );
};
