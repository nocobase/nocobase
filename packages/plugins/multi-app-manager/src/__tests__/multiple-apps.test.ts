import { Database } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import { ApplicationModel } from '..';
import { PluginMultiAppManager } from '../server';

describe('multiple apps create', () => {
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

  it('should create application', async () => {
    const miniApp = await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
      },
    });

    expect(app.appManager.applications.get('miniApp')).toBeDefined();
  });

  it('should remove application', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
      },
    });

    expect(app.appManager.applications.get('miniApp')).toBeDefined();

    await db.getRepository('applications').destroy({
      filter: {
        name: 'miniApp',
      },
    });

    expect(app.appManager.applications.get('miniApp')).toBeUndefined();
  });

  it('should create with plugins', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
        options: {
          plugins: [['@nocobase/plugin-ui-schema-storage', { test: 'B' }]],
        },
      },
    });

    const miniApp = app.appManager.applications.get('miniApp');
    expect(miniApp).toBeDefined();

    const plugin = miniApp.pm.get('@nocobase/plugin-ui-schema-storage');

    expect(plugin).toBeDefined();
    expect(plugin.options).toEqual({
      test: 'B',
    });
  });

  it('should lazy load applications', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
        options: {
          plugins: ['@nocobase/plugin-ui-schema-storage'],
        },
      },
    });

    await app.appManager.removeApplication('miniApp');

    app.appManager.setAppSelector(() => {
      return 'miniApp';
    });

    expect(app.appManager.applications.has('miniApp')).toBeFalsy();

    await app.agent().resource('test').test();

    expect(app.appManager.applications.has('miniApp')).toBeTruthy();
  });

  it('should change handleAppStart', async () => {
    const customHandler = jest.fn();
    ApplicationModel.handleAppStart = customHandler;

    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
        options: {
          plugins: ['@nocobase/plugin-ui-schema-storage'],
        },
      },
    });

    expect(customHandler).toHaveBeenCalledTimes(1);
  });
});
