/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { VerificationManager } from '../../verification-manager';
import { Verification } from '../../verification';
import PluginVerficationServer from '../../Plugin';

class MockVerfication extends Verification {
  async verify({
    resource,
    action,
    boundInfo,
    verifyParams,
  }: {
    resource: any;
    action: any;
    boundInfo: any;
    verifyParams: any;
  }): Promise<any> {}
  getBoundInfo(userId: number): Promise<any> {
    return Promise.resolve({
      key: 'value',
    });
  }
  validateBoundInfo(boundInfo: any) {
    if (boundInfo?.key !== 'value') {
      throw new Error('Invalid bound info');
    }
    return Promise.resolve(true);
  }
  onActionComplete({ verifyResult }) {
    return Promise.resolve();
  }
}

describe('action and verify', async () => {
  let app: MockServer;
  let manager: VerificationManager;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['verification'],
    });
    agent = app.agent();
    app.resourceManager.define({
      name: 'test',
      actions: {
        async verify(ctx, next) {
          ctx.body = {};
          await next();
        },
      },
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        verificationType: 'test',
      },
    });
    const plugin = app.pm.get('verification') as PluginVerficationServer;
    manager = plugin.verificationManager;
    manager.registerVerificationType('test', {
      title: 'Test',
      verification: MockVerfication,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should check action', async () => {
    expect.assertions(1);
    try {
      await manager.verify(
        {
          action: {
            resourceName: 'test',
            actionName: 'invalid',
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid action');
    }
  });

  it('should check verifier', async () => {
    manager.registerAction('test:verify', {});
    expect.assertions(2);
    try {
      await manager.verify(
        {
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {},
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid verifier');
    }
    try {
      await manager.verify(
        {
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'invalid',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid verifier');
    }
  });

  it('should check verifier for scene, check by type', async () => {
    manager.registerScene('test', {
      actions: {
        'test:verify': {
          getUserIdFromCtx: () => 1,
        },
      },
    });
    expect.assertions(1);
    try {
      await manager.verify(
        {
          app,
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid verifier');
    }
    manager.addSceneRule((scene, type) => scene === 'test' && type === 'test');
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
  });

  it('should check verifier for scene, check by verifiers', async () => {
    manager.registerScene('test', {
      getVerifiers: async () => ['valid'],
      actions: {
        'test:verify': {
          getUserIdFromCtx: () => 1,
        },
      },
    });
    manager.registerScene('test2', {
      getVerifiers: async () => ['test'],
      actions: {
        'test:verify2': {
          getUserIdFromCtx: () => 1,
        },
      },
    });
    manager.addSceneRule((scene, type) => ['test', 'test2'].includes(scene) && type === 'test');
    expect.assertions(1);
    try {
      await manager.verify(
        {
          app,
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid verifier');
    }
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify2',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
  });

  it('should check verify params', async () => {
    manager.registerAction('test:verify', {
      getVerifyParams: async () => null,
    });
    expect.assertions(1);
    try {
      await manager.verify(
        {
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid verify params');
    }
  });

  it('get bound info from context of action', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue({
      key: 'value',
    });
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: fn,
    });
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
    expect(fn).toBeCalled();
  });

  it('get get user id from context of action', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue(1);
    manager.registerAction('test:verify', {
      getUserIdFromCtx: fn,
    });
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
    expect(fn).toBeCalled();
  });

  it('should check user id', async () => {
    manager.registerAction('test:verify', {});
    expect.assertions(1);
    try {
      await manager.verify(
        {
          app,
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid user id');
    }
  });

  it('should validate bound info', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async () => null,
    });
    expect.assertions(1);
    try {
      await manager.verify(
        {
          app,
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(error.message).toBe('Invalid bound info');
    }
  });

  it('should verify', async () => {
    manager.registerAction('test:verify', {});
    const spy = vi.spyOn(MockVerfication.prototype, 'verify');
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        auth: {
          user: {
            id: 1,
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
    expect(spy).toBeCalled();
  });

  it('on verify success', async () => {
    const fn = vi.fn();
    manager.registerAction('test:verify', {
      onVerifySuccess: fn,
    });
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        auth: {
          user: {
            id: 1,
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
    expect(fn).toBeCalled();
  });

  it('on verify fail', async () => {
    const fn = vi.fn();
    manager.registerAction('test:verify', {
      onVerifyFail: fn,
    });
    vi.spyOn(MockVerfication.prototype, 'verify').mockRejectedValue(new Error('Test error'));
    expect.assertions(1);
    try {
      await manager.verify(
        {
          app,
          db: app.db,
          action: {
            resourceName: 'test',
            actionName: 'verify',
            params: {
              values: {
                verifier: 'test',
              },
            },
          },
          auth: {
            user: {
              id: 1,
            },
          },
          throw: app.context.throw,
        } as any,
        async () => {},
      );
    } catch (error) {
      expect(fn).toBeCalled();
    }
  });

  it('on action complete', async () => {
    const spy = vi.spyOn(MockVerfication.prototype, 'onActionComplete');
    manager.registerAction('test:verify', {});
    await manager.verify(
      {
        app,
        db: app.db,
        action: {
          resourceName: 'test',
          actionName: 'verify',
          params: {
            values: {
              verifier: 'test',
            },
          },
        },
        auth: {
          user: {
            id: 1,
          },
        },
        throw: app.context.throw,
      } as any,
      async () => {},
    );
    expect(spy).toBeCalled();
  });

  it('auto verify', async () => {
    manager.registerAction('test:verify', {});
    const spy = vi.spyOn(manager, 'verify');
    await agent.resource('test').verify();
    expect(spy).toBeCalled();
  });

  it('manual verify', async () => {
    manager.registerAction('test:verify', {
      manual: true,
    });
    const spy = vi.spyOn(manager, 'verify');
    await agent.resource('test').verify();
    expect(spy).not.toBeCalled();
  });
});
