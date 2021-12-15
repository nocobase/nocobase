import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { createRouteSwitch, RouteRedirectProps } from '@nocobase/client';

const RouteSwitch = createRouteSwitch({
  components: {
    Signin: () => <div>Signin</div>,
    Home: (props) => <div>Home {props.children}</div>,
    Page: () => <div>Page</div>,
  },
});

const routes: Array<RouteRedirectProps> = [
  {
    type: 'route',
    path: '/signin',
    exact: true,
    component: 'Signin',
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
        component: 'Page',
      },
    ],
  },
];

export default () => {
  return (
    <div>
      <Router initialEntries={['/home/123']}>
        <RouteSwitch routes={routes} />
      </Router>
    </div>
  );
};
