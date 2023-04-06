import { mockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { IncomingMessage } from 'http';
import * as url from 'url';
import Application from '../application';

describe('multiple apps', () => {
  it('should emit beforeGetApplication event', async () => {
    const beforeGetApplicationFn = jest.fn();

    const app = mockServer();

    app.on('beforeGetApplication', beforeGetApplicationFn);

    app.appManager.addSubApp(
      new Application({
        database: app.db,
        name: 'sub1',
      }),
    );

    app.appManager.setAppSelector(() => 'sub1');

    await app.agent().resource('test').test({});

    await app.agent().resource('test').test({});

    expect(beforeGetApplicationFn).toHaveBeenCalledTimes(2);

    await app.destroy();
  });

  it('should listen stop event', async () => {
    const app = mockServer();

    const subApp1 = app.appManager.addSubApp(
      new Application({
        database: app.db,
        name: 'sub1',
      }),
    );

    const subApp1StopFn = jest.fn();

    subApp1.on('afterStop', subApp1StopFn);

    await app.stop();

    expect(subApp1StopFn).toBeCalledTimes(1);
  });
});

describe('multiple application', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer({
      acl: false,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should add multiple apps', async () => {
    const sub1 = `a_${uid()}`;
    const sub2 = `a_${uid()}`;
    const sub3 = `a_${uid()}`;

    const subApp1 = app.appManager.addSubApp(
      new Application({
        database: app.db,
        acl: false,
        name: sub1,
      }),
    );

    subApp1.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = sub1;
        },
      },
    });

    const subApp2 = app.appManager.addSubApp(
      new Application({
        database: app.db,
        acl: false,
        name: sub2,
      }),
    );

    subApp2.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = sub2;
        },
      },
    });

    let response = await app.agent().resource('test').test();
    expect(response.statusCode).toEqual(404);

    app.appManager.setAppSelector((req: IncomingMessage) => {
      const queryObject = url.parse(req.url, true).query;
      return queryObject['app'] as string;
    });

    response = await app.agent().resource('test').test({
      app: sub1,
    });

    expect(response.statusCode).toEqual(200);

    response = await app.agent().resource('test').test({
      app: sub2,
    });
    expect(response.statusCode).toEqual(200);

    response = await app.agent().resource('test').test({
      app: sub3,
    });
    expect(response.statusCode).toEqual(404);
  });
});
