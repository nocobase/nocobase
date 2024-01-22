import Koa from 'koa';
import supertest from 'supertest';
import { DataSource } from '../data-source';
import { DataSourceManager } from '../data-source-manager';
import { ResourceManager } from '../resource-manager';

describe('example', () => {
  test('case1', async () => {
    const app = new Koa();
    const resourceManager = new ResourceManager({
      prefix: '/api',
    });
    resourceManager.define({
      name: 'test1',
      actions: {
        list: async (ctx, next) => {
          ctx.body = 'ok01';
          console.log('list01.......');
          await next();
        },
      },
    });
    resourceManager.define({
      name: 'test2',
      actions: {
        list: async (ctx, next) => {
          ctx.body = 'ok02';
          console.log('list02.......');
          await next();
        },
      },
    });
    app.use(resourceManager.restApiMiddleware());
    const agent = supertest.agent(app.callback());
    const dsm = new DataSourceManager();
    app.use(dsm.middleware());
    const ds1 = new DataSource({
      name: 'test1',
    });
    ds1.resourceManager.define({
      name: 'test1',
      actions: {
        list: async (ctx, next) => {
          ctx.body = 'ok1';
          console.log('list1.......');
          await next();
        },
      },
    });
    dsm.add(ds1);

    const ds2 = new DataSource({
      name: 'test2',
    });
    ds2.resourceManager.define({
      name: 'test2',
      actions: {
        list: async (ctx, next) => {
          ctx.body = 'ok2';
          console.log('list2.......');
          await next();
        },
      },
    });
    dsm.add(ds2);

    app.use(async (ctx, next) => {
      console.log('middleware...');
      await next();
    });

    const response01 = await agent.get('/api/test1:list');
    const response02 = await agent.get('/api/test2:list');
    const response1 = await agent.get('/api/test1:list').set('x-data-source', 'test1');
    const response2 = await agent.get('/api/test2:list').set('x-data-source', 'test2');
  });
});
