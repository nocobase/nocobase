/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dispatchToProvider } from '../provider-dispatch';

function createContext(body: Record<string, any>) {
  return {
    method: 'POST',
    path: '/api/idpOAuth/register',
    headers: {
      'content-type': 'application/json',
    },
    request: {
      body,
    },
    get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : ''),
    set: vi.fn(),
    logger: {
      debug: vi.fn(),
      warn: vi.fn(),
    },
  } as any;
}

const service = {
  getProviderContext: () => ({
    appName: 'main',
    origin: 'http://127.0.0.1:13000',
    issuer: 'http://127.0.0.1:13000/api',
    issuerPath: '/api',
  }),
} as any;

describe('plugin-idp-oauth > provider dispatch', () => {
  const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
  const originalModernClientPrefix = process.env.APP_MODERN_CLIENT_PREFIX;

  beforeEach(() => {
    delete process.env.APP_PUBLIC_PATH;
    delete process.env.APP_MODERN_CLIENT_PREFIX;
  });

  afterEach(() => {
    if (originalAppPublicPath === undefined) {
      delete process.env.APP_PUBLIC_PATH;
    } else {
      process.env.APP_PUBLIC_PATH = originalAppPublicPath;
    }

    if (originalModernClientPrefix === undefined) {
      delete process.env.APP_MODERN_CLIENT_PREFIX;
    } else {
      process.env.APP_MODERN_CLIENT_PREFIX = originalModernClientPrefix;
    }
  });

  test('should reject dynamic registration redirect URIs that are not loopback callbacks', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(),
    } as any;
    const ctx = createContext({
      redirect_uris: ['https://example.com/callback'],
    });

    await dispatchToProvider(ctx, provider, '/idpOAuth/register', service);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toMatchObject({
      error: 'invalid_client_metadata',
    });
    expect(provider.callback).not.toHaveBeenCalled();
  });

  test('should allow dynamic registration loopback redirect URIs', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ client_id: 'client-1' }));
      }),
    } as any;
    const ctx = createContext({
      redirect_uris: ['http://127.0.0.1:53950/callback'],
    });

    await dispatchToProvider(ctx, provider, '/idpOAuth/register', service);

    expect(ctx.status).toBe(201);
    expect(ctx.body).toMatchObject({
      client_id: 'client-1',
    });
    expect(provider.callback).toHaveBeenCalledTimes(1);
  });

  test('should reject dynamic registration with reserved app client id prefix', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(),
    } as any;
    const ctx = createContext({
      client_id: 'app:alpha',
      redirect_uris: ['http://127.0.0.1:53950/callback'],
    });

    await dispatchToProvider(ctx, provider, '/idpOAuth/register', service);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toMatchObject({
      error: 'invalid_client_metadata',
      error_description: 'client_id prefix app: is reserved',
    });
    expect(provider.callback).not.toHaveBeenCalled();
  });

  test('should rewrite modern frontend interaction cookie paths back to app api routes', async () => {
    process.env.APP_PUBLIC_PATH = '/nocobase/';
    process.env.APP_MODERN_CLIENT_PREFIX = 'v2';

    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.setHeader('set-cookie', [
          'oidc.interaction=test; Path=/nocobase/v2/apps/demo/idp-oauth/interaction/uid-1; HttpOnly',
        ]);
        res.end(JSON.stringify({ ok: true }));
      }),
    } as any;

    const ctx = {
      method: 'GET',
      path: '/api/idpOAuth/authorize',
      headers: {},
      request: {},
      querystring: '',
      get: () => '',
      set: vi.fn(),
      logger: {
        debug: vi.fn(),
        warn: vi.fn(),
      },
    } as any;

    const service = {
      getProviderContext: () => ({
        appName: 'main',
        origin: 'http://127.0.0.1:13000',
        issuer: 'http://127.0.0.1:13000/api',
        issuerPath: '/api',
      }),
      getIssuerPath: (appName: string) => {
        if (appName === 'demo') {
          return '/api/__app/demo';
        }
        return '/api';
      },
    } as any;

    await dispatchToProvider(ctx, provider, '/idpOAuth/authorize', service);

    const setCookieCall = ctx.set.mock.calls.find(([name]: [string]) => name === 'set-cookie');
    expect(setCookieCall).toBeTruthy();
    expect(setCookieCall?.[1]).toEqual(
      expect.arrayContaining([expect.stringContaining('path=/api/__app/demo/idpOAuth/interaction/uid-1')]),
    );
  });
});
