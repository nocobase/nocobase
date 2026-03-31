/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSourceManager } from '@nocobase/data-source-manager';
import { createMockDatabase, createMockServer, mockDatabase, supertest } from '@nocobase/test';
import { vi } from 'vitest';
import { SequelizeDataSource } from '../sequelize-data-source';

describe('example', () => {
  test.skip('case1', async () => {
    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'test1',
    });
    let body;
    app.use(async (ctx, next) => {
      body = ctx.request.body;
      await next();
    });
    const agent = supertest.agent(app.callback());
    await agent.post('/api/test1:create').set('x-data-source', 'ds1').send({ name: 'n1' });
    expect(body.name).toBe('n1');
    await app.destroy();
  });

  test('case2', async () => {
    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'test2',
    });

    const database = await createMockDatabase({
      tablePrefix: 'ds1_',
    });
    await database.clean({ drop: true });
    const ds1 = new SequelizeDataSource({
      name: 'ds1',
      resourceManager: {},
      collectionManager: {
        database,
      },
    });
    ds1.collectionManager.defineCollection({
      name: 'test1',
      fields: [{ type: 'string', name: 'name' }],
    });
    await ds1.collectionManager.sync();
    ds1.acl.allow('test1', 'create', 'public');
    app.dataSourceManager.add(ds1);
    const res = await app
      .agent()
      .post('/api/test1:create')
      .set('x-data-source', 'ds1')
      .send({ name: 'n1' })
      .auth('abc', { type: 'bearer' })
      .set('X-Authenticator', 'basic');
    expect(res.status).toBe(200);
    const r = ds1.collectionManager.getRepository('test1');
    const m = await r.findOne();
    expect(m.name).toBe('n1');
    await app.destroy();
  });

  it('should validate filter params in update actions', async () => {
    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'update-filter',
    });

    const database = await createMockDatabase({
      tablePrefix: 'ds1_',
    });

    await database.clean({ drop: true });

    const ds1 = new SequelizeDataSource({
      name: 'ds1',
      resourceManager: {},
      collectionManager: {
        database,
      },
    });

    ds1.collectionManager.defineCollection({
      name: 'test1',
      fields: [{ type: 'string', name: 'name' }],
    });

    await ds1.collectionManager.sync();

    ds1.acl.allow('test1', 'update', 'public');

    await app.dataSourceManager.add(ds1);

    const res = await app
      .agent()
      .post(`/api/test1:update?filter=${JSON.stringify({})}`)
      .set('x-data-source', 'ds1')
      .auth('abc', { type: 'bearer' })
      .set('X-Authenticator', 'basic');

    expect(res.status).toBe(500);

    await app.destroy();
  });

  it('should validate filter params in destroy actions', async () => {
    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'update-filter',
    });

    const database = await createMockDatabase({
      tablePrefix: 'ds1_',
    });

    await database.clean({ drop: true });

    const ds1 = new SequelizeDataSource({
      name: 'ds1',
      resourceManager: {},
      collectionManager: {
        database,
      },
    });

    ds1.collectionManager.defineCollection({
      name: 'test1',
      fields: [{ type: 'string', name: 'name' }],
    });

    await ds1.collectionManager.sync();

    ds1.acl.allow('test1', 'destroy', 'public');

    await app.dataSourceManager.add(ds1);

    const res = await app
      .agent()
      .post(`/api/test1:destroy?filter=${JSON.stringify({})}`)
      .set('x-data-source', 'ds1')
      .auth('abc', { type: 'bearer' })
      .set('X-Authenticator', 'basic');

    expect(res.status).toBe(500);

    await app.destroy();
  });

  it('should call beforeAddDataSource hook', async () => {
    const hook = vi.fn();

    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'update-filter',
    });

    app.dataSourceManager.beforeAddDataSource(hook);
    // it should be called on main datasource
    expect(hook).toBeCalledTimes(1);

    await app.destroy();
  });

  it('should register every datasource instance', async () => {
    const hook = vi.fn();

    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'update-filter',
    });

    app.dataSourceManager.afterAddDataSource(hook);
    // it should be called on main datasource
    expect(hook).toBeCalledTimes(1);

    const database = await createMockDatabase({
      tablePrefix: 'ds1_',
    });

    // it should be called when adding a new datasource
    const ds1 = new SequelizeDataSource({
      name: 'ds1',
      resourceManager: {},
      collectionManager: {
        database,
      },
    });

    ds1.collectionManager.defineCollection({
      name: 'test1',
      fields: [{ type: 'string', name: 'name' }],
    });

    await ds1.collectionManager.sync();

    ds1.acl.allow('test1', 'update', 'public');

    await app.dataSourceManager.add(ds1);

    expect(hook).toBeCalledTimes(2);

    await app.destroy();
  });

  it('should throw error when request datasource not exists', async () => {
    const dataSourceManager = new DataSourceManager();
    const middleware = dataSourceManager.middleware();

    const ctx = {
      get: () => 'main',
      throw: (message) => {
        throw new Error(message);
      },
    };

    let err;
    try {
      await middleware(ctx, () => {});
    } catch (e) {
      err = e;
    }

    expect(err.message).toBe('data source main does not exist');
  });
});
