import supertest from 'supertest';
import { Application } from '../application';

describe('i18next', () => {
  let app: Application;
  let agent: supertest.SuperAgentTest;

  beforeEach(() => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });

    agent = supertest.agent(app.callback());
  });

  afterEach(async () => {
    return app.destroy();
  });

  it('should validate filter params when request update', async () => {
    app.resource({
      name: 'tests',
      actions: {
        update: async (ctx, next) => {
          ctx.body = 'ok';
          await next();
        },
      },
    });

    const updateRes = await agent.post(`/api/tests:update?filter=${JSON.stringify({})}`);
    expect(updateRes.status).toBe(500);
  });
});
