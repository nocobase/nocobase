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
  it.each([
    'https://example.com/api/backups:download',
    '//example.com/api/backups:download',
    'backups/../backups:download',
    'backups/%252e%252e/backups:download',
    'backups:download#fragment',
    ...['accessCode', 'token', '__appName'].map((name) => `backups:download?${name}=value`),
    '/api/backups:download',
  ])('rejects an external, unsafe, or reserved target: %s', (target) => {
    expect(() => normalizeTemporaryAccessTarget(target)).toThrow(InvalidTemporaryAccessTargetError);
  });

  it('stores the code directly with a 30 second TTL and binds it to app, path, query, and GET/HEAD', async () => {
    const { cache, service } = createService();
    const result = await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName: 'admin',
      target: 'files:download?flag&file=a.txt&tag=one&tag=two',
    });

    expect(result.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cache.set).toHaveBeenCalledWith(
      `temporary-access-code:${result.code}`,
      expect.objectContaining({ appName: 'main', target: '/files:download?flag=&file=a.txt&tag=one&tag=two' }),
      30_000,
    );

    const record = (await service.get(result.code)) as TemporaryAccessCodeRecord;
    const request = {
      appName: 'main',
      method: 'GET',
      path: '/api/files:download',
      querystring: `flag=&file=a.txt&tag=one&accessCode=${result.code}&__appName=main&tag=two`,
    };
    expect(service.matches(record, request)).toBe(true);
    expect(service.matches(record, { ...request, method: 'HEAD' })).toBe(true);
    expect(service.matches(record, { ...request, appName: 'sub-app' })).toBe(false);
    expect(service.matches(record, { ...request, method: 'POST' })).toBe(false);
    expect(service.matches(record, { ...request, path: '/api/files:other' })).toBe(false);
    expect(service.matches(record, { ...request, path: '/files:download' })).toBe(false);
    expect(service.matches(record, { ...request, querystring: `file=changed.txt&accessCode=${result.code}` })).toBe(
      false,
    );
  });
});

async function issueCode(service: TemporaryAccessCodeService, roleName?: string) {
  return (
    await service.create({
      accessToken: 'session-token',
      authenticator: 'basic',
      roleName,
      target: 'files:download?file=a.txt',
    })
  ).code;
}

function createContext(options: { body?: unknown; method?: string; querystring: string }) {
  const method = options.method || 'GET';
  const path = '/api/files:download';
  const originalUrl = `${path}?${options.querystring}`;
  const responseHeaders: Record<string, string> = {};
  return {
    app: { name: 'main' },
    get: () => '',
    headers: {},
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
  it('restores authentication and prevents renewal or caching', async () => {
    const { service } = createService();
    const code = await issueCode(service, 'admin');

    const ctx = createContext({ querystring: `file=a.txt&accessCode=${code}&__appName=main` });
    const next = vi.fn(async () => ctx.set('X-New-Token', 'renewed-token'));

    await resolveTemporaryAccessCode(service)(ctx as never, next);

    expect(ctx.querystring).toBe('file=a.txt&__appName=main');
    expect(ctx.headers).toMatchObject({ 'x-authenticator': 'basic', 'x-role': 'admin' });
    expect(ctx.state).toMatchObject({
      authenticatedByAccessCode: true,
      disableTokenRenewal: true,
      forceAuthCheck: true,
    });
    expect((ctx as typeof ctx & { getBearerToken: () => string }).getBearerToken()).toBe('session-token');
    expect(ctx.responseHeaders).toMatchObject({ 'cache-control': 'private, no-store' });
    expect(ctx.responseHeaders['x-new-token']).toBeUndefined();
  });

  it('rejects a POST rewritten to GET by method override middleware', async () => {
    const { service } = createService();
    const code = await issueCode(service);
    const ctx = createContext({ method: 'POST', querystring: `file=a.txt&accessCode=${code}` });

    await captureTemporaryAccessRequestMethod(ctx as never, async () => {
      ctx.method = 'GET';
      ctx.req.method = 'GET';
      await expect(resolveTemporaryAccessCode(service)(ctx as never, vi.fn())).rejects.toMatchObject({
        code: INVALID_TEMPORARY_ACCESS_CODE,
        status: 401,
      });
    });
  });

  it.each([
    [
      'a body',
      (code: string) => createContext({ body: { unexpected: true }, querystring: `file=a.txt&accessCode=${code}` }),
    ],
    [
      'duplicate codes',
      (code: string) => createContext({ querystring: `file=a.txt&accessCode=${code}&accessCode=${code}` }),
    ],
  ])('rejects a GET request with %s', async (_case, createInvalidContext) => {
    const { service } = createService();
    const code = await issueCode(service);
    const ctx = createInvalidContext(code);

    await expect(resolveTemporaryAccessCode(service)(ctx as never, vi.fn())).rejects.toMatchObject({
      code: INVALID_TEMPORARY_ACCESS_CODE,
      status: 401,
    });
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
    action: { params: { values: { target: 'files:download?file=a.txt' } } },
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
      target: 'files:download?file=a.txt',
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

  it('maps invalid targets to a stable error', async () => {
    const service = {
      create: vi.fn().mockRejectedValue(new InvalidTemporaryAccessTargetError()),
    } as unknown as TemporaryAccessCodeService;

    await expect(createAccessCodeAction(service)(createActionContext() as never, vi.fn())).rejects.toMatchObject({
      code: 'INVALID_TEMPORARY_ACCESS_TARGET',
      status: 400,
    });
  });
});
