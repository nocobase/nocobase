import { RouteRedirectProps } from '@nocobase/client';

export default [
  {
    type: 'route',
    path: '/',
    exact: true,
    component: 'RouteSchemaComponent',
    schema: {
      name: 'home',
      'x-component': 'Hello',
      'x-component-props': {
        name: 'Home',
      },
    },
  },
  {
    type: 'route',
    path: '/about',
    component: 'RouteSchemaComponent',
    schema: {
      name: 'home',
      'x-component': 'Hello',
      'x-component-props': {
        name: 'About',
      },
    },
  },
] as Array<RouteRedirectProps>;
