import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';

import { createStandaloneServer } from '../helpers/minimal-app.js';

const HTTPS_ORIGIN = 'https://demo.example.com';
const apps: TestApp[] = [];

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

function request(
  app: TestApp,
  origin: string,
  path: string,
  init?: RequestInit,
) {
  return app.request(`${origin}${app.publicBasePath}/api${path}`, init);
}

function issuedCookies(response: Response) {
  return response.headers
    .getSetCookie()
    .filter((cookie) => !cookie.includes('Max-Age=0'));
}

it.each(['file', 'environment'])(
  'keeps HTTPS demo visitors signed in with automatic partitioned cookies when enabled through %s',
  async (source) => {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      server: {
        env: {
          NOCOBASE_DEMO_MODE: source === 'environment' ? 'true' : undefined,
        },
      },
      config: {
        app: { publicOrigin: HTTPS_ORIGIN },
        demoMode: { enabled: source === 'file' },
        auth: { advanced: { cookiePrefix: 'iframe-demo' } },
      },
    });
    apps.push(app);
    const response = await request(
      app,
      HTTPS_ORIGIN,
      '/demoMode/accounts/signInDefault',
      {
        method: 'POST',
        headers: { origin: HTTPS_ORIGIN },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { signedIn: true } });
    const cookies = issuedCookies(response);
    expect(
      cookies.some((cookie) =>
        cookie.startsWith('__Secure-iframe-demo.session_token='),
      ),
    ).toBe(true);
    for (const cookie of cookies) {
      expect(cookie).toContain('SameSite=None');
      expect(cookie).toContain('; Secure');
      expect(cookie).toContain('; Partitioned');
      expect(cookie).toContain(`Path=${app.publicBasePath}`);
      const name = cookie.slice(0, cookie.indexOf('='));
      expect(response.headers.getSetCookie()).toContainEqual(
        expect.stringContaining(`${name}=;`),
      );
    }
    const headers = {
      origin: HTTPS_ORIGIN,
      cookie: cookies.map((value) => value.split(';')[0]).join('; '),
    };
    expect(
      await (
        await request(app, HTTPS_ORIGIN, '/auth/get-session', { headers })
      ).json(),
    ).toMatchObject({ user: { id: expect.any(String) } });
    const returning = await request(
      app,
      HTTPS_ORIGIN,
      '/demoMode/accounts/signInDefault',
      { method: 'POST', headers },
    );
    expect(await returning.json()).toEqual({ data: { signedIn: false } });
    expect(returning.headers.getSetCookie()).toEqual([]);
  },
);

it.each([
  {
    name: 'HTTP development',
    origin: 'http://localhost',
    enabled: true,
    override: false,
    sameSite: 'Lax',
  },
  {
    name: 'an ordinary HTTPS application',
    origin: HTTPS_ORIGIN,
    enabled: false,
    override: false,
    sameSite: 'Lax',
  },
  {
    name: 'an explicit deployment policy',
    origin: HTTPS_ORIGIN,
    enabled: true,
    override: true,
    sameSite: 'Strict',
  },
])(
  'preserves the cookie policy for $name',
  async ({ origin, enabled, override, sameSite }) => {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      config: {
        app: { publicOrigin: origin },
        demoMode: { enabled },
        auth: override
          ? {
              advanced: {
                defaultCookieAttributes: {
                  sameSite: 'strict',
                  secure: true,
                  partitioned: false,
                },
              },
            }
          : {},
      },
    });
    apps.push(app);
    await app.application.container.resolve(userManagementServiceToken).create({
      username: 'cookie_visitor',
      name: 'Cookie visitor',
      email: 'cookie@example.com',
      password: 'CookieVisitor123!',
    });
    const response = await request(app, origin, '/auth/sign-in/email', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'cookie@example.com',
        password: 'CookieVisitor123!',
      }),
    });
    expect(response.status).toBe(200);
    const cookies = issuedCookies(response);
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie).toContain(`SameSite=${sameSite}`);
      expect(cookie).not.toContain('; Partitioned');
      if (origin.startsWith('http:')) expect(cookie).not.toContain('; Secure');
    }
  },
);
