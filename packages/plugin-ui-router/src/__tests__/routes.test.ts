import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';
import Database from '@nocobase/database';

describe('routes', () => {
  let app: Application;
  let agent: Agent;
  let db: Database;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  // it.only('create route', async () => {
  //   const Route = db.getModel('routes');
  //   const item = {
  //     path: '/admin/:name(.+)?',
  //     component: 'AdminLayout',
  //     title: `后台`,
  //     uiSchema: {
  //       name: 'menu',
  //     },
  //   };
  //   console.log(Route.associations);
  //   const route = await Route.create(item);
  //   await route.updateAssociations(item);
  // });

  it('create route', async () => {
    const Route = db.getModel('routes');
    const data = [
      {
        type: 'redirect',
        from: '/',
        to: '/admin',
        exact: true,
      },
      {
        path: '/admin/:name(.+)?',
        component: 'AdminLayout',
        title: `后台`,
        uiSchema: {
          key: 'qqzzjakwkwl',
          name: 'qqzzjakwkwl',
        },
      },
      {
        component: 'AuthLayout',
        children: [
          {
            name: 'login',
            path: '/login',
            component: 'DefaultPage',
            title: `登录`,
            uiSchema: {
              key: 'dtf9j0b8p9u',
              name: 'dtf9j0b8p9u',
            },
          },
          {
            name: 'register',
            path: '/register',
            component: 'DefaultPage',
            title: `注册`,
            uiSchema: {
              key: '46qlxqam3xk',
              name: '46qlxqam3xk',
            },
          },
        ],
      },
    ];
    for (const item of data) {
      const route = await Route.create(item);
      await route.updateAssociations(item);
    }
  });
});
