/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { IdpOauthService } from '../service';

describe('plugin-idp-oauth > IdpOauthService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should build frontend interaction paths for main app and sub app in multi-app mode', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    expect(service.getFrontendInteractionPath('main', 'uid-1')).toBe('/idp-oauth/interaction/uid-1');
    expect(service.getFrontendInteractionPath('demo', 'uid-2')).toBe('/apps/demo/idp-oauth/interaction/uid-2');
  });

  test('should build frontend paths without apps prefix in single mode', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'single',
    } as any);

    expect(service.getFrontendErrorPath('main')).toBe('/idp-oauth/error');
    expect(service.getFrontendErrorPath('demo')).toBe('/idp-oauth/error');
    expect(service.getFrontendInteractionPath('demo', 'uid-2')).toBe('/idp-oauth/interaction/uid-2');
  });

  test('should use root api issuer path for custom-domain sub app requests', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    const providerContext = service.getProviderContext({
      app: { name: 'subapp' },
      path: '/api/mcp',
      protocol: 'https',
      host: 'subapp.example.com',
      headers: {},
    });

    expect(providerContext.issuerPath).toBe('/api');
    expect(providerContext.issuer).toBe('https://subapp.example.com/api');
    expect(service.getFrontendInteractionPath('subapp', 'uid-3', providerContext.issuerPath)).toBe(
      '/idp-oauth/interaction/uid-3',
    );
  });

  test('should preserve sub app issuer path when original url uses __app prefix', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    const providerContext = service.getProviderContext({
      app: { name: 'subapp' },
      path: '/api/mcp',
      req: {
        originalUrl: '/api/__app/subapp/mcp',
        url: '/api/mcp',
      },
      protocol: 'https',
      host: 'example.com',
      headers: {},
    });

    expect(providerContext.issuerPath).toBe('/api/__app/subapp');
    expect(providerContext.issuer).toBe('https://example.com/api/__app/subapp');
  });

  test('getSupportedScopes should include resource server scopes without duplicates', () => {
    const service = new IdpOauthService({} as any, {} as any);

    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp',
    });
    service.registerResourceServer('custom', {
      identifier: 'urn:test:custom',
      scope: 'mcp custom',
    });

    expect(service.getSupportedScopes()).toEqual(['openid', 'offline_access', 'profile', 'email', 'mcp', 'custom']);
  });

  test('getSupportedScopes should drop unregistered resource server scopes', () => {
    const service = new IdpOauthService({} as any, {} as any);

    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp',
    });
    service.unregisterResourceServer('mcp');

    expect(service.getSupportedScopes()).toEqual(['openid', 'offline_access', 'profile', 'email']);
  });

  test('should prefer the most specific resource config for nested paths', () => {
    const service = new IdpOauthService({} as any, {} as any);

    service.registerResourceServer('api', {
      path: '/',
      scope: 'api',
    });
    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp offline_access',
    });

    expect((service as any).getRequestResourceConfig({ path: '/api/mcp' })).toMatchObject({
      path: '/mcp',
      scope: 'mcp offline_access',
    });
  });

  test('should rewrite downstream auth token after authenticating a protected resource request', async () => {
    const service = new IdpOauthService(
      {
        name: 'main',
        authManager: {
          tokenController: {
            add: vi.fn().mockResolvedValue({
              jti: 'internal-jti',
              signInTime: Date.now(),
            }),
            getConfig: vi.fn().mockResolvedValue({
              tokenExpirationTime: 60 * 60 * 1000,
            }),
          },
          jwt: {
            sign: vi.fn().mockReturnValue('internal-token'),
          },
        },
        db: {
          getRepository: vi.fn().mockReturnValue({
            findOne: vi.fn().mockResolvedValue({ id: 1 }),
          }),
        },
      } as any,
      {
        get: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
      } as any,
    );

    service.registerResourceServer('api', {
      path: '/',
      scope: 'api',
    });
    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp offline_access',
      accessTokenFormat: 'jwt',
      jwt: {
        sign: { alg: 'RS256' },
      },
    });

    const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
    const signingJwk = await exportJWK(publicKey);
    const keySet = createLocalJWKSet({
      keys: [
        {
          ...signingJwk,
          kid: 'test-kid',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    });

    vi.spyOn(service as any, 'ensureProvider').mockResolvedValue({
      issuer: 'http://127.0.0.1:13000/api',
    });
    vi.spyOn(service as any, 'getProviderJwks').mockResolvedValue(keySet);

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer('http://127.0.0.1:13000/api')
      .setAudience('http://127.0.0.1:13000/api/mcp')
      .setSubject('1')
      .setJti('oauth-jti')
      .setExpirationTime('10m')
      .sign(privateKey);

    const ctx = {
      app: { name: 'main' },
      path: '/api/mcp',
      protocol: 'http',
      host: '127.0.0.1:13000',
      headers: {
        authorization: `Bearer ${token}`,
      },
      request: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
      req: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
      state: {},
      getBearerToken: () => token,
      logger: {
        debug: vi.fn(),
      },
      auth: {},
      throw: vi.fn((status, message) => {
        throw new Error(`${status}:${message}`);
      }),
    } as any;

    const user = await service.authenticateResourceRequest(ctx);

    expect(user).toEqual({ id: 1 });
    expect(ctx.getBearerToken()).toBe('internal-token');
    expect(ctx.req.headers.authorization).toBe('Bearer internal-token');
    expect(ctx.request.headers.authorization).toBe('Bearer internal-token');
    expect(ctx.req.headers['x-authenticator']).toBe('basic');
    expect(ctx.request.headers['x-authenticator']).toBe('basic');
    expect(ctx.state.currentUser).toEqual({ id: 1 });
    expect(ctx.auth.user).toEqual({ id: 1 });
  });
});
