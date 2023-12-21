import { vi } from 'vitest';
import { ACL } from '..';

describe('skip', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should skip action', async () => {
    const middlewareFunc = acl.middleware();
    const ctx: any = {
      state: {},
      action: {
        resourceName: 'users',
        actionName: 'login',
      },
      app: {
        acl,
      },
      throw() {},
    };

    const nextFunc = vi.fn();

    await middlewareFunc(ctx, nextFunc);
    expect(nextFunc).toHaveBeenCalledTimes(0);

    acl.allow('users', 'login');

    await middlewareFunc(ctx, nextFunc);
    expect(nextFunc).toHaveBeenCalledTimes(1);
  });

  it('should skip action with condition', async () => {
    const middlewareFunc = acl.middleware();
    const ctx: any = {
      state: {},
      action: {
        resourceName: 'users',
        actionName: 'login',
      },
      log: {
        info() {},
      },
      app: {
        acl,
      },
      throw() {},
    };

    const nextFunc = vi.fn();

    let skip = false;

    acl.allow('users', 'login', (ctx) => {
      return skip;
    });

    await middlewareFunc(ctx, nextFunc);
    expect(nextFunc).toHaveBeenCalledTimes(0);

    skip = true;
    await middlewareFunc(ctx, nextFunc);
    expect(nextFunc).toHaveBeenCalledTimes(1);
  });

  it('should skip action with registered condition', async () => {
    const middlewareFunc = acl.middleware();

    const conditionFn = vi.fn();
    acl.allowManager.registerAllowCondition('superUser', async () => {
      conditionFn();
      return true;
    });

    const ctx: any = {
      state: {},
      action: {
        resourceName: 'users',
        actionName: 'login',
      },
      log: {
        info() {},
      },
      app: {
        acl,
      },
      throw() {},
    };

    const nextFunc = vi.fn();

    acl.allow('users', 'login', 'superUser');

    await middlewareFunc(ctx, nextFunc);
    expect(nextFunc).toHaveBeenCalledTimes(1);
    expect(conditionFn).toHaveBeenCalledTimes(1);
  });
});
