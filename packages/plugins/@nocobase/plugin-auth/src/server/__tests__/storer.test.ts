/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache, CacheManager } from '@nocobase/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Storer } from '../storer';

class MockDB {
  data: any;
  hooks = {};

  constructor(data: any) {
    this.data = data;
  }

  on(name: string, func: (...args: any[]) => Promise<void>) {
    this.hooks[name] = func;
  }

  async emitAsync(name: string, ...args: any[]) {
    const func = this.hooks[name];
    if (func) {
      await func(...args);
    }
  }

  getRepository() {
    return {
      find: async () => {
        return this.data;
      },
    };
  }
}

describe('storer', () => {
  let db: any;
  let storer: Storer;
  let cache: Cache;
  const data = [
    {
      name: 'test1',
      enabled: true,
    },
    {
      name: 'test2',
      enabled: true,
    },
  ];

  beforeEach(async () => {
    const cacheManager = new CacheManager();
    cache = await cacheManager.createCache({ name: 'test' });
    db = new MockDB(data);
    storer = new Storer({ db, cache });
  });

  afterEach(() => {
    db = undefined;
    storer = undefined;
  });

  it('should get authenticator from cache', async () => {
    expect(await cache.get('authenticators')).toBeUndefined();
    let authenticator = await storer.get('test1');
    expect(authenticator).toBeDefined();

    expect(await cache.get('authenticators')).toBeDefined();
    authenticator = await storer.get('test1');
    expect(authenticator).toBeDefined();
  });

  it('should only load database authenticators', async () => {
    const authenticator = await storer.get('test1');
    expect(authenticator.name).toBe('test1');
  });

  it('should delete from cache on afterDestory', async () => {
    expect(await storer.get('test1')).toBeDefined();
    await db.emitAsync('authenticators.afterDestroy', data[0]);
    const authenticators = await cache.get('authenticators');
    expect(authenticators['test1']).toBeUndefined();
  });

  it('should delete from cache on afterSave as disabled', async () => {
    expect(await storer.get('test1')).toBeDefined();
    await db.emitAsync('authenticators.afterSave', { ...data[0], enabled: false });
    const authenticators = await cache.get('authenticators');
    expect(authenticators['test1']).toBeUndefined();
  });

  it('should set cache on afterSave as enabled', async () => {
    expect(await storer.get('test1')).toBeDefined();
    await db.emitAsync('authenticators.afterSave', { name: 'test3', enabled: true });
    const authenticators = await cache.get('authenticators');
    expect(authenticators['test3']).toBeDefined();
  });
});

describe('storer with a not yet registered auth type', () => {
  const filter = '(sAMAccountName={{account}})';
  let cache: Cache;
  let db: any;
  let storer: Storer;
  let registeredAuthConfig: any;
  let environment: any;

  const createAuthenticator = (name: string, authType: string) => ({
    name,
    authType,
    enabled: true,
    dataValues: {
      options: {
        ldap: {
          url: 'ldap://127.0.0.1:389',
          searchDN: 'dc=example,dc=com',
          bindPassword: '{{$env.LDAP_BIND_PASSWORD}}',
          filter,
        },
      },
    },
  });

  beforeEach(async () => {
    const cacheManager = new CacheManager();
    cache = await cacheManager.createCache({ name: 'test' });
    db = new MockDB([createAuthenticator('ldap1', 'LDAP')]);
    registeredAuthConfig = undefined;
    environment = {
      // Mirrors Environment.renderJsonTemplate: without the omit list the business placeholder is replaced with an empty string.
      renderJsonTemplate: vi.fn((template: any, options?: { omit?: string[] }) => {
        const rendered = JSON.parse(JSON.stringify(template));
        if (rendered.ldap && !options?.omit?.includes('ldap.filter')) {
          rendered.ldap.filter = '(sAMAccountName=)';
        }
        rendered.ldap.bindPassword = 'secret';
        return rendered;
      }),
    };
    const authManager = {
      getAuthConfig: vi.fn(() => registeredAuthConfig),
    };
    storer = new Storer({ app: { environment } as any, db, cache, authManager: authManager as any });
  });

  afterEach(() => {
    db = undefined;
    storer = undefined;
  });

  it('should keep the raw filter while the auth type is not registered', async () => {
    const authenticator = await storer.get('ldap1');

    expect(authenticator.dataValues.options.ldap.filter).toBe(filter);
    expect(environment.renderJsonTemplate).not.toHaveBeenCalled();
  });

  it('should render the cached authenticator once the auth type is registered', async () => {
    await storer.get('ldap1');
    registeredAuthConfig = { auth: { optionsKeysNotAllowedInEnv: ['ldap.filter'] } };

    const authenticator = await storer.get('ldap1');

    expect(authenticator.dataValues.options.ldap.filter).toBe(filter);
    expect(authenticator.dataValues.options.ldap.bindPassword).toBe('secret');
    expect(environment.renderJsonTemplate).toHaveBeenCalledWith(expect.anything(), { omit: ['ldap.filter'] });
    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.bindPassword).toBe('secret');
  });

  it('should not render a saved authenticator before its auth type is registered', async () => {
    const authenticator = createAuthenticator('ldap1', 'LDAP');
    await db.emitAsync('authenticators.afterSave', authenticator);

    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.filter).toBe(filter);
    expect(environment.renderJsonTemplate).not.toHaveBeenCalled();
  });
});
