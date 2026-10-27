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
  const envValues = { LDAP_BIND_PASSWORD: 'pass{{literal}}' };
  let cache: Cache;
  let db: any;
  let storer: Storer;
  let authManager: any;
  let registeredAuthConfig: any;
  let environment: any;

  // Mimics Environment.renderJsonTemplate: single-pass template resolution, so a resolved value
  // containing template syntax is only re-interpreted when the options are rendered a second time.
  const renderString = (value: string) =>
    value.replace(/\{\{\$env\.(\w+)\}\}|\{\{(\w+)\}\}/g, (_match, envKey: string) => {
      return envKey ? envValues[envKey] ?? '' : '';
    });

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
      renderJsonTemplate: vi.fn((template: any, options?: { omit?: string[] }) => {
        const omit = options?.omit || [];
        const rendered = JSON.parse(JSON.stringify(template));
        Object.keys(rendered.ldap || {}).forEach((key) => {
          if (typeof rendered.ldap[key] === 'string' && !omit.includes(`ldap.${key}`)) {
            rendered.ldap[key] = renderString(rendered.ldap[key]);
          }
        });
        return rendered;
      }),
    };
    authManager = {
      getAuthConfig: vi.fn(() => registeredAuthConfig),
    };
    storer = new Storer({ app: { environment } as any, db, cache, authManager });
  });

  const registerLdapAuthType = () => {
    registeredAuthConfig = { auth: { optionsKeysNotAllowedInEnv: ['ldap.filter'] } };
  };

  afterEach(() => {
    db = undefined;
    storer = undefined;
  });

  it('should keep the raw options while the auth type is not registered', async () => {
    const authenticator = await storer.get('ldap1');

    expect(authenticator.dataValues.options.ldap.filter).toBe(filter);
    expect(authenticator.dataValues.options.ldap.bindPassword).toBe('{{$env.LDAP_BIND_PASSWORD}}');
    expect(environment.renderJsonTemplate).not.toHaveBeenCalled();
  });

  it('should render the cached authenticator once the auth type is registered', async () => {
    await storer.get('ldap1');
    registerLdapAuthType();

    const authenticator = await storer.get('ldap1');

    expect(authenticator.dataValues.options.ldap.filter).toBe(filter);
    expect(authenticator.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    expect(environment.renderJsonTemplate).toHaveBeenCalledTimes(1);
    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
  });

  it('should not render a saved authenticator before its auth type is registered', async () => {
    const authenticator = createAuthenticator('ldap1', 'LDAP');
    await db.emitAsync('authenticators.afterSave', authenticator);

    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.filter).toBe(filter);
    expect(environment.renderJsonTemplate).not.toHaveBeenCalled();
  });

  it('should render once for concurrent first reads after the auth type is registered', async () => {
    await storer.get('ldap1');
    registerLdapAuthType();

    const [first, second] = await Promise.all([storer.get('ldap1'), storer.get('ldap1')]);

    expect(environment.renderJsonTemplate).toHaveBeenCalledTimes(1);
    expect(first.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    expect(second.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
  });

  it('should recover when a stale raw entry is written after the rendered one', async () => {
    const cacheManager = new CacheManager();
    const baseCache = await cacheManager.createCache({ name: 'test-gated' });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let delayNextWrite = false;
    const gatedCache: any = {
      get: (...args: any[]) => (baseCache.get as any)(...args),
      set: (...args: any[]) => (baseCache.set as any)(...args),
      del: (...args: any[]) => (baseCache.del as any)(...args),
      delValueInObject: (...args: any[]) => (baseCache.delValueInObject as any)(...args),
      setValueInObject: async (...args: any[]) => {
        if (delayNextWrite) {
          delayNextWrite = false;
          await gate;
        }
        return (baseCache.setValueInObject as any)(...args);
      },
    };
    const gatedDb = new MockDB([createAuthenticator('ldap1', 'LDAP')]);
    const gatedStorer = new Storer({
      app: { environment } as any,
      db: gatedDb,
      cache: gatedCache,
      authManager,
    });

    await gatedStorer.get('ldap1');
    delayNextWrite = true;
    const saving = gatedDb.emitAsync('authenticators.afterSave', createAuthenticator('ldap1', 'LDAP'));
    registerLdapAuthType();
    expect((await gatedStorer.get('ldap1')).dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');

    release();
    await saving;

    const stale = (await baseCache.get('authenticators')).ldap1;
    expect(stale.dataValues.options.ldap.bindPassword).toBe('{{$env.LDAP_BIND_PASSWORD}}');

    const healed = await gatedStorer.get('ldap1');
    expect(healed.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    expect(environment.renderJsonTemplate).toHaveBeenCalledTimes(2);
  });

  it('should render when the auth type is registered while the cache is being built', async () => {
    let releaseFind: () => void = () => undefined;
    const findGate = new Promise<void>((resolve) => (releaseFind = resolve));
    const slowDb: any = new MockDB([createAuthenticator('ldap1', 'LDAP')]);
    slowDb.getRepository = () => ({
      find: async () => {
        await findGate;
        return slowDb.data;
      },
    });
    const slowStorer = new Storer({ app: { environment } as any, db: slowDb, cache, authManager });

    const pending = slowStorer.get('ldap1');
    registerLdapAuthType();
    releaseFind();
    const authenticator = await pending;

    expect(authenticator.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    expect(environment.renderJsonTemplate).toHaveBeenCalledTimes(1);
    const authenticators = await cache.get('authenticators');
    expect(authenticators['ldap1'].dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
  });

  it('should not republish an authenticator removed during a lazy read', async () => {
    await storer.get('ldap1');
    registerLdapAuthType();

    const readCache = storer.getCache.bind(storer);
    let removed = false;
    (storer as any).getCache = async () => {
      const authenticators = await readCache();
      // Remove the entry after the lazy read captured it, before the options are rendered.
      if (!removed) {
        removed = true;
        await db.emitAsync('authenticators.afterSave', { ...createAuthenticator('ldap1', 'LDAP'), enabled: false });
      }
      return authenticators;
    };

    const authenticator = await storer.get('ldap1');
    expect(authenticator.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
    const authenticators = (await cache.get('authenticators')) || {};
    expect(authenticators['ldap1']).toBeUndefined();
  });

  it('should re-render when the cached model is saved again with new options', async () => {
    await storer.get('ldap1');
    registerLdapAuthType();
    await storer.get('ldap1');

    const cached = (await cache.get('authenticators')).ldap1;
    cached.dataValues.options = {
      ldap: {
        url: 'ldap://127.0.0.1:389',
        searchDN: 'dc=example,dc=com',
        bindPassword: '{{$env.LDAP_BIND_PASSWORD}}',
        filter,
      },
    };
    await db.emitAsync('authenticators.afterSave', cached);

    const saved = (await cache.get('authenticators')).ldap1;
    expect(saved.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
  });

  it('should not render twice when the cached model is saved without changing options', async () => {
    await storer.get('ldap1');
    registerLdapAuthType();
    await storer.get('ldap1');

    const cached = (await cache.get('authenticators')).ldap1;
    await db.emitAsync('authenticators.afterSave', cached);

    expect(environment.renderJsonTemplate).toHaveBeenCalledTimes(1);
    const saved = (await cache.get('authenticators')).ldap1;
    expect(saved.dataValues.options.ldap.bindPassword).toBe('pass{{literal}}');
  });
});
