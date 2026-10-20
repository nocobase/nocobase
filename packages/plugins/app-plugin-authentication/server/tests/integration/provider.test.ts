import { describe, expect, it, vi } from 'vitest';

import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { type Caching } from '@nocobase/caching';
import { cachingToken } from '@nocobase/app-server/caching';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { realtimePrincipalResolverToken } from '@nocobase/app-server/realtime';
import { Hono } from 'hono';
import { APIError } from 'better-auth';

const authHandler = vi.hoisted(() =>
  vi.fn((request: Request) => Promise.resolve(new Response(request.url))),
);
const getSession = vi.hoisted(() => vi.fn());
const createAuthentication = vi.hoisted(() =>
  vi.fn(() => ({ handler: authHandler, getSession })),
);

vi.mock('../../auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth.js')>();
  return { ...actual, createAuthentication };
});

import {
  AuthenticationProvider,
  createCookiePrefix,
  resolvePublicPath,
  toPublicRequest,
} from '../../providers/authentication.js';
import { authenticationToken } from '../../tokens.js';

describe('authentication provider', () => {
  it('registers authentication with the application runtime and dependencies', async () => {
    const connection = { kind: 'connection' };
    const database = {
      connection: vi.fn(() => connection),
    } as unknown as DatabaseManager;
    const caching = {
      getCache: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        take: vi.fn(),
      })),
      getCounter: vi.fn(() => ({ increment: vi.fn() })),
    } as unknown as Caching;
    const idGenerator = {
      generate: vi.fn(() => 1),
      generateString: vi.fn(() => 'generated-id'),
    };
    const container = new ServiceContainer();
    const config = await createConfig();
    container.instance(databaseManagerToken, database);
    container.instance(cachingToken, caching);
    container.instance(idGeneratorToken, idGenerator);
    const provider = new AuthenticationProvider({
      appName: 'main app',
      publicBasePath: '/main',
      config,
      container,
      paths: createAppPaths({ rootDir: '/test/app' }),
      router: new Hono(),
    });

    provider.register();
    const auth = container.resolve(authenticationToken);
    await auth.handler(
      new Request('http://localhost/api/auth/request-password-reset'),
      { clientAddress: '203.0.113.10' },
    );
    expect(authHandler).toHaveBeenLastCalledWith(expect.any(Request), {
      clientAddress: '203.0.113.10',
    });
    getSession.mockResolvedValueOnce({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    });

    expect(container.has(realtimePrincipalResolverToken)).toBe(true);
    await expect(
      container
        .resolve(realtimePrincipalResolverToken)
        .resolve(new Request('http://localhost/ws')),
    ).resolves.toEqual({ userId: 'user-1', sessionId: 'session-1' });
    getSession.mockRejectedValueOnce(new APIError('FORBIDDEN'));
    await expect(
      container
        .resolve(realtimePrincipalResolverToken)
        .resolve(new Request('http://localhost/ws')),
    ).resolves.toBeUndefined();
    expect(provider.name).toBe('@nocobase/app-plugin-authentication');
    expect(createAuthentication).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        connection,
        appName: 'main app',
        baseURL: 'https://example.com',
        basePath: '/main/api/auth',
        advanced: expect.objectContaining({
          cookiePrefix: 'main-app',
          defaultCookieAttributes: { path: '/main' },
          useSecureCookies: true,
        }),
      }),
    );

    const generateId =
      createAuthentication.mock.calls[0]?.[0].advanced?.database?.generateId;
    expect(generateId?.({ model: 'user', size: 12 })).toBe('generated-id');

    const response = await auth.handler(
      new Request('http://localhost/api/auth/get-session'),
    );
    await expect(response.text()).resolves.toBe(
      'http://localhost/main/api/auth/get-session',
    );
  });

  it('normalizes public paths, requests, and cookie prefixes', async () => {
    expect(resolvePublicPath('/api/auth', '/main')).toBe('/main/api/auth');
    expect(resolvePublicPath('/api/auth', '')).toBe('/api/auth');
    expect(resolvePublicPath('/', '/main')).toBe('/main/');
    expect(createCookiePrefix(' Main App ')).toBe('main-app');
    expect(createCookiePrefix('---')).toBe('nocobase3');

    const request = new Request(
      'http://localhost/api/auth/sign-in/username?from=login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-test': 'value' },
        body: JSON.stringify({ username: 'admin' }),
        duplex: 'half',
      },
    );
    const publicRequest = toPublicRequest(request, '/main');

    expect(publicRequest.url).toBe(
      'http://localhost/main/api/auth/sign-in/username?from=login',
    );
    expect(publicRequest.headers.get('x-test')).toBe('value');
    await expect(publicRequest.json()).resolves.toEqual({ username: 'admin' });
  });

  it('separates cookies of apps that share a host but not a port', () => {
    // A portless public origin is authoritative: production keeps the bare
    // name so deployments that already hold sessions keep them.
    expect(
      createCookiePrefix('main', {
        publicOrigin: 'https://example.com',
        listenPort: 13000,
      }),
    ).toBe('main');
    // An explicit public port wins over the listen port a proxy hides.
    expect(
      createCookiePrefix('main', {
        publicOrigin: 'https://example.com:8443',
        listenPort: 13000,
      }),
    ).toBe('main-8443');
    // Development: no public origin, so the listen port is what separates
    // two copies of the same app.
    expect(createCookiePrefix('main', { listenPort: 13000 })).toBe(
      'main-13000',
    );
    expect(createCookiePrefix('main', { listenPort: 13001 })).toBe(
      'main-13001',
    );
    // An embedded app owns neither, and is separated by its cookie path.
    expect(createCookiePrefix('main', {})).toBe('main');
    // A malformed origin falls back rather than throwing.
    expect(
      createCookiePrefix('main', {
        publicOrigin: 'not a url',
        listenPort: 13000,
      }),
    ).toBe('main-13000');
  });

  it.each([
    { mode: 'standalone' as const, cookiePrefix: 'main-app-13001' },
    { mode: 'embedded' as const, cookiePrefix: 'main-app' },
  ])(
    'uses the app-owned port for $mode cookie names',
    async ({ mode, cookiePrefix }) => {
      const container = createDependencies();
      createAuthentication.mockClear();

      new AuthenticationProvider({
        appName: 'main app',
        mode,
        publicBasePath: '/main',
        config: await createConfig({
          server: { host: '127.0.0.1', port: 13001, startLog: true },
        }),
        container,
        paths: createAppPaths({ rootDir: '/test/app' }),
        router: new Hono(),
      }).register();
      container.resolve(authenticationToken);

      expect(createAuthentication).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          advanced: expect.objectContaining({ cookiePrefix }),
        }),
      );
    },
  );
});

function createDependencies(): ServiceContainer {
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, {
    connection: vi.fn(() => ({ kind: 'connection' })),
  } as unknown as DatabaseManager);
  container.instance(cachingToken, {
    getCache: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      take: vi.fn(),
    })),
    getCounter: vi.fn(() => ({ increment: vi.fn() })),
  } as unknown as Caching);
  container.instance(idGeneratorToken, {
    generate: vi.fn(() => 1),
    generateString: vi.fn(() => 'generated-id'),
  });
  return container;
}

interface ConfigOverrides {
  readonly publicOrigin?: string;
  readonly server?: { host: string; port: number; startLog: boolean };
}

async function createConfig(
  overrides: ConfigOverrides = { publicOrigin: 'https://example.com' },
): Promise<AppConfig> {
  const config = new AppConfig();
  config.load({
    name: 'app',
    read: async () => ({
      kind: 'map',
      value: {
        app: {
          name: 'main app',
          publicOrigin: overrides.publicOrigin,
          publicBasePath: '/main',
          internalBasePath: '',
          publicApiUrl: '/main/api',
        },
        ...(overrides.server ? { server: overrides.server } : {}),
      },
    }),
  });
  config.load({
    name: 'test-auth-options',
    read: async () => ({
      kind: 'map',
      value: {
        auth: {
          emailAndPassword: { enabled: true, autoSignIn: false },
          session: { storeSessionInDatabase: true },
          secret: 'test-auth-secret-at-least-32-characters',
          advanced: { useSecureCookies: true },
        },
      },
    }),
  });
  await config.loadAll();
  return config;
}
