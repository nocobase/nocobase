/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { vi } from 'vitest';
import { createAccessCodeAction } from '../actions/auth';
import {
  captureTemporaryAccessRequestMethod,
  INVALID_TEMPORARY_ACCESS_CODE,
  InvalidTemporaryAccessTargetError,
  normalizeTemporaryAccessTarget,
  resolveTemporaryAccessCode,
  TEMPORARY_ACCESS_CODE_TTL,
  TemporaryAccessCodeRecord,
  TemporaryAccessCodeService,
} from '../temporary-access-code';

describe('TemporaryAccessCodeService', () => {
  const originalApiBasePath = process.env.API_BASE_PATH;

  beforeAll(() => {
    process.env.API_BASE_PATH = '/api';
  });

  afterAll(() => {
    if (originalApiBasePath === undefined) {
      delete process.env.API_BASE_PATH;
    } else {
      process.env.API_BASE_PATH = originalApiBasePath;
    }
  });

  it('normalizes an action target without treating the action colon as a URL scheme', () => {
    expect(normalizeTemporaryAccessTarget('backups:download?b=2&a=1&a=0')).toBe('/backups:download?b=2&a=1&a=0');
    expect(normalizeTemporaryAccessTarget('/api/backups:download?filterByTk=a.nbdata')).toBe(
      '/backups:download?filterByTk=a.nbdata',
    );
    expect(normalizeTemporaryAccessTarget('files:download?flag&empty=')).toBe('/files:download?flag&empty=');
    expect(normalizeTemporaryAccessTarget('files:download?flag=')).toBe('/files:download?flag=');
    expect(normalizeTemporaryAccessTarget('files:download?a=1&a%5Bb%5D=2')).not.toBe(
      normalizeTemporaryAccessTarget('files:download?a%5Bb%5D=2&a=1'),
    );
  });

  it.each([
    'https://example.com/api/backups:download',
    'http://example.com/api/backups:download',
    '//example.com/api/backups:download',
    '../backups:download',
    'backups/../backups:download',
    'backups/%2e%2e/backups:download',
    'backups:download#fragment',
    'backups:download?accessCode=code',
    'backups:download?token=token',
    'backups:download?__appName=sub-app',
  ])('rejects an unsafe or reserved target: %s', (target) => {
    expect(() => normalizeTemporaryAccessTarget(target)).toThrow(InvalidTemporaryAccessTargetError);
  });

  it('stores only a hashed cache key with the fixed TTL and allows repeated GET/HEAD matches', async () => {
    const records = new Map<string, TemporaryAccessCodeRecord>();
    const set = vi.fn(async (key: string, value: TemporaryAccessCodeRecord) => {
      records.set(key, value);
    });
    const get = vi.fn(async (key: string) => records.get(key));
    const cache = { set, get } as unknown as Cache;
    const service = new TemporaryAccessCodeService(cache, 'main');
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);

    const result = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName: 'admin',
      target: 'backups:download?filterByTk=a.nbdata&tag=b&tag=a',
    });

    expect(result.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.code).not.toContain('.');
    expect(result.expiresAt).toBe(1_000 + TEMPORARY_ACCESS_CODE_TTL);
    expect(set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:temporary-access-code:[a-f0-9]{64}$/),
      expect.objectContaining({
        accessToken: 'session-token',
        appName: 'main',
        authenticator: 'basic',
        method: 'GET',
        roleName: 'admin',
        target: '/backups:download?filterByTk=a.nbdata&tag=b&tag=a',
      }),
      TEMPORARY_ACCESS_CODE_TTL,
    );
    expect(set.mock.calls[0][0]).not.toContain(result.code);

    const record = await service.get(result.code);
    expect(record).toBeDefined();
    if (!record) {
      throw new Error('Expected temporary access code record');
    }
    expect(
      service.matches(record, {
        appName: 'main',
        method: 'GET',
        path: '/api/backups:download',
        querystring: `filterByTk=a.nbdata&tag=b&accessCode=${result.code}&__appName=main&tag=a`,
      }),
    ).toBe(true);
    expect(
      service.matches(record, {
        appName: 'main',
        method: 'HEAD',
        path: '/api/backups:download',
        querystring: `filterByTk=a.nbdata&tag=b&tag=a&accessCode=${result.code}`,
      }),
    ).toBe(true);
    expect(
      service.matches(record, {
        appName: 'sub-app',
        method: 'GET',
        path: '/api/backups:download',
        querystring: `filterByTk=a.nbdata&tag=b&tag=a&accessCode=${result.code}`,
      }),
    ).toBe(false);
    expect(
      service.matches(record, {
        appName: 'main',
        method: 'POST',
        path: '/api/backups:download',
        querystring: `filterByTk=a.nbdata&tag=b&tag=a&accessCode=${result.code}`,
      }),
    ).toBe(false);
    expect(
      service.matches(record, {
        appName: 'main',
        method: 'GET',
        path: '/api/backups:download',
        querystring: `filterByTk=other.nbdata&tag=b&tag=a&accessCode=${result.code}`,
      }),
    ).toBe(false);

    now.mockRestore();
  });

  it('does not query the cache for a malformed code', async () => {
    const get = vi.fn();
    const service = new TemporaryAccessCodeService({ get } as unknown as Cache, 'main');

    expect(await service.get('not-a-generated-code')).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });
});

function createMockContext(options: {
  authorization?: string;
  body?: unknown;
  contentLength?: number;
  method?: string;
  originalMethod?: string;
  path?: string;
  querystring: string;
  transferEncoding?: string;
}) {
  const path = options.path || '/api/files:download';
  const originalUrl = options.querystring ? `${path}?${options.querystring}` : path;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  const responseHeaders: Record<string, string> = {};
  if (options.contentLength !== undefined) {
    headers['content-length'] = String(options.contentLength);
  }
  if (options.transferEncoding) {
    headers['transfer-encoding'] = options.transferEncoding;
  }
  const ctx = {
    app: { name: 'main' },
    get: (name: string) => {
      const normalizedName = name.toLowerCase();
      return normalizedName === 'authorization' ? options.authorization || '' : headers[normalizedName] || '';
    },
    headers: {},
    method,
    originalUrl,
    path,
    querystring: options.querystring,
    req: { headers, method: options.originalMethod || method, originalUrl },
    request: { body: options.body ?? {}, originalUrl },
    remove: (name: string) => {
      delete responseHeaders[name.toLowerCase()];
    },
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
  return ctx;
}

describe('temporary access code middleware', () => {
  function createService() {
    const records = new Map<string, TemporaryAccessCodeRecord>();
    const cache = {
      get: async (key: string) => records.get(key),
      set: async (key: string, value: TemporaryAccessCodeRecord) => {
        records.set(key, value);
      },
    } as unknown as Cache;
    return new TemporaryAccessCodeService(cache, 'main');
  }

  it('restores authentication, strips the reserved query parameter, and keeps the code reusable', async () => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName: 'admin',
      target: 'files:download?file=a.txt',
    });
    const middleware = resolveTemporaryAccessCode(service);
    const querystring = `file=a.txt&accessCode=${code}&__appName=main`;

    for (let index = 0; index < 2; index++) {
      const ctx = createMockContext({ querystring });
      const next = vi.fn(async () => {});
      await middleware(ctx as never, next);

      expect(next).toHaveBeenCalledOnce();
      expect(ctx.querystring).toBe('file=a.txt&__appName=main');
      expect(ctx.originalUrl).not.toContain('accessCode');
      expect(ctx.request.originalUrl).not.toContain('accessCode');
      expect(ctx.req.originalUrl).not.toContain('accessCode');
      expect(ctx.headers).toMatchObject({ 'x-authenticator': 'basic', 'x-role': 'admin' });
      expect(ctx.responseHeaders['cache-control']).toBe('private, no-store');
      expect(ctx.state).toMatchObject({
        authenticatedByAccessCode: true,
        disableTokenRenewal: true,
        forceAuthCheck: true,
        forceAuthCheckError: expect.objectContaining({ code: INVALID_TEMPORARY_ACCESS_CODE }),
      });
      expect((ctx as typeof ctx & { getBearerToken: () => string }).getBearerToken()).toBe('session-token');
    }
  });

  it('preserves bare query parameters and binds them differently from empty strings', async () => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      target: 'files:download?flag&empty=&name=a%20b',
    });
    const querystring = `flag&accessCode=${code}&empty=&name=a%20b`;
    const ctx = createMockContext({ querystring });
    const next = vi.fn(async () => {
      ctx.set('X-New-Token', 'renewed-session-token');
    });

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.querystring).toBe('flag&empty=&name=a%20b');
    expect(ctx.originalUrl).toContain('flag&empty=&name=a%20b');
    expect(ctx.responseHeaders['cache-control']).toBe('private, no-store');
    expect(ctx.responseHeaders['x-new-token']).toBeUndefined();

    const changedCtx = createMockContext({
      querystring: `flag=&accessCode=${code}&empty=&name=a%20b`,
    });
    await expect(resolveTemporaryAccessCode(service)(changedCtx as never, vi.fn())).rejects.toMatchObject({
      code: INVALID_TEMPORARY_ACCESS_CODE,
      status: 401,
    });
  });

  it.each([
    { method: 'GET', query: 'file=changed.txt' },
    { method: 'POST', query: 'file=a.txt' },
    { method: 'GET', query: 'file=a.txt', appName: 'sub-app' },
  ])('rejects a request outside the code scope: $method $query', async ({ method, query, appName }) => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      target: 'files:download?file=a.txt',
    });
    const ctx = createMockContext({ method, querystring: `${query}&accessCode=${code}` });
    ctx.app.name = appName || 'main';

    await expect(resolveTemporaryAccessCode(service)(ctx as never, vi.fn())).rejects.toMatchObject({
      code: INVALID_TEMPORARY_ACCESS_CODE,
      status: 401,
    });
    expect(ctx.originalUrl).not.toContain('accessCode');
  });

  it('rejects a POST rewritten to GET by method override middleware', async () => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      target: 'files:download?file=a.txt',
    });
    const ctx = createMockContext({
      body: { __method__: 'get', __params__: {} },
      method: 'POST',
      querystring: `file=a.txt&accessCode=${code}`,
    });
    const next = vi.fn();

    await captureTemporaryAccessRequestMethod(ctx as never, async () => {
      // Koa's method setter mutates req.method, while the existing method
      // override middleware also consumes its control fields from the body.
      ctx.method = 'GET';
      ctx.req.method = 'GET';
      ctx.request.body = {};

      await expect(resolveTemporaryAccessCode(service)(ctx as never, next)).rejects.toMatchObject({
        code: INVALID_TEMPORARY_ACCESS_CODE,
        status: 401,
      });
    });
    expect(next).not.toHaveBeenCalled();
    expect(ctx.originalUrl).not.toContain('accessCode');
  });

  it.each([
    { body: { unexpected: true }, description: 'parsed content' },
    { body: {}, contentLength: 10, description: 'content-length' },
    { body: {}, description: 'transfer-encoding', transferEncoding: 'chunked' },
  ])('rejects a GET request body detected from $description', async ({ body, contentLength, transferEncoding }) => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      target: 'files:download?file=a.txt',
    });
    const ctx = createMockContext({
      body,
      contentLength,
      querystring: `file=a.txt&accessCode=${code}`,
      transferEncoding,
    });
    const next = vi.fn();

    await expect(resolveTemporaryAccessCode(service)(ctx as never, next)).rejects.toMatchObject({
      code: INVALID_TEMPORARY_ACCESS_CODE,
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
    expect(ctx.originalUrl).not.toContain('accessCode');
  });

  it('accepts an unmodified HEAD request without a body', async () => {
    const service = createService();
    const { code } = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      target: 'files:download?file=a.txt',
    });
    const ctx = createMockContext({
      method: 'HEAD',
      querystring: `file=a.txt&accessCode=${code}`,
    });
    const next = vi.fn(async () => {});

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((ctx as typeof ctx & { getBearerToken: () => string }).getBearerToken()).toBe('session-token');
  });

  it('lets Authorization take precedence while still stripping accessCode', async () => {
    const service = createService();
    const ctx = createMockContext({
      authorization: 'Bearer regular-token',
      querystring: 'file=a.txt&accessCode=invalid',
    });
    const next = vi.fn(async () => {
      ctx.set('X-New-Token', 'renewed-session-token');
    });

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.querystring).toBe('file=a.txt');
    expect(ctx.responseHeaders['cache-control']).toBe('private, no-store');
    expect(ctx.responseHeaders['x-new-token']).toBe('renewed-session-token');
    expect(ctx.state).toEqual({});
  });
});

describe('createAccessCodeAction', () => {
  function createActionContext(
    options: {
      decoded?: Record<string, unknown>;
      method?: string;
      state?: Record<string, unknown>;
    } = {},
  ) {
    const responseHeaders: Record<string, string> = {};
    return {
      action: { params: { values: { target: 'files:download?file=a.txt' } } },
      app: {
        authManager: {
          jwt: {
            decode: vi.fn(async () => options.decoded || { jti: 'session-jti', temp: true }),
          },
        },
      },
      body: undefined,
      getBearerToken: () => 'session-token',
      method: options.method || 'POST',
      responseHeaders,
      res: { getHeader: () => undefined },
      set: (name: string, value: string) => {
        responseHeaders[name.toLowerCase()] = value;
      },
      state: {
        currentAuthenticator: 'basic',
        currentRole: 'admin',
        ...options.state,
      },
      t: (message: string) => message,
      throw: (status: number, error: Record<string, unknown> = {}) => {
        throw Object.assign(new Error(String(error.message || status)), { status, ...error });
      },
    };
  }

  it('creates a code from the current interactive session and role', async () => {
    const service = {
      create: vi.fn(async () => ({ code: 'opaque-code', expiresAt: 31_000 })),
    } as unknown as TemporaryAccessCodeService;
    const ctx = createActionContext();
    const next = vi.fn(async () => {});

    await createAccessCodeAction(service)(ctx as never, next);

    expect(service.create).toHaveBeenCalledWith({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName: 'admin',
      target: 'files:download?file=a.txt',
    });
    expect(ctx.body).toEqual({ code: 'opaque-code', expiresAt: 31_000 });
    expect(ctx.responseHeaders['cache-control']).toBe('private, no-store');
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([
    { decoded: { jti: 'api-jti' }, expectedStatus: 403 },
    { decoded: { temp: true }, expectedStatus: 403 },
    { state: { authenticatedByAccessCode: true }, expectedStatus: 403 },
    { method: 'GET', expectedStatus: 405 },
  ])('rejects non-session issuers and non-POST calls', async ({ decoded, expectedStatus, method, state }) => {
    const service = { create: vi.fn() } as unknown as TemporaryAccessCodeService;
    const ctx = createActionContext({ decoded, method, state });

    await expect(createAccessCodeAction(service)(ctx as never, vi.fn())).rejects.toMatchObject({
      status: expectedStatus,
    });
    expect(service.create).not.toHaveBeenCalled();
  });

  it('maps invalid targets to a stable 400 error', async () => {
    const service = {
      create: vi.fn(async () => {
        throw new InvalidTemporaryAccessTargetError();
      }),
    } as unknown as TemporaryAccessCodeService;
    const ctx = createActionContext();

    await expect(createAccessCodeAction(service)(ctx as never, vi.fn())).rejects.toMatchObject({
      code: 'INVALID_TEMPORARY_ACCESS_TARGET',
      status: 400,
    });
  });
});
