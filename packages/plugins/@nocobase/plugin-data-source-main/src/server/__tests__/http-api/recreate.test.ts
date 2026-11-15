/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('recreate field', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('forgets an auto-defined resource after its collection is deleted and supports recreating it', async () => {
    const create = () => agent.resource('collections').create({ values: { name: 'inventory' } });
    expect((await create()).status).toBe(200);
    expect((await agent.resource('inventory').list()).status).toBe(200);
    expect((await agent.resource('collections').destroy({ filterByTk: 'inventory' })).status).toBe(200);
    expect((await agent.resource('inventory').list()).status).toBe(404);
    expect((await create()).status).toBe(200);
    expect((await agent.resource('inventory').list()).status).toBe(200);
  });

  it('retains an explicitly registered resource that replaces an automatic registration', async () => {
    const name = 'inventory';
    expect((await agent.resource('collections').create({ values: { name } })).status).toBe(200);
    expect((await agent.resource(name).list()).status).toBe(200);
    app.resourceManager.define({
      name,
      actions: {
        ping: async (ctx) => {
          ctx.body = { alive: true };
        },
      },
    });
    expect((await agent.resource('collections').destroy({ filterByTk: name })).status).toBe(200);
    const response = await agent.resource(name).ping();
    expect(response.status).toBe(200);
    expect(response.body.data ?? response.body).toEqual({ alive: true });
  });

  it('should recreate field', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'a1',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'a2',
      },
    });

    await agent.resource('fields').create({
      values: {
        name: 'a',
        type: 'string',
        collectionName: 'a1',
      },
    });

    await agent.resource('a1').create({
      values: {
        a: 'a-value',
      },
    });

    await agent.resource('fields').destroy({
      filter: {
        name: 'a',
        collectionName: 'a1',
      },
    });

    await agent.resource('fields').create({
      values: {
        name: 'a',
        type: 'belongsToMany',
        collectionName: 'a1',
        target: 'a2',
      },
    });

    const response = await agent.resource('a1').list({
      appends: ['a'],
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reset fields', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'a1',
        fields: [
          {
            name: 'a',
            type: 'string',
          },
        ],
      },
    });

    expect(await app.db.getRepository('fields').count()).toBe(1);
    const response = await agent.resource('collections').setFields({
      filterByTk: 'a1',
      values: {
        fields: [
          {
            name: 'a',
            type: 'bigInt',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);

    expect(await app.db.getRepository('fields').count()).toBe(1);
  });
});
