/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import supertest from 'supertest';
import { Resourcer } from '../resourcer';

describe('koa middleware', () => {
  it('shound work', async () => {
    const app = new Koa();
    const resourcer = new Resourcer();
    const agent = supertest.agent(app.callback());

    resourcer.define({
      name: 'test',
      actions: {
        async list(ctx, next) {
          ctx.body = ctx.body || {};
          ctx.body.arr = ctx.body.arr || [];
          ctx.body.arr.push(5);
          await next();
          ctx.body.arr.push(6);
        },
      },
    });

    app.use(
      resourcer.middleware({
        prefix: '/api',
      }),
    );

    app.use(async (ctx, next) => {
      if (ctx.path === '/api/test') {
        ctx.body = ctx.body || {};
        ctx.body.arr = ctx.body.arr || [];
        ctx.body.arr.push(3);
        await next();
        ctx.body.arr.push(4);
      }
    });

    const response = await agent.get('/api/test');
    expect(response.body.arr).toEqual([5, 3, 4, 6]);
  });

  it('shound work', async () => {
    const app = new Koa();
    const resourcer = new Resourcer();
    const agent = supertest.agent(app.callback());

    resourcer.registerActionHandlers({
      async index(ctx, next) {
        ctx.body = ctx.body || {};
        ctx.body.arr = ctx.body.arr || [];
        ctx.body.arr.push(5);
        await next();
        ctx.body.arr.push(6);
      },
    });

    resourcer.define({
      name: 'test',
    });

    app.use(
      resourcer.middleware({
        prefix: '/api',
        accessors: {
          list: 'index',
        },
      }),
    );

    app.use(async (ctx, next) => {
      if (ctx.path === '/api/test') {
        ctx.body = ctx.body || {};
        ctx.body.arr = ctx.body.arr || [];
        ctx.body.arr.push(3);
        await next();
        ctx.body.arr.push(4);
      }
    });

    const response = await agent.get('/api/test');
    expect(response.body.arr).toEqual([5, 3, 4, 6]);
  });

  it('shound be 404', async () => {
    const app = new Koa();
    const resourcer = new Resourcer();
    const agent = supertest.agent(app.callback());
    app.use(resourcer.middleware());
    const response = await agent.get('/test');
    expect(response.status).toBe(404);
  });

  it('shound work', async () => {
    const app = new Koa();
    const resourcer = new Resourcer();
    const agent = supertest.agent(app.callback());

    resourcer.define({
      name: 'test',
      actions: {
        async index(ctx, next) {
          ctx.body = ctx.body || {};
          ctx.body.arr = ctx.body.arr || [];
          ctx.body.arr.push(5);
          await next();
          ctx.body.arr.push(6);
        },
      },
    });

    app.use(
      resourcer.middleware({
        prefix: '/api',
        accessors: {
          list: 'index',
        },
      }),
    );

    app.use(async (ctx, next) => {
      if (ctx.path === '/api/test') {
        ctx.body = ctx.body || {};
        ctx.body.arr = ctx.body.arr || [];
        ctx.body.arr.push(3);
        await next();
        ctx.body.arr.push(4);
      }
    });

    const response = await agent.get('/api/test');
    expect(response.body.arr).toEqual([5, 3, 4, 6]);
  });

  it('shound work', async () => {
    const app = new Koa();
    const resourcer = new Resourcer();
    const agent = supertest.agent(app.callback());

    resourcer.define({
      name: 'tables.fields',
      actions: {
        async list(ctx, next) {
          ctx.body = ctx.body || {};
          ctx.body.arr = ctx.body.arr || [];
          ctx.body.arr.push(3);
          await next();
          ctx.body.arr.push(4);
        },
      },
    });

    app.use(resourcer.middleware());

    const response = await agent.get('/tables/demos/fields');
    expect(response.body.arr).toEqual([3, 4]);
  });

  describe('action options', () => {
    let resourcer: Resourcer;
    let app: Koa;
    let agent;
    beforeAll(() => {
      app = new Koa();
      resourcer = new Resourcer();
      const handler = async (ctx, next) => {
        ctx.body = ctx.action.params;
        await next();
      };
      resourcer.registerActionHandlers({
        list: handler,
        create: handler,
        update: handler,
        get: handler,
        destroy: handler,
        set: handler,
        add: handler,
        remove: handler,
      });
      app.use(bodyParser());
      app.use(resourcer.middleware());
      agent = supertest.agent(app.callback());
    });
    it('options1', async () => {
      resourcer.define({
        name: 'tests',
        actions: {
          list: {
            filter: {
              col1: 'val1',
              col2: 'val2',
            },
            fields: ['id'],
            sort: ['-id'],
          },
        },
      });
      const response = await agent.get('/tests').query({
        filter: {
          col2: '&val2',
          col3: 'val3',
        },
        other: 'other1',
        sort: '-id',
      });
      expect(response.body).toMatchObject({
        sort: '-id',
        filter: {
          $and: [
            { col1: 'val1', col2: 'val2' },
            { col2: '&val2', col3: 'val3' },
          ],
        },
        fields: ['id'],
        other: 'other1',
        actionName: 'list',
        resourceName: 'tests',
      });
    });
    it('options2', async () => {
      resourcer.define({
        name: 'tests',
        actions: {
          create: {
            values: {
              col1: 'val1',
            },
          },
        },
      });
      const response = await agent.post('/tests').send({ aa: 'aa' });
      expect(response.body).toMatchObject({
        actionName: 'create',
        resourceName: 'tests',
        values: { col1: 'val1', aa: 'aa' },
      });
    });
    it('options3', async () => {
      resourcer.define({
        name: 'tests',
        actions: {
          create: {
            values: {
              col1: 'val1',
            },
          },
        },
      });
      const response = await agent.post('/resourcer/tests:create').send({
        values: { aa: 'aa' },
      });
      expect(response.body).toMatchObject({
        actionName: 'create',
        resourceName: 'tests',
        values: { col1: 'val1', aa: 'aa' },
      });
    });
    it('options4', async () => {
      resourcer.define({
        name: 'tests',
        actions: {
          update: {
            values: {
              col1: 'val1',
            },
          },
        },
      });
      const response = await agent.post('/resourcer/tests:update').send({
        resourceIndex: 1,
        values: { aa: 'aa' },
      });
      expect(response.body).toMatchObject({
        resourceIndex: 1,
        actionName: 'update',
        resourceName: 'tests',
        values: { col1: 'val1', aa: 'aa' },
      });
    });
    describe('hasOne', () => {
      beforeAll(() => {
        resourcer.define({
          type: 'hasOne',
          name: 'users.settings',
        });
      });
      it('get', async () => {
        const response = await agent.get('/users/1/settings');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'settings',
          actionName: 'get',
        });
      });
      it('update', async () => {
        const response = await agent.post('/users/1/settings');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'settings',
          actionName: 'update',
        });
      });
      it('destroy', async () => {
        const response = await agent.delete('/users/1/settings');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'settings',
          actionName: 'destroy',
        });
      });
    });
    describe('hasMany', () => {
      beforeAll(() => {
        resourcer.define({
          type: 'hasMany',
          name: 'users.posts',
        });
      });
      it('list', async () => {
        const response = await agent.get('/users/1/posts');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'posts',
          actionName: 'list',
        });
      });
      it('get', async () => {
        const response = await agent.get('/users/1/posts/1');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'posts',
          resourceIndex: '1',
          actionName: 'get',
        });
      });
      it('create', async () => {
        const response = await agent.post('/users/1/posts');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'posts',
          actionName: 'create',
        });
      });
      it('update', async () => {
        const response = await agent.put('/users/1/posts/1');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'posts',
          resourceIndex: '1',
          actionName: 'update',
        });
      });
      it('destroy', async () => {
        const response = await agent.delete('/users/1/posts/1');
        expect(response.body).toMatchObject({
          associatedName: 'users',
          associatedIndex: '1',
          resourceName: 'posts',
          resourceIndex: '1',
          actionName: 'destroy',
        });
      });
    });
    describe('belongsTo', () => {
      beforeAll(() => {
        resourcer.define({
          type: 'belongsTo',
          name: 'posts.user',
        });
      });
      it('get', async () => {
        const response = await agent.get('/posts/1/user');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'user',
          actionName: 'get',
        });
      });
      it('set', async () => {
        const response = await agent.post('/posts/1/user/1');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'user',
          resourceIndex: '1',
          actionName: 'set',
        });
      });
      it('remove', async () => {
        const response = await agent.delete('/posts/1/user');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'user',
          actionName: 'remove',
        });
      });
    });
    describe('belongsToMany', () => {
      beforeAll(() => {
        resourcer.define({
          type: 'belongsToMany',
          name: 'posts.tags',
        });
      });
      it('list', async () => {
        const response = await agent.get('/posts/1/tags');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          actionName: 'list',
        });
      });
      it('get', async () => {
        const response = await agent.get('/posts/1/tags/1');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          resourceIndex: '1',
          actionName: 'get',
        });
      });
      it('set', async () => {
        const response = await agent.post('/posts/1/tags');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          actionName: 'set',
        });
      });
      it('add', async () => {
        const response = await agent.post('/posts/1/tags/1');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          resourceIndex: '1',
          actionName: 'add',
        });
      });
      it('update', async () => {
        const response = await agent.put('/posts/1/tags/1');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          resourceIndex: '1',
          actionName: 'update',
        });
      });
      it('remove', async () => {
        const response = await agent.delete('/posts/1/tags/1');
        expect(response.body).toMatchObject({
          associatedName: 'posts',
          associatedIndex: '1',
          resourceName: 'tags',
          resourceIndex: '1',
          actionName: 'remove',
        });
      });
    });
    it('fields1', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {},
        },
      });
      const response = await agent.get('/test1').query({
        fields: ['id', 'col1'],
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        fields: ['id', 'col1'],
      });
    });
    it('fields2', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {
            fields: ['id'],
          },
        },
      });
      const response = await agent.get('/test1').query({
        fields: ['id', 'col1'],
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        fields: ['id'],
      });
    });
    it('fields3', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {
            except: ['password'],
          },
        },
      });
      const response = await agent.get('/test1').query({
        fields: ['id', 'col1', 'password'],
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        fields: ['id', 'col1', 'password'],
        except: ['password'],
      });
    });
    it('fields4', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {
            except: ['password'],
            appends: ['col2'],
          },
        },
      });
      const response = await agent.get('/test1').query({
        fields: ['id', 'col1', 'password', 'col2'],
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        fields: ['id', 'col1', 'password', 'col2'],
        except: ['password'],
        appends: ['col2'],
      });
    });
    it('fields5', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {
            except: ['password'],
            appends: ['col2'],
          },
        },
      });
      const response = await agent.get('/test1').query({
        appends: ['relation1'],
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        except: ['password'],
        appends: ['col2', 'relation1'],
      });
    });
    it('fields6', async () => {
      resourcer.define({
        name: 'test1',
        actions: {
          list: {},
        },
      });
      const response = await agent.get('/test1').query({
        appends: 'rel1,rel2',
      });
      expect(response.body).toMatchObject({
        actionName: 'list',
        resourceName: 'test1',
        appends: ['rel1', 'rel2'],
      });
    });
    it('fields7', async () => {
      resourcer.define({
        name: 'users.posts',
        actions: {
          list: {},
        },
      });
      const response = await agent.get('/users/name/posts').query({
        appends: 'rel1,rel2',
      });
      expect(response.body).toMatchObject({
        associatedName: 'users',
        associatedIndex: 'name',
        resourceName: 'posts',
        actionName: 'list',
        appends: ['rel1', 'rel2'],
      });
    });
    it('fields8', async () => {
      resourcer.define({
        name: 'users.posts',
        actions: {
          list: {
            async middleware(ctx, next) {
              ctx.action.mergeParams({ filter: { user_name: ctx.action.params.associatedIndex } });
              await next();
            },
          },
        },
      });
      const response = await agent.get('/users/name/posts');
      expect(response.body).toMatchObject({
        associatedName: 'users',
        associatedIndex: 'name',
        resourceName: 'posts',
        actionName: 'list',
        filter: { user_name: 'name' },
      });
    });
    it('fields9', async () => {
      resourcer.define({
        name: 'users.posts',
        actions: {
          list: {
            async middleware(ctx, next) {
              ctx.action.mergeParams({ fields: [ctx.action.params.associatedIndex] });
              await next();
            },
          },
        },
      });
      const response = await agent.get('/users/name/posts');
      expect(response.body).toMatchObject({
        associatedName: 'users',
        associatedIndex: 'name',
        resourceName: 'posts',
        actionName: 'list',
        fields: ['name'],
      });
    });
  });
});
