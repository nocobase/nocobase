import { Database } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
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
    const name = `td_${uid()}`;
    const miniApp = await db.getRepository('applications').create({
      values: {
        name,
      },
    });

    expect(app.appManager.applications.get(name)).toBeDefined();
  });

  it('should remove application', async () => {
    const name = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name,
      },
    });

    expect(app.appManager.applications.get(name)).toBeDefined();

    await db.getRepository('applications').destroy({
      filter: {
        name,
      },
    });

    expect(app.appManager.applications.get(name)).toBeUndefined();
  });

  it('should create with plugins', async () => {
    const name = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: [['@nocobase/plugin-ui-schema-storage', { test: 'B' }]],
        },
      },
    });

    const miniApp = app.appManager.applications.get(name);
    expect(miniApp).toBeDefined();

    const plugin = miniApp.pm.get('@nocobase/plugin-ui-schema-storage');

    expect(plugin).toBeDefined();
    expect(plugin.options).toMatchObject({
      test: 'B',
    });
  });

  it('should lazy load applications', async () => {
    const name = `td_${uid()}`;
    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['@nocobase/plugin-ui-schema-storage'],
        },
      },
    });

    await app.appManager.removeApplication(name);

    app.appManager.setAppSelector(() => {
      return name;
    });

    expect(app.appManager.applications.has(name)).toBeFalsy();

    await app.agent().resource('test').test();

    expect(app.appManager.applications.has(name)).toBeTruthy();
  });

  it('should change handleAppStart', async () => {
    const customHandler = jest.fn();
    ApplicationModel.handleAppStart = customHandler;
    const name = `td_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['@nocobase/plugin-ui-schema-storage'],
        },
      },
    });

    expect(customHandler).toHaveBeenCalledTimes(1);
  });
});
