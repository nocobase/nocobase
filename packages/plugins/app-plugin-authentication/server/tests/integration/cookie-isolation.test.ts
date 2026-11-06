// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { CookieJar } from 'jsdom';
import { Hono } from 'hono';
import { createCaching } from '@nocobase/caching';
import { databaseManagerToken } from '@nocobase/db';
import { cachingToken } from '@nocobase/app-server/caching';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { createPublicBasePathAdapter } from '@nocobase/app-server/runtime';
import {
  normalizeBasePath,
  resolveAppNameFromBasePath,
} from '@nocobase/app-server/support';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AuthenticationProvider } from '../../providers/authentication.js';
import { authenticationToken } from '../../tokens.js';
import { createSessionSecurityFragment } from '../../api-docs.js';
import type { AuthConfig } from '../../config.js';
import { createAuthTestDatabase, testSecret } from './support.js';

const ORIGIN = 'http://localhost';
let database: Awaited<ReturnType<typeof createAuthTestDatabase>>;
const cleanup: (() => Promise<void>)[] = [];
beforeAll(async () => {
  database = await createAuthTestDatabase();
});
afterAll(async () => {
  await database.destroy();
});
afterEach(async () => {
  for (const close of cleanup.splice(0)) await close();
});

async function application(
  publicBasePath: string,
  advanced?: AuthConfig['advanced'],
) {
  const base = normalizeBasePath(publicBasePath);
  const config = new AppConfig();
  config.load({
    name: 'test',
    read: async () => ({
      kind: 'map',
      value: {
        app: {
          name: resolveAppNameFromBasePath(base, 'main'),
          publicBasePath: base,
          publicOrigin: ORIGIN,
        },
        auth: {
          secret: testSecret,
          emailAndPassword: { enabled: true, autoSignIn: false },
          session: {
            storeSessionInDatabase: true,
            cookieCache: { enabled: true },
          },
          advanced,
        },
      },
    }),
  });
  await config.loadAll();
  const container = new ServiceContainer();
  const caching = createCaching();
  container.instance(databaseManagerToken, database.database);
  container.instance(cachingToken, caching);
  container.instance(idGeneratorToken, {
    generateString: randomUUID,
    generate: () => 1,
  });
  const router = new Hono();
  const provider = new AuthenticationProvider({
    appName: resolveAppNameFromBasePath(base, 'main'),
    publicBasePath: base,
    mode: 'embedded',
    config,
    container,
    router,
    paths: createAppPaths({ rootDir: import.meta.dirname }),
  });
  provider.register();
  const auth = container.resolve(authenticationToken);
  cleanup.push(async () => {
    await provider.shutdown();
    await caching.dispose();
  });
  router.on(['GET', 'POST'], '/api/auth/*', (context) =>
    auth.handler(context.req.raw),
  );
  const mounted = createPublicBasePathAdapter(router, base);
  return { auth, base, fetch: mounted.fetch.bind(mounted) };
}

type TestApplication = Awaited<ReturnType<typeof application>>;
async function request(
  jar: CookieJar,
  app: TestApplication,
  endpoint: string,
  data?: unknown,
) {
  const url = `${ORIGIN}${app.base}/api/auth/${endpoint}`;
  const headers = new Headers({ cookie: await jar.getCookieString(url) });
  if (data !== undefined) {
    headers.set('origin', ORIGIN);
    headers.set('content-type', 'application/json');
  }
  const response = await app.fetch(
    new Request(url, {
      method: data === undefined ? 'GET' : 'POST',
      headers,
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  );
  for (const cookie of response.headers.getSetCookie())
    await jar.setCookie(cookie, url);
  return response;
}

async function login(jar: CookieJar, app: TestApplication) {
  const user = {
    email: `cookie-${randomUUID()}@example.test`,
    name: 'Cookie test',
    password: randomUUID(),
  };
  expect((await request(jar, app, 'sign-up/email', user)).status).toBe(200);
  const response = await request(jar, app, 'sign-in/email', {
    ...user,
    rememberMe: false,
  });
  expect(response.status).toBe(200);
  return response;
}
async function user(jar: CookieJar, app: TestApplication) {
  const response = await request(jar, app, 'get-session');
  expect(response.status).toBe(200);
  return (await response.json())?.user?.id;
}

describe('default authentication cookie isolation', () => {
  it.each([
    ['/studio', '/crm'],
    ['', '/main'],
    ['/crm', '/crm/child'],
    ['/west/crm', '/east/crm'],
    ['/a-b', '/a_b'],
    ['/crm', '/CRM'],
    ['/a(b)', '/a%28b%29'],
  ])(
    'keeps login, refresh, and logout separate for %s and %s',
    async (firstPath, secondPath) => {
      // Authentication shares a signing key and database too, so a colliding cookie would resolve a real login.
      const first = await application(firstPath);
      const second = await application(secondPath);
      const jar = new CookieJar();
      const signedIn = await login(jar, first);
      const firstUser = await user(jar, first);
      expect(firstUser).toBeTypeOf('string');
      expect(await user(jar, second)).toBeUndefined();
      const firstCookies = await jar.getCookies(
        `${ORIGIN}${first.base}/api/auth/get-session`,
      );
      expect(firstCookies.length).toBeGreaterThan(1);
      const prefix = (await first.auth.sessionCookieName()).split(
        '.session_token',
      )[0]!;
      const context = await first.auth.administrationContext();
      for (const cookie of Object.values(context.authCookies)) {
        expect(cookie.name.startsWith(`${prefix}.`)).toBe(true);
        expect(cookie.attributes.path).toBe(first.base || '/');
      }
      expect(context.createAuthCookie('oauth_state')).toMatchObject({
        name: `${prefix}.oauth_state`,
        attributes: { path: first.base || '/' },
      });
      for (const cookie of firstCookies) {
        expect(cookie.key.startsWith(`${prefix}.`)).toBe(true);
        expect(cookie.path).toBe(first.base || '/');
      }
      expect(
        signedIn.headers
          .getSetCookie()
          .some((value) => value.includes('.session_data=')),
      ).toBe(true);
      // New sessions must ignore a parent session cache as well as its token.
      await login(jar, second);
      const secondUser = await user(jar, second);
      expect(secondUser).not.toBe(firstUser);
      expect(await user(jar, first)).toBe(firstUser);
      const logout = await request(jar, second, 'sign-out', {});
      expect(logout.status).toBe(200);
      expect(await user(jar, second)).toBeUndefined();
      expect(await user(jar, first)).toBe(firstUser);
      for (const cookie of logout.headers.getSetCookie())
        expect(cookie).toContain(`Path=${second.base || '/'}`);
      const fragment = await createSessionSecurityFragment(first.auth);
      expect(fragment.components?.securitySchemes?.cookieAuth).toMatchObject({
        name: await first.auth.sessionCookieName(),
      });
    },
  );

  it.each(['', '/main'])(
    'keeps legacy root cookies unchanged while %s uses and clears only new names',
    async (base) => {
      const legacy = await application('', { cookiePrefix: 'main' });
      const current = await application(base);
      const jar = new CookieJar();
      await login(jar, legacy);
      const oldUser = await user(jar, legacy);
      expect(await user(jar, current)).toBeUndefined();
      await login(jar, current);
      expect(await user(jar, current)).not.toBe(oldUser);
      expect(await user(jar, legacy)).toBe(oldUser);
      const oldCookies = (await jar.getCookies(ORIGIN))
        .filter((cookie) => cookie.key.startsWith('main.'))
        .map((cookie) => cookie.cookieString());
      const response = await request(jar, current, 'sign-out', {});
      expect(response.status).toBe(200);
      expect(
        response.headers
          .getSetCookie()
          .every((cookie) => !cookie.startsWith('main.')),
      ).toBe(true);
      expect(
        (await jar.getCookies(ORIGIN))
          .filter((cookie) => cookie.key.startsWith('main.'))
          .map((cookie) => cookie.cookieString()),
      ).toEqual(oldCookies);
      expect(await user(jar, legacy)).toBe(oldUser);
    },
  );

  it('preserves custom prefixes, individual cookie names and attribute overrides', async () => {
    const app = await application('/crm/', {
      cookiePrefix: 'configured',
      defaultCookieAttributes: { path: '/', sameSite: 'strict' },
      cookies: {
        session_token: {
          name: 'custom_login',
          attributes: { path: '/crm', sameSite: 'lax' },
        },
      },
    });
    const jar = new CookieJar();
    await login(jar, app);
    const cookies = await jar.getCookies(`${ORIGIN}/crm/api/auth/get-session`);
    expect(
      cookies.find((cookie) => cookie.key === 'custom_login'),
    ).toMatchObject({ path: '/crm', sameSite: 'lax' });
    expect(
      cookies.find((cookie) => cookie.key === 'configured.session_data'),
    ).toMatchObject({ path: '/', sameSite: 'strict' });
    expect(await user(jar, app)).toBeTypeOf('string');
    const fragment = await createSessionSecurityFragment(app.auth);
    expect(fragment.components?.securitySchemes?.cookieAuth).toMatchObject({
      name: 'custom_login',
    });
    await jar.setCookie('unrelated=value; Path=/', ORIGIN);
    const logout = await request(jar, app, 'sign-out', {});
    expect(logout.status).toBe(200);
    expect(
      logout.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith('custom_login=')),
    ).toContain('Path=/crm');
    expect(
      (await jar.getCookies(`${ORIGIN}/crm/api/auth/get-session`)).map(
        (cookie) => cookie.key,
      ),
    ).toEqual(['unrelated']);
  });
});
