import { mockServer, MockServer } from '@nocobase/test';
import { PluginMultipleApps } from '../server';

describe('multiple apps', () => {
  let app: MockServer;

  let pluginMultipleApps: PluginMultipleApps;

  beforeEach(async () => {
    app = mockServer();
    app.plugin(PluginMultipleApps);

    await app.loadAndInstall();

    pluginMultipleApps = app.getPlugin('PluginMultipleApps');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create application', async () => {
    const subApp1 = pluginMultipleApps.createApplication('sub1', {
      database: app.db,
    });

    subApp1.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = 'sub1';
        },
      },
    });

    const subApp2 = pluginMultipleApps.createApplication('sub2', {
      database: app.db,
    });

    subApp2.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = 'sub2';
        },
      },
    });

    let response = await app.agent().resource('test').test();
    expect(response.statusCode).toEqual(404);

    pluginMultipleApps.setAppSelector((ctx) => {
      return ctx.request.query['app'];
    });

    response = await app.agent().resource('test').test({
      app: 'sub1',
    });
    expect(response.statusCode).toEqual(200);

    response = await app.agent().resource('test').test({
      app: 'sub2',
    });
    expect(response.statusCode).toEqual(200);
  });
});
