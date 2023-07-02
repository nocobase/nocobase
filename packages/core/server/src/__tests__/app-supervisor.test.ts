import { AppSupervisor } from '../app-supervisor';
import Application from '../application';

describe('App Supervisor', () => {
  afterEach(async () => {
    await AppSupervisor.getInstance().destroy();
  });

  it('should add app into supervisor', async () => {
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

    expect(await appSupervisor.getApp(app.name)).toBe(app);
  });

  it('should rpc call to app', async () => {
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
      name: 'main',
    });

    const results = await appSupervisor.rpcCall('main', 'db.collectionGroupManager.getGroups');
    expect(results.result).toBeDefined();

    const options = await appSupervisor.rpcCall('main', 'db.options.dialect');
    expect(options.result).toEqual('sqlite');
  });
});
