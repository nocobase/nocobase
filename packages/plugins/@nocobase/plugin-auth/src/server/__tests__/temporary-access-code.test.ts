/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache, CacheManager } from '@nocobase/cache';
import { vi } from 'vitest';
import { createAccessCodeAction } from '../actions/auth';
import {
  createTemporaryAccessCodeCache,
  INVALID_TEMPORARY_ACCESS_CODE,
  InvalidTemporaryAccessUrlError,
  normalizeTemporaryAccessUrl,
  resolveTemporaryAccessCode,
  TEMPORARY_ACCESS_CODE_HEADER,
  TemporaryAccessCodeRecord,
  TemporaryAccessCodeService,
} from '../temporary-access-code';

function createService() {
  const records = new Map<string, TemporaryAccessCodeRecord>();
  const cache = {
    get: async (key: string) => records.get(key),
    set: vi.fn(async (key: string, value: TemporaryAccessCodeRecord) => {
      records.set(key, value);
    }),
  } as unknown as Cache;
  return { cache, service: new TemporaryAccessCodeService(cache, 'main') };
}

describe('TemporaryAccessCodeService', () => {
  it('uses the configured default cache store', async () => {
    const cacheManager = new CacheManager({
      defaultStore: 'shared-memory',
      stores: {
        'shared-memory': {
          store: 'memory',
        },
      },
    });

    try {
      const defaultCache = await cacheManager.createCache({ name: 'default' });
      const temporaryAccessCodeCache = await createTemporaryAccessCodeCache(cacheManager);

      expect(temporaryAccessCodeCache.store).toBe(defaultCache.store);
    } finally {
      await cacheManager.close();
    }
  });

  it.each([
    'https://example.com/api/backups:download',
    '//example.com/api/backups:download',
    'backups/../backups:download',
    'backups/%252e%252e/backups:download',
    'backups:download#fragment',
    ...['_code', 'token', '__appName'].map((name) => `backups:download?${name}=value`),
    '/api/backups:download',
  ])('rejects an external, unsafe, or reserved URL pattern: %s', (url) => {
    expect(() => normalizeTemporaryAccessUrl(url)).toThrow(InvalidTemporaryAccessUrlError);
  });

  it('stores the code with a 30 second TTL and matches exact or wildcard URL patterns within the app', async () => {
    const { cache, service } = createService();
    const result = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName: 'admin',
      url: 'files:download?tag=one&file=a.txt&flag',
    });

    expect(result.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cache.set).toHaveBeenCalledWith(
      `temporary-access-code:${result.code}`,
      expect.objectContaining({ appName: 'main', urlPattern: '/files:download?file=a.txt&flag=&tag=one' }),
      30_000,
    );

    const record = (await service.get(result.code)) as TemporaryAccessCodeRecord;
    const request = {
      appName: 'main',
      path: '/api/files:download',
      querystring: `tag=one&_code=${result.code}&flag&__appName=main&file=a.txt`,
    };
    expect(service.matches(record, request)).toBe(true);
    expect(service.matches(record, { ...request, appName: 'sub-app' })).toBe(false);
    expect(service.matches(record, { ...request, path: '/api/files:other' })).toBe(false);
    expect(service.matches(record, { ...request, querystring: 'file=changed.txt&flag&tag=one' })).toBe(false);

    const wildcard = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      url: 'files:*?file=*',
    });
    const wildcardRecord = (await service.get(wildcard.code)) as TemporaryAccessCodeRecord;
    expect(
      service.matches(wildcardRecord, {
        appName: 'main',
        path: '/api/files:download',
        querystring: 'file=another.txt',
      }),
    ).toBe(true);
  });
});

async function issueCode(service: TemporaryAccessCodeService, roleName?: string, url = 'files:download?file=a.txt') {
  return (
    await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName,
      url,
    })
  ).code;
}

function createContext(options: {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  path?: string;
  querystring: string;
}) {
  const method = options.method || 'GET';
  const path = options.path || '/api/files:download';
  const originalUrl = `${path}?${options.querystring}`;
  const headers = Object.fromEntries(
    Object.entries(options.headers || {}).map(([name, value]) => [name.toLowerCase(), value]),
  );
  const responseHeaders: Record<string, string> = {};
  return {
    app: { name: 'main' },
    get: (name: string) => headers[name.toLowerCase()] || '',
    headers,
    method,
    originalUrl,
    path,
    querystring: options.querystring,
    req: { method, originalUrl },
    request: { body: options.body ?? {}, originalUrl },
    remove: (name: string) => delete responseHeaders[name.toLowerCase()],
    responseHeaders,
    set: (name: string, value: string) => {
      responseHeaders[name.toLowerCase()] = value;
    },
    state: {},
    t: (message: string) => message,
    throw: (status: number, error: Record<string, unknown> = {}) => {
      throw Object.assign(new Error(String(error.message || status)), { status, ...error });
    },
  };
}

describe('temporary access code middleware', () => {
  it('restores authentication and prevents token exposure or caching', async () => {
    const { service } = createService();
    const code = await issueCode(service, 'admin');

    const ctx = createContext({ querystring: `file=a.txt&_code=${code}&__appName=main` });
    const next = vi.fn(async () => ctx.set('X-New-Token', 'renewed-token'));

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(ctx.querystring).toBe('file=a.txt');
    expect(ctx.originalUrl).toBe('/api/files:download?file=a.txt');
    expect(ctx.request.originalUrl).toBe(ctx.originalUrl);
    expect(ctx.req.originalUrl).toBe(ctx.originalUrl);
    expect(ctx.headers).toMatchObject({ 'x-authenticator': 'basic', 'x-role': 'admin' });
    expect(ctx.state).toMatchObject({ authenticatedByAccessCode: true });
    expect((ctx as typeof ctx & { getBearerToken: () => string }).getBearerToken()).toBe('session-token');
    expect(ctx.responseHeaders).toMatchObject({ 'cache-control': 'private, no-store' });
    expect(ctx.responseHeaders['x-new-token']).toBeUndefined();
  });

  it('accepts a POST body through the header code and gives the header precedence over the query code', async () => {
    const { service } = createService();
    const code = await issueCode(service, undefined, 'files:download?file=*');
    const body = { value: 'unchanged' };
    const ctx = createContext({
      body,
      headers: { [TEMPORARY_ACCESS_CODE_HEADER]: code },
      method: 'POST',
      querystring: 'file=b.txt&_code=invalid',
    });
    const next = vi.fn();

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(ctx.request.body).toBe(body);
    expect(ctx.get(TEMPORARY_ACCESS_CODE_HEADER)).toBe('');
    expect(ctx.querystring).toBe('file=b.txt');
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects duplicate query codes', async () => {
    const { service } = createService();
    const code = await issueCode(service);
    const ctx = createContext({ querystring: `file=a.txt&_code=${code}&_code=${code}` });

    await expect(resolveTemporaryAccessCode(service)(ctx as never, vi.fn())).rejects.toMatchObject({
      code: INVALID_TEMPORARY_ACCESS_CODE,
      status: 401,
    });
  });

  it('keeps Authorization precedence while removing temporary credentials', async () => {
    const { service } = createService();
    const ctx = createContext({
      headers: { Authorization: 'Bearer token', [TEMPORARY_ACCESS_CODE_HEADER]: 'invalid' },
      querystring: '_code=invalid&__appName=main&file=a.txt',
    });
    const next = vi.fn();

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(ctx.querystring).toBe('file=a.txt');
    expect(ctx.get(TEMPORARY_ACCESS_CODE_HEADER)).toBe('');
    expect(next).toHaveBeenCalledOnce();
  });
});

function createActionContext(
  options: {
    decoded?: Record<string, unknown>;
    renewedToken?: string;
    state?: Record<string, unknown>;
  } = {},
) {
  const responseHeaders: Record<string, string> = {};
  return {
    action: { params: { values: { url: 'files:download?file=*' } } },
    app: {
      authManager: {
        jwt: { decode: vi.fn(async () => options.decoded || { jti: 'session-jti', temp: true }) },
      },
    },
    body: undefined,
    getBearerToken: () => 'session-token',
    method: 'POST',
    res: { getHeader: () => options.renewedToken },
    responseHeaders,
    set: (name: string, value: string) => (responseHeaders[name.toLowerCase()] = value),
    state: { currentAuthenticator: 'basic', currentRole: 'admin', ...options.state },
    t: (message: string) => message,
    throw: (status: number, error: Record<string, unknown> = {}) => {
      throw Object.assign(new Error(), { status, ...error });
    },
  };
}

describe('createAccessCodeAction', () => {
  it('creates a code from the current user session', async () => {
    const service = { create: vi.fn(async () => ({ code: 'opaque-code' })) } as unknown as TemporaryAccessCodeService;
    const ctx = createActionContext({ renewedToken: 'renewed-session-token' });
    await createAccessCodeAction(service)(ctx as never, vi.fn());

    expect(service.create).toHaveBeenCalledWith({
      accessToken: 'renewed-session-token',
      authenticator: 'basic',
      roleName: 'admin',
      url: 'files:download?file=*',
    });
    expect(ctx.body).toEqual({ code: 'opaque-code' });
    expect(ctx.responseHeaders['cache-control']).toBe('private, no-store');
  });

  it.each([
    ['an API token', { decoded: { jti: 'api-jti' } }, 403],
    ['another access code', { state: { authenticatedByAccessCode: true } }, 403],
  ])('rejects %s', async (_case, options, status) => {
    const service = { create: vi.fn() } as unknown as TemporaryAccessCodeService;
    await expect(createAccessCodeAction(service)(createActionContext(options) as never, vi.fn())).rejects.toMatchObject(
      {
        status,
      },
    );
    expect(service.create).not.toHaveBeenCalled();
  });

  it('maps invalid URLs to a stable error', async () => {
    const service = {
      create: vi.fn().mockRejectedValue(new InvalidTemporaryAccessUrlError()),
    } as unknown as TemporaryAccessCodeService;

    await expect(createAccessCodeAction(service)(createActionContext() as never, vi.fn())).rejects.toMatchObject({
      code: 'INVALID_TEMPORARY_ACCESS_URL',
      status: 400,
    });
  });
});
