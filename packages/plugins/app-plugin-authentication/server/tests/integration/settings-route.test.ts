// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

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
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  type ApiDocument,
} from '@nocobase/app-server/router';
import { createDefaultCachingConfig } from '@nocobase/caching';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/app-testing/server';
import { genericOAuth } from 'better-auth/plugins';
import type { MiddlewareHandler } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import authentication from '../../plugin.js';
import type { AuthenticationSettings } from '../../../shared/settings.js';
import {
  authenticationSettingsAccessToken,
  signInMethodsToken,
} from '../../tokens.js';
import { signIn, type TestSession } from '../../testing.js';

const ORIGIN = 'http://localhost';
// Every secret the configuration holds is one of these; none may appear in a response.
const SENTINELS = {
  secret: 'SENTINEL-auth-secret-at-least-32-characters-long',
  smtpPassword: 'SENTINEL-smtp-password',
  resendKey: 'SENTINEL-resend-api-key',
  githubSecret: 'SENTINEL-github-client-secret',
  githubId: 'SENTINEL-github-client-id',
  oidcSecret: 'SENTINEL-oidc-client-secret',
  oidcId: 'SENTINEL-oidc-client-id',
};
const ADA = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'ada-password-123',
};
const BOB = {
  name: 'Bob',
  email: 'bob@example.com',
  password: 'bob-password-123',
};

describe('GET /api/authentication/settings and /api/authentication/providers', () => {
  let directory: string;
  let databases: ProvisionedTestDatabases;
  let app: Application;
  let ada: TestSession;
  let bob: TestSession;
  // Stands in for the authorization plugin's check; each test decides.
  let allow = true;

  const request = (pathname: string, init: RequestInit = {}) =>
    app.fetch(new Request(new URL(pathname, ORIGIN), init));
  const json = (session: TestSession, body: unknown): RequestInit => ({
    method: 'POST',
    headers: {
      cookie: session.cookie,
      origin: ORIGIN,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  beforeAll(async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'authentication-settings-'));
    databases = await provisionTestDatabases();
    const values: Record<string, unknown> = {
      app: {
        name: 'main',
        publicOrigin: undefined,
        publicBasePath: '/',
        internalBasePath: '',
        publicApiUrl: '/api',
      },
      auth: {
        secret: SENTINELS.secret,
        emailAndPassword: { enabled: true, autoSignIn: true },
        session: { storeSessionInDatabase: true },
        email: {
          provider: 'smtp',
          host: 'smtp.example.com',
          port: 587,
          auth: { user: 'mailer', pass: SENTINELS.smtpPassword },
          from: 'App <app@example.com>',
        },
        socialProviders: {
          github: {
            clientId: SENTINELS.githubId,
            clientSecret: SENTINELS.githubSecret,
          },
        },
        plugins: [
          genericOAuth({
            config: [
              {
                providerId: 'acme-sso',
                discoveryUrl:
                  'https://sso.example.com/.well-known/openid-configuration',
                clientId: SENTINELS.oidcId,
                clientSecret: SENTINELS.oidcSecret,
              },
            ],
          }),
        ],
      },
      mailers: {
        resend: {
          provider: 'resend',
          apiKey: SENTINELS.resendKey,
          from: 'App <app@example.com>',
        },
      },
      caching: createDefaultCachingConfig(),
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
      resolveAppServerPlugins(directory, defineServerPlugins([authentication])),
    );
    const access: MiddlewareHandler = async (context, next) => {
      if (!allow)
        return context.json({ error: { status: 'PERMISSION_DENIED' } }, 403);
      await next();
    };
    app.container.singleton(authenticationSettingsAccessToken, () => access);
    await app.start();
    for (const user of [ADA, BOB]) {
      const response = await request('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify(user),
      });
      if (response.status !== 200)
        throw new Error(`Sign-up failed: ${await response.text()}`);
    }
    const target = {
      fetch: (input: Request) => app.fetch(input),
      publicBasePath: '',
    };
    ada = await signIn(target, { email: ADA.email, password: ADA.password });
    bob = await signIn(target, { email: BOB.email, password: BOB.password });
  }, 60_000);

  afterAll(async () => {
    await app?.shutdown();
    await databases?.drop();
    rmSync(directory, { recursive: true, force: true });
  });

  it('answers 401 without a session and 403 when the permission check refuses', async () => {
    expect((await request('/api/authentication/settings')).status).toBe(401);
    allow = false;
    try {
      const denied = await request('/api/authentication/settings', {
        headers: { cookie: ada.cookie },
      });
      expect(denied.status).toBe(403);
    } finally {
      allow = true;
    }
  });

  it('returns the effective settings and the problems to fix, without any secret', async () => {
    const response = await request('/api/authentication/settings', {
      headers: { cookie: ada.cookie },
    });
    expect(response.status).toBe(200);
    const text = await response.text();
    for (const sentinel of Object.values(SENTINELS))
      expect(text).not.toContain(sentinel);
    expect(text).not.toContain('smtp.example.com');
    const { data } = JSON.parse(text) as { data: AuthenticationSettings };
    expect(data.issues.map((issue) => issue.code)).toEqual([
      'passwordResetUnavailable',
      'publicOriginMissing',
    ]);
    expect(data.app).toMatchObject({
      publicOrigin: { value: null },
      authBasePath: '/api/auth',
      authBaseUrl: null,
    });
    expect(data.passwordReset).toMatchObject({
      available: false,
      enabled: { value: null },
      sender: { kind: 'inline', provider: 'smtp', configured: true },
      publicOrigin: false,
    });
    expect(data.session).toMatchObject({
      expiresIn: { value: 7 * 24 * 60 * 60 },
      updateAge: { value: 24 * 60 * 60 },
      storage: { value: 'database' },
    });
    expect(data.password.minLength.value).toBe(8);
    expect(data.security.signingKeys).toMatchObject({ kind: 'authSecret' });
    const methods = Object.fromEntries(
      data.methods.map((method) => [method.id, method]),
    );
    expect(methods.password?.status).toBe('enabled');
    expect(methods.sso).toMatchObject({
      status: 'enabled',
      providers: ['acme-sso'],
    });
    expect(methods.social).toMatchObject({
      status: 'enabled',
      providers: ['github'],
    });
    expect(methods.twoFactor?.status).toBe('notConfigured');
    // Only the API keys plugin adds its row; this application does not register it.
    expect(methods['api-key']).toBeUndefined();
    // Which providers get a button is the application's sign-in page's business, not the server's.
    expect(data.signInPage).toEqual({
      password: true,
      signUp: true,
      forgotPassword: false,
    });
  });

  it('lists a sign-in method another plugin adds, until it is removed', async () => {
    const remove = app.container.resolve(signInMethodsToken).add({
      id: 'test-method',
      title: { key: 'test.title', ns: 'test', defaultValue: 'Test method' },
      describe: () => ({ status: 'enabled', configPath: 'auth.plugins' }),
    });
    const read = async () =>
      (
        (await (
          await request('/api/authentication/settings', {
            headers: { cookie: ada.cookie },
          })
        ).json()) as { data: AuthenticationSettings }
      ).data.methods.find((method) => method.id === 'test-method');
    expect(await read()).toMatchObject({
      status: 'enabled',
      origin: { path: 'auth.plugins' },
    });
    remove();
    expect(await read()).toBeUndefined();
  });

  it('lists the providers a signed-in person can link, by id and name only', async () => {
    expect((await request('/api/authentication/providers')).status).toBe(401);
    const response = await request('/api/authentication/providers', {
      headers: { cookie: bob.cookie },
    });
    expect(response.status).toBe(200);
    const text = await response.text();
    for (const sentinel of Object.values(SENTINELS))
      expect(text).not.toContain(sentinel);
    expect(JSON.parse(text)).toEqual({
      data: [
        { id: 'acme-sso', name: 'acme-sso' },
        { id: 'github', name: 'GitHub' },
      ],
      meta: { total: 2 },
    });
  });

  it('lets a person list and revoke only their own sessions', async () => {
    const list = async (session: TestSession) =>
      (await (
        await request('/api/auth/list-sessions', {
          headers: { cookie: session.cookie },
        })
      ).json()) as { token: string; userId: string }[];
    const adaSessions = await list(ada);
    const bobSessions = await list(bob);
    expect(new Set(adaSessions.map((item) => item.userId)).size).toBe(1);
    expect(
      bobSessions.some((item) =>
        adaSessions.some((other) => other.token === item.token),
      ),
    ).toBe(false);
    // Bob names Ada's session: Better Auth leaves it alone.
    await request(
      '/api/auth/revoke-session',
      json(bob, { token: adaSessions[0]!.token }),
    );
    expect(
      (
        await request('/api/authentication/providers', {
          headers: { cookie: ada.cookie },
        })
      ).status,
    ).toBe(200);
  });

  it('declares both routes in the API document', async () => {
    expect(
      findUndeclaredApiRoutes(app).filter((route) =>
        route.path.startsWith('/api/authentication'),
      ),
    ).toEqual([]);
    const document = (await (
      await request('/api/swagger', { headers: { cookie: ada.cookie } })
    ).json()) as ApiDocument;
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      document.paths?.['/api/authentication/settings']?.get?.operationId,
    ).toBe('authenticationGetSettings');
    expect(
      document.paths?.['/api/authentication/providers']?.get?.operationId,
    ).toBe('authenticationListProviders');
  });
});
