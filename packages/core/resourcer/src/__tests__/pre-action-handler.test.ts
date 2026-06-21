/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ResourceManager, { ResourcerContext } from '../resourcer';

describe('pre action handler', () => {
  it('register general pre action handler', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.define({
      name: 'test',
      actions: {
        async list(ctx, next) {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(2);
        },
      },
    });
    resourceManager.registerPreActionHandler('list', async (ctx, next) => {
      ctx.arr.push(3);
      await next();
    });
    resourceManager.use(async (ctx, next) => {
      ctx.arr.push(4);
      await next();
    });
    const context: ResourcerContext = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([4, 3, 1, 2]);
  });

  it('register specific pre action handler', async () => {
    const resourceManager = new ResourceManager();
    resourceManager.define({
      name: 'test',
      actions: {
        async list(ctx, next) {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(2);
        },
      },
    });
    resourceManager.registerPreActionHandler('list', async (ctx, next) => {
      ctx.arr.push(3);
      await next();
    });
    resourceManager.registerPreActionHandler('test:list', async (ctx, next) => {
      ctx.arr.push(4);
      await next();
    });
    resourceManager.use(async (ctx, next) => {
      ctx.arr.push(5);
      await next();
    });
    const context: ResourcerContext = {
      arr: [],
    };
    await resourceManager.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([5, 4, 1, 2]);
  });
});
