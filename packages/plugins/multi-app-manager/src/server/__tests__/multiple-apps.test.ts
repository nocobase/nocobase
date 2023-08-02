import { Database } from '@nocobase/database';
import { AppSupervisor, Gateway } from '@nocobase/server';
import { mockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { PluginMultiAppManager } from '../server';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('multiple apps', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({});
    db = app.db;
    await app.cleanDb();
    app.plugin(PluginMultiAppManager);

    await app.loadAndInstall();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should register db creator', async () => {
    const fn = jest.fn();

    const appPlugin = app.getPlugin<PluginMultiAppManager>('PluginMultiAppManager');
    const defaultDbCreator = appPlugin.appDbCreator;

    appPlugin.setAppDbCreator(async (app) => {
      fn();
      await defaultDbCreator(app);
    });

    const name = `td_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: [],
        },
      },
    });

    await AppSupervisor.getInstance().removeApp(name);

    expect(fn).toBeCalled();
  });

  it('should create application', async () => {
    const name = `td_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: [],
        },
      },
    });

    expect(await AppSupervisor.getInstance().getApp(name)).toBeDefined();
  });

  it('should list application with status', async () => {
    const sub1 = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name: sub1,
        options: {
          plugins: [],
        },
      },
    });

    await AppSupervisor.getInstance().removeApp(sub1);

    await sleep(1000);

    const expectStatus = async (appName, status) => {
      const { body } = await app.agent().resource('applications').list();
      const { data } = body;

      const subApp = data.find((item) => item.name === appName);
      expect(subApp.status).toEqual(status);
    };

    await expectStatus(sub1, 'stopped');

    // start sub1
    // const startResponse = await app.agent().resource('applications').send({
    //   action: 'start',
    //   appName: sub1,
    // });

    // expect(startResponse.statusCode).toEqual(200);

    // await expectStatus(sub1, 'started');

    // const stopResponse = await app.agent().resource('applications').send({
    //   action: 'stop',
    //   appName: 'sub1',
    // });
    //
    // await expectStatus('sub1', 'stopped');
  });

  it('should remove application', async () => {
    const name = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: [],
        },
      },
    });

    expect(AppSupervisor.getInstance().hasApp(name)).toBeTruthy();

    await db.getRepository('applications').destroy({
      filter: {
        name,
      },
    });

    expect(AppSupervisor.getInstance().hasApp(name)).toBeFalsy();
  });

  it('should create with plugins', async () => {
    const name = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: [['ui-schema-storage', { test: 'B' }]],
        },
      },
    });

    const miniApp = await AppSupervisor.getInstance().getApp(name);
    expect(miniApp).toBeDefined();

    const plugin = miniApp.pm.get('ui-schema-storage');

    expect(plugin).toBeDefined();
    expect(plugin.options).toMatchObject({
      test: 'B',
    });
  });

  it('should lazy load applications', async () => {
    const name = `td_${uid()}`;

    // create app instance
    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['ui-schema-storage'],
        },
      },
    });

    // remove it from supervisor
    await AppSupervisor.getInstance().removeApp(name);

    expect(AppSupervisor.getInstance().hasApp(name)).toBeFalsy();

    Gateway.getInstance().appSelector = () => name;

    await AppSupervisor.getInstance().getApp(name);

    expect(AppSupervisor.getInstance().hasApp(name)).toBeTruthy();
  });

  it('should upgrade sub apps when main app upgrade', async () => {
    const subAppName = `t_${uid()}`;

    await app.db.getRepository('applications').create({
      values: {
        name: subAppName,
        options: {
          plugins: [],
        },
      },
    });

    const subApp = await AppSupervisor.getInstance().getApp(subAppName);
    const jestFn = jest.fn();

    subApp.on('afterUpgrade', () => {
      jestFn();
    });

    await app.upgrade();

    expect(jestFn).toBeCalled();
  });

  it('should start automatically', async () => {
    const subAppName = `t_${uid()}`;

    const subApp = await app.db.getRepository('applications').create({
      values: {
        name: subAppName,
        options: {},
      },
    });

    await AppSupervisor.getInstance().removeApp(subAppName);

    await app.start();

    expect(AppSupervisor.getInstance().hasApp(subAppName)).toBeFalsy();

    await subApp.update({
      options: {
        autoStart: true,
      },
    });

    await AppSupervisor.getInstance().removeApp(subAppName);

    expect(AppSupervisor.getInstance().hasApp(subAppName)).toBeFalsy();

    await app.start();

    expect(AppSupervisor.getInstance().hasApp(subAppName)).toBeTruthy();
  });

  it('should get same obj ref when asynchronously access with same sub app name', async () => {
    const subAppName = `t_${uid()}`;

    await app.db.getRepository('applications').create({
      values: {
        name: subAppName,
        options: {},
      },
    });

    await AppSupervisor.getInstance().removeApp(subAppName);

    expect(AppSupervisor.getInstance().hasApp(subAppName)).toBeFalsy();

    const instances = [];

    AppSupervisor.getInstance().on('afterAppAdded', (subApp) => {
      instances.push(subApp);
    });

    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        (async () => {
          await AppSupervisor.getInstance().getApp(subAppName);
        })(),
      );
    }
    await Promise.all(promises);

    expect(instances.length).toBe(1);
    expect(instances[0]).toBeDefined();
    expect(instances[0].name).toEqual(subAppName);
  });
});
