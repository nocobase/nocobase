// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import authentication, {
  authenticationToken,
} from '@nocobase/app-plugin-authentication/server';
import { Application } from '@nocobase/app-server/application';
import { CachingProvider } from '@nocobase/app-server/caching';
import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import {
  defineServerPlugins,
  resolveAppServerPlugins,
} from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  type ApiDocument,
} from '@nocobase/app-server/router';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/app-testing/server';
import type { Context } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiKeySecurityFragment } from '../server/api-docs.js';
import apiKeys, { apiKey, createApiKeyApiDocsAccess } from '../server/index.js';

const ORIGIN = 'http://localhost';
const USER = {
  name: 'Key Owner',
  email: 'key-owner@example.com',
  password: 'key-owner-password',
};

describe('API documentation access with an API key', () => {
  let directory: string;
  let databases: ProvisionedTestDatabases;
  let app: Application;
  let cookie: string;

  const request = (
    pathname: string,
    init: { method?: string; headers?: HeadersInit; json?: unknown } = {},
  ): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set('origin', ORIGIN);
    if (init.json !== undefined)
      headers.set('content-type', 'application/json');
    return Promise.resolve(
      app.fetch(
        new Request(new URL(pathname, ORIGIN), {
          method: init.method ?? 'GET',
          headers,
          ...(init.json === undefined
            ? {}
            : { body: JSON.stringify(init.json) }),
        }),
      ),
    );
  };

  async function issueKey(name: string): Promise<{ id: string; key: string }> {
    const response = await request('/api/auth/api-key/create', {
      method: 'POST',
      headers: { cookie },
      json: { name },
    });
    expect(response.status).toBe(200);
    return (await response.json()) as { id: string; key: string };
  }

  beforeAll(async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'api-keys-api-docs-'));
    databases = await provisionTestDatabases();
    const values: Record<string, unknown> = {
      app: {
        name: 'main',
        publicOrigin: ORIGIN,
        publicBasePath: '/',
        internalBasePath: '',
        publicApiUrl: '/api',
      },
      auth: {
        secret: 'api-keys-api-docs-secret-at-least-32-characters',
        plugins: [apiKey()],
        emailAndPassword: { enabled: true, autoSignIn: false },
        session: { storeSessionInDatabase: true },
      },
      caching: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
      database: {
        default: 'main',
        connections: {
          main: {
            ...databases.connectionConfig(),
            schemaManagement: 'managed',
          },
        },
      },
      snowflake: { workerId: 0 },
    };
    const config: AppConfigAccessor = {
      get: <TValue>(key: string): TValue => values[key] as TValue,
      raw: () => values,
      reload: () => Promise.resolve({ changedNamespaces: [] }),
      subscribe: () => () => undefined,
    };
    app = new Application({
      config,
      paths: createAppPaths({ rootDir: directory }),
    });
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(CachingProvider);
    app.addServiceProvider(IdGeneratorProvider);
    app.addServerPlugins(
      resolveAppServerPlugins(
        directory,
        defineServerPlugins([authentication, apiKeys]),
      ),
    );
    await app.start();
    const signUp = await request('/api/auth/sign-up/email', {
      method: 'POST',
      json: USER,
    });
    if (signUp.status !== 200)
      throw new Error(`Sign-up failed: ${await signUp.text()}`);
    const signIn = await request('/api/auth/sign-in/email', {
      method: 'POST',
      json: { email: USER.email, password: USER.password },
    });
    if (signIn.status !== 200)
      throw new Error(`Sign-in failed: ${await signIn.text()}`);
    cookie = signIn.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
  }, 60_000);

  afterAll(async () => {
    await app?.shutdown();
    await databases?.drop();
    rmSync(directory, { recursive: true, force: true });
  });

  it('refuses an anonymous request', async () => {
    const response = await request('/api/swagger');
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { status: 'UNAUTHENTICATED', reason: 'API_DOCS_UNAUTHENTICATED' },
    });
  });

  it('serves the document to a signed-in session', async () => {
    expect(
      (await request('/api/swagger', { headers: { cookie } })).status,
    ).toBe(200);
  });

  it('serves the document and the Swagger UI page to a valid API key', async () => {
    const { key } = await issueKey('docs-reader');

    const document = await request('/api/swagger', {
      headers: { 'x-api-key': key },
    });
    expect(document.status).toBe(200);
    expect(document.headers.getSetCookie()).toEqual([]);
    const page = await request('/api/swagger/docs', {
      headers: { 'x-api-key': key },
    });
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
  });

  it('refuses an unknown or a disabled API key', async () => {
    const unknown = await request('/api/swagger', {
      headers: { 'x-api-key': 'x'.repeat(64) },
    });
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toMatchObject({
      error: { reason: 'API_DOCS_UNAUTHENTICATED' },
    });

    const { id, key } = await issueKey('disabled-reader');
    const disable = await request('/api/auth/api-key/update', {
      method: 'POST',
      headers: { cookie },
      json: { keyId: id, enabled: false },
    });
    expect(disable.status).toBe(200);
    const disabled = await request('/api/swagger', {
      headers: { 'x-api-key': key },
    });
    expect(disabled.status).toBe(401);
  });

  it('allows a key, not a session cookie, through its own check', async () => {
    const access = createApiKeyApiDocsAccess(() =>
      app.container.resolve(authenticationToken),
    );
    const check = (headers: HeadersInit) =>
      access.check({
        req: { raw: new Request(`${ORIGIN}/api/swagger`, { headers }) },
      } as unknown as Context);
    const { key } = await issueKey('own-check');

    await expect(check({ 'x-api-key': key })).resolves.toBe(true);
    await expect(check({ cookie })).resolves.toBe(false);
    await expect(check({ 'x-api-key': 'y'.repeat(64) })).resolves.toBe(false);
  });

  it('documents the API key endpoints Better Auth serves', async () => {
    const response = await request('/api/swagger', { headers: { cookie } });
    const document = (await response.json()) as ApiDocument;
    const paths = document.paths ?? {};
    expect(paths['/api/auth/api-key/create']?.post).toMatchObject({
      tags: ['Authentication'],
      operationId: 'createApiKey',
    });
    expect(paths['/api/auth/api-key/list']?.get?.operationId).toBe(
      'listApiKeys',
    );
    for (const pathname of [
      '/api/auth/api-key/get',
      '/api/auth/api-key/update',
      '/api/auth/api-key/delete',
    ])
      expect(Object.keys(paths)).toContain(pathname);
    expect(findUndeclaredApiRoutes(app.apiRouter!)).toEqual([]);
  });

  it('offers the session cookie and the API key as alternative credentials, and none for public routes', async () => {
    const { key } = await issueKey('security-reader');
    const response = await request('/api/swagger', {
      headers: { 'x-api-key': key },
    });
    const document = (await response.json()) as ApiDocument;

    expect(document.components?.securitySchemes).toEqual({
      cookieAuth: expect.objectContaining({
        type: 'apiKey',
        in: 'cookie',
        name: 'main.session_token',
      }),
      apiKeyAuth: expect.objectContaining({
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      }),
    });
    expect(document.security).toEqual([{ cookieAuth: [] }, { apiKeyAuth: [] }]);
    const paths = document.paths ?? {};
    expect(paths['/api/auth/sign-in/email']?.post?.security).toEqual([]);
    expect(paths['/api/auth/api-key/create']?.post).not.toHaveProperty(
      'security',
    );
  });
});

describe('createApiKeySecurityFragment()', () => {
  const authWith = (plugin: unknown) => () => ({
    plugin: <T>() => plugin as T,
  });

  it('names the first header a configuration reads keys from', () => {
    const fragment = createApiKeySecurityFragment(
      authWith(apiKey({ apiKeyHeaders: ['x-token', 'x-api-key'] })),
    );
    expect(fragment.components?.securitySchemes?.apiKeyAuth).toMatchObject({
      type: 'apiKey',
      in: 'header',
      name: 'x-token',
    });
    expect(
      (
        fragment.components?.securitySchemes?.apiKeyAuth as {
          description: string;
        }
      ).description,
    ).toContain('`x-api-key`');
    expect(fragment.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it('contributes nothing when keys do not authenticate requests', () => {
    for (const plugin of [
      undefined,
      apiKey({ enableSessionForAPIKeys: false }),
    ]) {
      expect(createApiKeySecurityFragment(authWith(plugin))).toEqual({
        owner: '@nocobase/app-plugin-api-keys',
      });
    }
  });
});
