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
import { getAuthCookieName } from '@nocobase/utils';
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

  getAuthenticator() {
    return this.authenticator;
  }

  getResolvedOptions() {
    return this.options;
  }
}

class LDAPTestAuth extends BasicAuth {
  static readonly optionsKeysNotAllowedInEnv = ['ldap.filter'];
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

  it('should render options while preserving authenticator model methods and memoize rendering', async () => {
    const originalFilter = '(sAMAccountName={{account}})';
    const authenticator: any = {
      name: 'ldap-test',
      authType: 'ldap',
      options: {
        ldap: { filter: originalFilter },
        url: '{{$env.LDAP_URL}}',
      },
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      findUser: vi.fn(),
    };
    storer.set(authenticator.name, authenticator);
    authManager.registerTypes('ldap', { auth: LDAPTestAuth });

    const renderJsonTemplate = vi.fn((options: any) => ({
      ...options,
      ldap: { ...options.ldap },
      url: 'ldaps://ldap.example.test',
    }));
    const ctx = {
      app: {
        environment: { renderJsonTemplate },
      },
    } as any as Context;

    const firstAuth = (await authManager.get('ldap-test', ctx)) as LDAPTestAuth;
    expect(firstAuth.getAuthenticator()).toBe(authenticator);
    expect(typeof firstAuth.getAuthenticator().findUser).toBe('function');
    expect(firstAuth.getResolvedOptions()).toEqual({
      ldap: { filter: originalFilter },
      url: 'ldaps://ldap.example.test',
    });
    expect(authenticator.options.url).toBe('{{$env.LDAP_URL}}');
    expect(renderJsonTemplate).toHaveBeenCalledWith(authenticator.options, {
      omit: ['ldap.filter'],
    });

    const secondAuth = (await authManager.get('ldap-test', ctx)) as LDAPTestAuth;
    expect(secondAuth.getAuthenticator()).toBe(authenticator);
    expect(renderJsonTemplate).toHaveBeenCalledTimes(1);

    // Saving updated options must invalidate the memoized rendered copy.
    authenticator.options = {
      ...authenticator.options,
      url: '{{$env.LDAP_URL}}/updated',
    };
    authenticator.updatedAt = new Date('2026-01-02T00:00:00.000Z');
    await authManager.get('ldap-test', ctx);
    expect(renderJsonTemplate).toHaveBeenCalledTimes(2);
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

  it('should get authenticator from cookie before default authenticator', async () => {
    authManager = new AuthManager({
      authKey: 'X-Authenticator',
      default: 'basic-test',
    });
    authManager.registerTypes('basic', { auth: BasicAuth });
    storer = new MockStorer();
    storer.set('basic-test', { name: 'basic-test', authType: 'basic', options: {} });
    storer.set('cookie-test', { name: 'cookie-test', authType: 'basic', options: {} });
    authManager.setStorer(storer);

    const ctx = {
      get: (name: string) => (name === 'X-Authenticator' ? '' : undefined),
      cookies: {
        get: (name: string) => (name === getAuthCookieName('authenticator', 'main') ? 'cookie-test' : undefined),
        set: vi.fn(),
      },
      app: { name: 'main', authManager, options: { acl: false } },
      logger: { warn: vi.fn() },
    } as any;
    const next = vi.fn();

    await authManager.middleware()(ctx, next);

    expect(ctx.auth).toBeInstanceOf(BasicAuth);
    expect(ctx.auth.authenticator.name).toBe('cookie-test');
    expect(next).toHaveBeenCalled();
  });

  it('should clear invalid authenticator cookie and fallback to default authenticator', async () => {
    authManager = new AuthManager({
      authKey: 'X-Authenticator',
      default: 'basic-test',
    });
    authManager.registerTypes('basic', { auth: BasicAuth });
    storer = new MockStorer();
    storer.set('basic-test', { name: 'basic-test', authType: 'basic', options: {} });
    authManager.setStorer(storer);

    const ctx = {
      get: (name: string) => (name === 'X-Authenticator' ? '' : undefined),
      cookies: {
        get: (name: string) => (name === getAuthCookieName('authenticator', 'main') ? 'missing-test' : undefined),
        set: vi.fn(),
      },
      app: { name: 'main', authManager, options: { acl: false } },
      headers: {},
      protocol: 'http',
      logger: { warn: vi.fn() },
    } as any;
    const next = vi.fn();

    await authManager.middleware()(ctx, next);

    expect(ctx.cookies.set).toHaveBeenCalledWith(
      getAuthCookieName('authenticator', 'main'),
      null,
      expect.objectContaining({ path: '/', sameSite: 'lax', httpOnly: true }),
    );
    expect(ctx.auth).toBeInstanceOf(BasicAuth);
    expect(ctx.auth.authenticator.name).toBe('basic-test');
    expect(next).toHaveBeenCalled();
  });
});
