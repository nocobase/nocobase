/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Auth, AuthManager } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { vi } from 'vitest';

class MockStorer {
  elements: Map<string, any> = new Map();
  async set(name: string, value: any) {
    this.elements.set(name, value);
  }

  async get(name: string) {
    return this.elements.get(name);
  }
}

class BasicAuth extends Auth {
  public user: Model;

  async skipCheck() {
    return true;
  }

  async check() {
    return null;
  }

  async getIdentity() {
    return null;
  }
}

class NoUserAuth extends BasicAuth {
  async skipCheck() {
    return false;
  }
}

describe('auth-manager', () => {
  let authManager: AuthManager;
  let storer: MockStorer;
  beforeEach(() => {
    authManager = new AuthManager({
      authKey: 'X-Authenticator',
    });

    storer = new MockStorer();
    const authenticator = {
      name: 'basic-test',
      authType: 'basic',
      options: {},
    };
    storer.set(authenticator.name, authenticator);
    authManager.setStorer(storer);
  });

  it('should get authenticator', async () => {
    authManager.registerTypes('basic', { auth: BasicAuth });
    const authenticator = await authManager.get('basic-test', {} as Context);
    expect(authenticator).toBeInstanceOf(BasicAuth);

    storer.set('basic2-test', { name: 'basic2-test', authType: 'basic2', options: {} });
    expect(authManager.get('basic2-test', {} as Context)).rejects.toThrowError('AuthType [basic2] is not found.');

    await expect(authManager.get('not-exists', {} as Context)).rejects.toThrowError(
      'Authenticator [not-exists] is not found.',
    );

    authManager.setStorer(null);
    await expect(authManager.get('any', {} as Context)).rejects.toThrowError('AuthManager.storer is not set.');
  });

  it('should get built-in authenticator before storer', async () => {
    authManager.registerTypes('basic', { auth: BasicAuth });
    authManager.registerBuiltInAuthenticator({
      name: 'builtin-basic',
      authType: 'basic',
      options: {
        builtin: true,
      },
    });

    const auth = (await authManager.get('builtin-basic', {} as Context)) as any;

    expect(auth).toBeInstanceOf(BasicAuth);
    expect(auth.options).toEqual({ builtin: true });
  });

  it('should list types', () => {
    authManager.registerTypes('basic', { auth: BasicAuth, title: 'Basic' });
    authManager.registerTypes('builtin', { auth: BasicAuth, title: 'Builtin', hidden: true });
    expect(authManager.listTypes()).toEqual([{ name: 'basic', title: 'Basic' }]);
  });

  it('should get auth config', () => {
    authManager.registerTypes('basic', { auth: BasicAuth, title: 'Basic' });
    expect(authManager.getAuthConfig('basic')).toEqual({ auth: BasicAuth, title: 'Basic' });
  });

  it.each([
    ['the authenticator cannot be resolved', undefined, 'not-exists'],
    ['a custom authenticator skips checks', BasicAuth, 'basic-test'],
    ['the authenticator returns no user', NoUserAuth, 'basic-test'],
  ])('middleware should fail closed when %s', async (_case, auth, name) => {
    if (auth) {
      authManager.registerTypes('basic', { auth });
    }
    const forceAuthCheckError = { code: 'INVALID_TEMPORARY_ACCESS_CODE' };
    const next = vi.fn(async () => {});
    const ctx = {
      app: { authManager },
      get: () => name,
      logger: { warn: vi.fn() },
      state: {
        forceAuthCheck: true,
        forceAuthCheckError,
      },
      throw: (status: number, error: Record<string, unknown>) => {
        throw Object.assign(new Error(String(status)), { status, ...error });
      },
    };

    await expect(authManager.middleware()(ctx as never, next)).rejects.toMatchObject({
      code: 'INVALID_TEMPORARY_ACCESS_CODE',
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
