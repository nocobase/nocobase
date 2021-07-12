export default [
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
