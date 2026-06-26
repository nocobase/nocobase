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

function createDeviceAuthorizationContext() {
  return {
    method: 'POST',
    path: '/api/idpOAuth/device/auth',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    request: {
      body: 'client_id=client-device-1&scope=openid+api',
    },
    get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/x-www-form-urlencoded' : ''),
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
  getFrontendDevicePath: () => '/idpOAuth/device',
} as any;

describe('plugin-idp-oauth > provider dispatch', () => {
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

  test('should allow device-code dynamic registration without redirect URIs', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ client_id: 'client-device-1' }));
      }),
    } as any;
    const ctx = createContext({
      grant_types: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
      redirect_uris: [],
    });

    await dispatchToProvider(ctx, provider, '/idpOAuth/register', service);

    expect(ctx.status).toBe(201);
    expect(ctx.body).toMatchObject({
      client_id: 'client-device-1',
    });
    expect(provider.callback).toHaveBeenCalledTimes(1);
  });

  test('should rewrite device verification URLs to the frontend device path', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            device_code: 'device-code-1',
            user_code: 'XGNB-CXRZ',
            verification_uri: 'http://127.0.0.1:13000/idpOAuth/device',
            verification_uri_complete: 'http://127.0.0.1:13000/idpOAuth/device?user_code=XGNB-CXRZ',
          }),
        );
      }),
    } as any;
    const ctx = createDeviceAuthorizationContext();

    await dispatchToProvider(ctx, provider, '/idpOAuth/device/auth', service);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toMatchObject({
      verification_uri: 'http://127.0.0.1:13000/idpOAuth/device',
      verification_uri_complete: 'http://127.0.0.1:13000/idpOAuth/device?user_code=XGNB-CXRZ',
    });
  });

  test('should rewrite provider HTML form actions to the public issuer path', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end('<form method="post" action="http://localhost:56187/idpOAuth/device"><button>Continue</button></form>');
      }),
    } as any;
    const ctx = {
      method: 'GET',
      path: '/api/idpOAuth/device',
      querystring: 'user_code=XGNB-CXRZ',
      headers: {},
      request: {},
      get: vi.fn(() => ''),
      set: vi.fn(),
      logger: {
        debug: vi.fn(),
        warn: vi.fn(),
      },
    } as any;

    await dispatchToProvider(ctx, provider, '/idpOAuth/device', service);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toContain('action="http://127.0.0.1:13000/api/idpOAuth/device"');
  });

  test('should rewrite public-path interaction cookies to the backend interaction path', async () => {
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => (_req: any, res: any) => {
        res.statusCode = 303;
        res.setHeader('set-cookie', [
          '_interaction=uid-1; path=/nocobase/idp-oauth/interaction/uid-1; httponly',
          '_interaction_resume=uid-1; path=/idpOAuth/auth/uid-1; httponly',
        ]);
        res.end();
      }),
    } as any;
    const ctx = {
      method: 'GET',
      path: '/api/idpOAuth/authorize',
      headers: {},
      request: {},
      get: vi.fn(() => ''),
      set: vi.fn(),
      logger: {
        debug: vi.fn(),
        warn: vi.fn(),
      },
    } as any;

    await dispatchToProvider(ctx, provider, '/idpOAuth/authorize', service);

    expect(ctx.status).toBe(303);
    expect(ctx.set).toHaveBeenCalledWith('set-cookie', [
      '_interaction=uid-1; path=/api/idpOAuth/interaction/uid-1; httponly',
      '_interaction_resume=uid-1; path=/api/idpOAuth/auth/uid-1; httponly',
    ]);
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

  test('should handle provider responses without raw payload', async () => {
    vi.resetModules();
    const injectMock = vi.fn(async () => ({
      statusCode: 204,
      headers: {},
      rawPayload: undefined,
    }));
    vi.doMock('light-my-request', () => ({
      default: injectMock,
    }));
    const { dispatchToProvider: dispatchWithMockedRequest } = await import('../provider-dispatch');
    const provider = {
      issuer: 'http://127.0.0.1:13000/api',
      callback: vi.fn(() => vi.fn()),
    } as any;
    const ctx = {
      method: 'GET',
      path: '/api/idpOAuth/device',
      headers: {},
      request: {},
      get: vi.fn(() => ''),
      set: vi.fn(),
      logger: {
        debug: vi.fn(),
        warn: vi.fn(),
      },
    } as any;

    try {
      await dispatchWithMockedRequest(ctx, provider, '/idpOAuth/device', service);
    } finally {
      vi.doUnmock('light-my-request');
      vi.resetModules();
    }

    expect(ctx.status).toBe(204);
    expect(ctx.body).toBeUndefined();
  });
});
