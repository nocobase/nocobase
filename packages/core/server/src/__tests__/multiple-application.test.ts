import { Gateway } from '@nocobase/server';
import { mockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { IncomingMessage } from 'http';
import * as url from 'url';
import Application from '../application';

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

    const subApp1 = new Application({
      database: app.db,
      acl: false,
      name: sub1,
    });

    subApp1.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          ctx.body = sub1;
        },
      },
    });

    const subApp2 = new Application({
      database: app.db,
      acl: false,
      name: sub2,
    });

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

    Gateway.getInstance().setAppSelector((req) => {
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
