import { AppSupervisor } from '../app-supervisor';
import Application from '../application';

describe('App Supervisor', () => {
  it('should add app', () => {
    const appSupervisor = AppSupervisor.getInstance();

    const app = new Application({
      database: {
        dialect: 'sqlite',
        dialectModule: require('sqlite3'),
        storage: ':memory:',
        logging: false,
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });

    expect(appSupervisor.getApp(app.name)).toBe(app);
  });
});
