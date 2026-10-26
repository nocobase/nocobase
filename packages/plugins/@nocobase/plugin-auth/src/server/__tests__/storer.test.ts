/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache, CacheManager } from '@nocobase/cache';
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

  it('should preserve raw template options until the auth type is registered', async () => {
    const originalFilter = '(sAMAccountName={{account}})';
    const ldapAuthenticator = {
      name: 'ldap',
      authType: 'LDAP',
      enabled: true,
      options: {
        ldap: { filter: originalFilter },
        url: '{{$env.LDAP_URL}}',
      },
    };
    db = new MockDB([ldapAuthenticator]);

    let authConfig: any;
    const renderJsonTemplate = jest.fn((options: any, settings: any = {}) => {
      const result = JSON.parse(JSON.stringify(options));
      if (!settings.omit?.includes('ldap.filter')) {
        result.ldap.filter = result.ldap.filter.replace('{{account}}', '');
      }
      result.url = 'https://ldap.example.test';
      return result;
    });
    const app = {
      environment: { renderJsonTemplate },
    };
    const authManager = {
      getAuthConfig: jest.fn(() => authConfig),
    };
    storer = new Storer({
      app: app as any,
      db,
      cache,
      authManager: authManager as any,
    });

    // A cache miss before LDAP registration must not render or mutate the template.
    const beforeRegistration = await storer.get('ldap');
    expect(beforeRegistration.options.ldap.filter).toBe(originalFilter);
    expect(renderJsonTemplate).not.toHaveBeenCalled();

    const cached = (await cache.get('authenticators')) as any;
    expect(cached.ldap.options.ldap.filter).toBe(originalFilter);

    // Once LDAP is registered, render using its options exclusion list.
    authConfig = {
      auth: {
        optionsKeysNotAllowedInEnv: ['ldap.filter'],
      },
    };
    const afterRegistration = await storer.get('ldap');
    expect(renderJsonTemplate).toHaveBeenCalledWith(ldapAuthenticator.options, {
      omit: ['ldap.filter'],
    });
    expect(afterRegistration.options.ldap.filter).toBe(originalFilter);
    expect(afterRegistration.options.url).toBe('https://ldap.example.test');

    // Rendering a response must not overwrite the raw value held in the cache.
    const cachedAfterRendering = (await cache.get('authenticators')) as any;
    expect(cachedAfterRendering.ldap.options.ldap.filter).toBe(originalFilter);
  });

  it('should not render authenticator options in afterSave before auth type registration', async () => {
    const originalFilter = '(sAMAccountName={{account}})';
    const ldapAuthenticator = {
      name: 'ldap',
      authType: 'LDAP',
      enabled: true,
      options: {
        ldap: { filter: originalFilter },
      },
    };
    const renderJsonTemplate = jest.fn();
    storer = new Storer({
      app: { environment: { renderJsonTemplate } } as any,
      db,
      cache,
      authManager: { getAuthConfig: () => undefined } as any,
    });

    await db.emitAsync('authenticators.afterSave', ldapAuthenticator);

    const cached = (await cache.get('authenticators')) as any;
    expect(renderJsonTemplate).not.toHaveBeenCalled();
    expect(cached.ldap.options.ldap.filter).toBe(originalFilter);
  });
});
