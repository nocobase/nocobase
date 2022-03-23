import { mockServer, MockServer } from '@nocobase/test';
import { IncomingMessage } from 'http';
import * as url from 'url';

describe('multiple apps', () => {
  it('should listen stop event', async () => {
    const app = mockServer();

    const subApp1 = app.multiAppManager.createApplication('sub1', {
      database: app.db,
    });

    const subApp1StopFn = jest.fn();

    subApp1.on('afterStop', subApp1StopFn);

    await app.stop();

    expect(subApp1StopFn).toBeCalledTimes(1);

    await app.destroy();
  });

  it('should listen start event', async () => {
    const app = mockServer();

    const subApp1 = app.multiAppManager.createApplication('sub1', {
      database: app.db,
    });

    const subApp1StartApp = jest.fn();

    await app.stop();

    subApp1.on('beforeStart', subApp1StartApp);

    await app.start();

    expect(subApp1StartApp).toBeCalledTimes(1);

    await app.destroy();
  });
});

describe('multiple application', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create multiple apps', async () => {
    const subApp1 = app.multiAppManager.createApplication('sub1', {
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

    const subApp2 = app.multiAppManager.createApplication('sub2', {
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

    app.multiAppManager.setAppSelector((req: IncomingMessage) => {
      const queryObject = url.parse(req.url, true).query;
      return queryObject['app'] as string;
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
