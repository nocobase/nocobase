/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceManager } from '..';

describe.skip('resource manager', () => {
  it('registerActionHandlers + define(empty actions)', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.registerActionHandlers({
      'test:list': async (ctx, next) => {
        ctx.arr.push(1);
        await next();
      },
      'test:get': async (ctx, next) => {
        ctx.arr.push(2);
        await next();
      },
    });
    resourceManager.define({
      name: 'test',
      actions: {},
    });
    const context = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([1]);
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'get',
      },
      context,
    );
    expect(context.arr).toEqual([1, 2]);
  });

  it('define(empty actions) + registerActionHandlers', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.define({
      name: 'test',
      actions: {},
    });
    resourceManager.registerActionHandlers({
      'test:list': async (ctx, next) => {
        ctx.arr.push(1);
        await next();
      },
      'test:get': async (ctx, next) => {
        ctx.arr.push(2);
        await next();
      },
    });
    const context = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([1]);
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'get',
      },
      context,
    );
    expect(context.arr).toEqual([1, 2]);
  });

  it('registerActionHandlers + define(scoped actions)', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.registerActionHandlers({
      'test:list': async (ctx, next) => {
        ctx.arr.push(1);
        await next();
      },
      'test:get': async (ctx, next) => {
        ctx.arr.push(2);
        await next();
      },
    });
    resourceManager.define({
      name: 'test',
      actions: {
        list: async (ctx, next) => {
          ctx.arr.push(3);
          await next();
        },
      },
    });
    const context = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([3]);
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'get',
      },
      context,
    );
    expect(context.arr).toEqual([3, 2]);
  });

  it('define(scoped actions) + registerActionHandlers', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.define({
      name: 'test',
      actions: {
        list: async (ctx, next) => {
          ctx.arr.push(3);
          await next();
        },
      },
    });
    resourceManager.registerActionHandlers({
      'test:list': async (ctx, next) => {
        ctx.arr.push(1);
        await next();
      },
      'test:get': async (ctx, next) => {
        ctx.arr.push(2);
        await next();
      },
    });
    const context = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([3]);
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'get',
      },
      context,
    );
    expect(context.arr).toEqual([3, 2]);
  });
});
