import path from 'path';
import { Action, Resourcer, ResourcerContext } from '..';
import Resource from '../resource';

describe('resourcer', () => {
  it('action', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      actions: {
        async list(ctx, next) {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(2);
        },
      },
    });
    const context: ResourcerContext = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    expect(context.resourcer).toBeInstanceOf(Resourcer);
    expect(context.action).toBeInstanceOf(Action);
    expect(context.action.getResource()).toBeInstanceOf(Resource);
    expect(context.action.getName()).toBe('list');
    expect(context.action.getResource().getName()).toBe('test');
  });
  it('action', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      actions: {
        async list(ctx, next) {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(2);
        },
        async test(ctx, next) {
          ctx.arr.push(11);
          await next();
          ctx.arr.push(22);
        },
      },
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'test',
      },
      context,
    );
    expect(context.arr).toStrictEqual([11, 22]);
  });
  it('registerActionHandlers()', async () => {
    const resourcer = new Resourcer();
    resourcer.registerActionHandlers({
      async list(ctx, next) {
        ctx.arr.push(1);
        await next();
        ctx.arr.push(2);
      },
    });
    resourcer.define({
      name: 'test',
      actions: {
        async test(ctx, next) {
          ctx.arr.push(11);
          await next();
          ctx.arr.push(22);
        },
      },
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'test',
      },
      context,
    );
    expect(context.arr).toStrictEqual([11, 22]);
  });
  it('registerActionHandlers()', async () => {
    const resourcer = new Resourcer();
    resourcer.registerActionHandlers({
      'test:list': async (ctx, next) => {
        ctx.arr.push(1);
        await next();
        ctx.arr.push(2);
      },
      list: async (ctx, next) => {
        ctx.arr.push(11);
        await next();
        ctx.arr.push(22);
      },
    });
    resourcer.define({
      name: 'test',
    });
    resourcer.define({
      name: 'test2',
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test2',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([11, 22]);
  });
  it('registerActionHandlers()', async () => {
    const resourcer = new Resourcer();
    resourcer.registerActionHandlers({
      list: async (ctx, next) => {
        ctx.arr.push(11);
        await next();
        ctx.arr.push(22);
      },
    });
    resourcer.registerActionHandlers({
      get: async (ctx, next) => {
        ctx.arr.push(33);
        await next();
        ctx.arr.push(44);
      },
    });
    resourcer.define({
      name: 'test',
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([11, 22]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'get',
      },
      context,
    );
    expect(context.arr).toStrictEqual([33, 44]);
  });
  it('only', async () => {
    const resourcer = new Resourcer();
    resourcer.registerActionHandlers({
      async list(ctx, next) {
        ctx.arr.push(1);
        await next();
        ctx.arr.push(2);
      },
      async test(ctx, next) {
        ctx.arr.push('test1');
        await next();
        ctx.arr.push('test2');
      },
    });
    resourcer.define({
      name: 'test',
      only: ['list'],
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    context = {
      arr: [],
    };
    try {
      await resourcer.execute(
        {
          resource: 'test',
          action: 'test',
        },
        context,
      );
    } catch (error) {
      expect(error.message).toEqual('test action is not allowed');
    }
  });
  it('except', async () => {
    const resourcer = new Resourcer();
    resourcer.registerActionHandlers({
      async list(ctx, next) {
        ctx.arr.push(1);
        await next();
        ctx.arr.push(2);
      },
      async test(ctx, next) {
        ctx.arr.push('test1');
        await next();
        ctx.arr.push('test2');
      },
    });
    resourcer.define({
      name: 'test',
      except: ['test'],
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2]);
    context = {
      arr: [],
    };
    try {
      await resourcer.execute(
        {
          resource: 'test',
          action: 'test',
        },
        context,
      );
    } catch (error) {
      expect(error.message).toEqual('test action is not allowed');
    }
  });
  it('middlewares', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middlewares: [
        async (ctx, next) => {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(6);
        },
        async (ctx, next) => {
          ctx.arr.push(2);
          await next();
          ctx.arr.push(5);
        },
      ],
      actions: {
        async list(ctx, next) {
          ctx.arr.push(3);
          await next();
          ctx.arr.push(4);
        },
      },
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 2, 3, 4, 5, 6]);
  });
  it('middlewares#global', async () => {
    const resourcer = new Resourcer();
    resourcer.use(async (ctx, next) => {
      ctx.arr.push(7);
      await next();
      ctx.arr.push(8);
    });
    resourcer.define({
      name: 'test',
      middlewares: [
        async (ctx, next) => {
          ctx.arr.push(1);
          await next();
          ctx.arr.push(6);
        },
        async (ctx, next) => {
          ctx.arr.push(2);
          await next();
          ctx.arr.push(5);
        },
      ],
      actions: {
        async list(ctx, next) {
          ctx.arr.push(3);
          await next();
          ctx.arr.push(4);
        },
      },
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([7, 1, 2, 3, 4, 5, 6, 8]);
  });
  it('middlewares#only', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middlewares: [
        {
          only: ['list'],
          async handler(ctx, next) {
            ctx.arr.push(1);
            await next();
            ctx.arr.push(6);
          },
        },
        {
          only: ['create'],
          async handler(ctx, next) {
            ctx.arr.push(2);
            await next();
            ctx.arr.push(5);
          },
        },
      ],
      actions: {
        async list(ctx, next) {
          ctx.arr.push(3);
          await next();
          ctx.arr.push(4);
        },
        async create(ctx, next) {
          ctx.arr.push(7);
          await next();
          ctx.arr.push(8);
        },
      },
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 3, 4, 6]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'create',
      },
      context,
    );
    expect(context.arr).toStrictEqual([2, 7, 8, 5]);
  });
  it('middlewares#except', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middlewares: [
        {
          except: ['create'],
          async handler(ctx, next) {
            ctx.arr.push(1);
            await next();
            ctx.arr.push(6);
          },
        },
        {
          except: ['list'],
          async handler(ctx, next) {
            ctx.arr.push(2);
            await next();
            ctx.arr.push(5);
          },
        },
      ],
      actions: {
        async list(ctx, next) {
          ctx.arr.push(3);
          await next();
          ctx.arr.push(4);
        },
        async create(ctx, next) {
          ctx.arr.push(7);
          await next();
          ctx.arr.push(8);
        },
      },
    });
    let context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toStrictEqual([1, 3, 4, 6]);
    context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'create',
      },
      context,
    );
    expect(context.arr).toStrictEqual([2, 7, 8, 5]);
  });
  it('should work', async () => {
    const resourcer = new Resourcer();
    await resourcer.import({
      directory: path.resolve(__dirname, 'resources'),
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'demo',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([1, 2]);
  });
  it('should work', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middlewares: [
        async (ctx, next) => {
          ctx.arr.push(5);
          await next();
          ctx.arr.push(6);
        },
        async (ctx, next) => {
          ctx.arr.push(7);
          await next();
          ctx.arr.push(8);
        },
      ],
      actions: {
        list: {
          middlewares: [
            async (ctx, next) => {
              ctx.arr.push(1);
              await next();
              ctx.arr.push(2);
            },
            async (ctx, next) => {
              ctx.arr.push(9);
              await next();
              ctx.arr.push(10);
            },
          ],
          async handler(ctx, next) {
            ctx.arr.push(3);
            await next();
            ctx.arr.push(4);
          },
        },
      },
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([5, 7, 1, 9, 3, 4, 10, 2, 8, 6]);
  });
  it('require module', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middleware: (await import('./middlewares/demo0')).default,
      actions: {
        list: (await import('./actions/demo0')).default,
      },
    });

    const context = {
      arr: [],
    };

    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([1, 7, 8, 2]);
  });
  it('require module', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middleware: (await import('./middlewares/demo1')).default,
      actions: {
        list: (await import('./actions/demo1')).default,
      },
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([2, 9, 10, 3]);
  });
  it('require module', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middleware: (await import('./middlewares/demo1')).default,
      actions: {
        list: {
          handler: (await import('./actions/demo1')).default,
        },
      },
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'list',
      },
      context,
    );
    expect(context.arr).toEqual([2, 9, 10, 3]);
  });
  it('add action', async () => {
    const resourcer = new Resourcer();
    resourcer.define({
      name: 'test',
      middleware: (await import('./middlewares/demo1')).default,
      actions: {
        list: {
          handler: (await import('./actions/demo1')).default,
        },
      },
    });
    resourcer.getResource('test').addAction('new', async function (ctx, next) {
      ctx.arr.push(100);
      await next();
      ctx.arr.push(101);
    });
    const context = {
      arr: [],
    };
    await resourcer.execute(
      {
        resource: 'test',
        action: 'new',
      },
      context,
    );
    expect(context.arr).toEqual([2, 100, 101, 3]);
  });
});
