import { MockServer, mockServer } from '@nocobase/test';

describe('collection action', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
  });

  test('create collection', async () => {
    app.resourcer.registerActionHandler('collections:create', async (ctx, next) => {
      ctx.body = 'hello';
      await next();
    });

    const response = await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });

    expect(response.statusCode).toEqual(200);
  });
});
