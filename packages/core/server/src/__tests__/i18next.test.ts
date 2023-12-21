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
    app.i18n.addResources('zh-CN', 'translation', {
      hello: '你好',
    });
    app.i18n.addResources('en-US', 'translation', {
      hello: 'Hello',
    });
    agent = supertest.agent(app.callback());
  });

  afterEach(async () => {
    return app.destroy();
  });

  it('global', async () => {
    expect(app.i18n.t('hello')).toEqual('Hello');
    app.i18n.changeLanguage('zh-CN');
    expect(app.i18n.t('hello')).toEqual('你好');
  });

  it('ctx', async () => {
    app.resource({
      name: 'tests',
      actions: {
        get: async (ctx, next) => {
          ctx.body = ctx.t('hello');
          await next();
        },
      },
    });
    const response1 = await agent.get('/api/tests:get');
    expect(response1.text).toEqual('Hello');
    const response2 = await agent.get('/api/tests:get').set('X-Locale', 'zh-CN');
    expect(response2.text).toEqual('你好');
    const response3 = await agent.get('/api/tests:get?locale=zh-CN');
    expect(response3.text).toEqual('你好');
    expect(app.i18n.language).toBe('en-US');
  });
});
