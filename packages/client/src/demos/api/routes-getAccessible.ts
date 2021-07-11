import Mock from 'mockjs';

export default [
  {
    type: 'redirect',
    from: '/admin',
    to: '/admin/item2',
    exact: true,
  },
  {
    type: 'redirect',
    from: '/',
    to: '/admin',
    exact: true,
  },
  {
    path: '/admin/:name(.+)?',
    component: 'AdminLayout',
    title: `后台 - ${Mock.mock('@string')}`,
    schemaName: 'menu',
  },
  {
    component: 'AuthLayout',
    routes: [
      {
        name: 'login',
        path: '/login',
        component: 'DefaultPage',
        title: `登录 - ${Mock.mock('@string')}`,
        schemaName: 'login',
      },
      {
        name: 'register',
        path: '/register',
        component: 'DefaultPage',
        title: `注册 - ${Mock.mock('@string')}`,
        schemaName: 'register',
      },
    ],
  },
]
