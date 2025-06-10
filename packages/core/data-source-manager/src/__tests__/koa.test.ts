/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, mockDatabase } from '@nocobase/test';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import supertest from 'supertest';
import { DataSourceManager } from '../data-source-manager';
import { SequelizeDataSource } from '../sequelize-data-source';

describe('example', () => {
  test('case1', async () => {
    const app = new Koa();
    const dsm = new DataSourceManager();
    app.use(bodyParser());
    app.use(async (ctx, next) => {
      console.log('middleware2...', ctx.request.body);
      await next();
    });
    app.use(dsm.middleware());
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
    dsm.add(ds1);
    const agent = supertest.agent(app.callback());
    const res = await agent.post('/api/test1:create').set('x-data-source', 'ds1').send({ name: 'n1' });
    console.log(res.status);
    expect(res.status).toBe(200);
    const r = ds1.collectionManager.getRepository('test1');
    const m = await r.findOne();
    expect(m.name).toBe('n1');
  });
});
