import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CookieJar } from 'jsdom';
import { Hono } from 'hono';
import { I18nRuntime } from '@nocobase/i18n';
import {
  createI18nMiddleware,
  getContextSession,
  getRequestTranslator,
} from '@nocobase/i18n/server';
import { i18nToken } from '@nocobase/app-server/i18n';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { createPublicBasePathAdapter } from '@nocobase/app-server/runtime';
import {
  resolveAppSessionConfig,
  type AppSessionConfigInput,
} from '@nocobase/app-server/session';
import {
  createSessionManager,
  createSessionMiddleware,
  type NocoBaseSessionManager,
} from '@nocobase/session';
import { ServiceContainer } from '@nocobase/service-provider';
import { i18nApiRoutes } from '@nocobase/app-plugin-i18n/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import appRuntime from '../../server/runtime.js';

const ORIGIN = 'http://localhost';
const SECRET = 'shared-synthetic-session-secret-at-least-32-characters';
const rootDir = fileURLToPath(new URL('../..', import.meta.url));
let directory: string;
let configPath: string;
const managers: NocoBaseSessionManager[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'app-session-isolation-'));
  configPath = path.join(directory, 'config.json');
  await writeFile(
    configPath,
    JSON.stringify({
      session: {
        secret: SECRET,
        default: 'fs',
        stores: {
          fs: { driver: 'fs', base: path.join(directory, 'shared-sessions') },
        },
        gcLottery: { hits: 0, total: 100 },
      },
    }),
  );
});

afterEach(async () => {
  for (const manager of managers.splice(0)) await manager.dispose();
  await rm(directory, { recursive: true, force: true });
});

async function application(basePath: string) {
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir,
    configPath,
    basePath,
    env: { NODE_ENV: 'test' },
  });
  const session = resolveAppSessionConfig(
    runtime.config.get<AppSessionConfigInput>('session')!,
    SECRET,
  );
  const manager = createSessionManager(session);
  managers.push(manager);
  expect(runtime.config.get('app.publicBasePath')).toBe(
    basePath.replace(/\/$/u, ''),
  );
  const i18n = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@test/session',
  });
  i18n.registerApplicationNamespace('@test/session', {
    'en-US': async () => ({ greeting: 'Hello' }),
    'zh-CN': async () => ({ greeting: '你好' }),
  });
  await i18n.init();
  const container = new ServiceContainer();
  container.instance(i18nToken, i18n);
  const router = new Hono();
  router.use('*', createSessionMiddleware(manager), createI18nMiddleware(i18n));
  router.route(
    '/api',
    await i18nApiRoutes.createRouter({
      config: runtime.config,
      container,
      paths: runtime.paths,
      router,
      appName: runtime.appName,
      publicBasePath: basePath,
    }),
  );
  router.get('/message', (context) =>
    context.json({ message: getRequestTranslator(context)('greeting') }),
  );
  router.post('/clear', async (context) => {
    await getContextSession(context)!.destroy();
    return context.json({ cleared: true });
  });
  return { manager, session, ...createPublicBasePathAdapter(router, basePath) };
}

type TestApplication = Awaited<ReturnType<typeof application>>;

async function request(
  jar: CookieJar,
  app: TestApplication,
  base: string,
  endpoint: string,
  init: RequestInit = {},
) {
  const url = `${ORIGIN}${base}${endpoint}`;
  const headers = new Headers(init.headers);
  headers.set('cookie', await jar.getCookieString(url));
  const response = await app.fetch(new Request(url, { ...init, headers }));
  for (const cookie of response.headers.getSetCookie())
    await jar.setCookie(cookie, url);
  return response;
}

async function select(
  jar: CookieJar,
  app: TestApplication,
  base: string,
  locale: string,
) {
  const response = await request(jar, app, base, '/api/i18n/locale', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ locale }),
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: { locale } });
  return response;
}

async function message(jar: CookieJar, app: TestApplication, base: string) {
  const response = await request(jar, app, base, '/message');
  expect(response.status).toBe(200);
  return (await response.json()).message;
}

describe('application language session cookies', () => {
  it.each([
    ['/studio', '/crm'],
    ['', '/main'],
    ['/crm', '/crm/child'],
    ['/west/crm', '/east/crm'],
    ['/a-b', '/a_b'],
    ['/crm', '/CRM'],
    ['/a(b)', '/a%28b%29'],
  ])(
    'isolates %s and %s even with shared keys and session storage',
    async (firstBase, secondBase) => {
      const first = await application(firstBase);
      const second = await application(secondBase);
      const jar = new CookieJar();
      const response = await select(jar, first, firstBase, 'zh-CN');
      expect(response.headers.getSetCookie()[0]).toContain(
        `Path=${firstBase || '/'}`,
      );
      // Both managers can decrypt and load the same record: distinct names must provide the isolation.
      const cookieValue = (
        await jar.getCookies(`${ORIGIN}${firstBase}/message`)
      ).find((cookie) => cookie.key === first.session.cookie.name)!.value;
      expect(
        await second.manager.createRequestSession({ cookieValue }).get(),
      ).toMatchObject({ locale: 'zh-CN' });
      expect(await message(jar, second, secondBase)).toBe('Hello');
      await select(jar, second, secondBase, 'en-US');
      expect(await message(jar, first, firstBase)).toBe('你好');
      expect(await message(jar, second, secondBase)).toBe('Hello');
      await request(jar, second, secondBase, '/clear', { method: 'POST' });
      expect(await message(jar, first, firstBase)).toBe('你好');
      expect(await message(jar, second, secondBase)).toBe('Hello');
      expect(
        (await jar.getCookies(`${ORIGIN}${secondBase}/message`)).some(
          (cookie) => cookie.key === second.session.cookie.name,
        ),
      ).toBe(false);
    },
  );

  it('ignores old parent cookies, prefers the new cookie, and clears only its own name', async () => {
    const app = await application('/crm');
    const legacy = createSessionManager({
      ...app.session,
      cookie: { ...app.session.cookie, name: 'nocobase_session', path: '/' },
    });
    managers.push(legacy);
    const old = legacy.createRequestSession({});
    await old.set('locale', 'zh-CN');
    const persisted = await old.persist();
    const jar = new CookieJar();
    await jar.setCookie(
      `nocobase_session=${persisted.cookieValue}; Path=/`,
      ORIGIN,
    );
    expect(await message(jar, app, '/crm')).toBe('Hello');
    await select(jar, app, '/crm', 'en-US');
    expect(await message(jar, app, '/crm')).toBe('Hello');
    await request(jar, app, '/crm', '/clear', { method: 'POST' });
    const cookies = await jar.getCookies(`${ORIGIN}/crm/message`);
    expect(cookies.map((cookie) => cookie.key)).toEqual(['nocobase_session']);
    expect(cookies[0]!.value).toBe(persisted.cookieValue);
  });

  it('normalizes root and trailing slashes and preserves explicit name/path overrides', async () => {
    const root = await application('/');
    expect(root.session.cookie).toMatchObject({
      name: 'nocobase_session_%2F',
      path: '/',
    });
    const trailing = await application('/crm/');
    expect(trailing.session.cookie).toMatchObject({
      name: 'nocobase_session_%2Fcrm',
      path: '/crm',
    });
    await writeFile(
      configPath,
      JSON.stringify({
        session: {
          secret: SECRET,
          cookie: {
            name: 'custom_session',
            path: '/shared',
            sameSite: 'strict',
          },
        },
      }),
    );
    const custom = await application('/crm');
    expect(custom.session.cookie).toMatchObject({
      name: 'custom_session',
      path: '/shared',
      sameSite: 'strict',
    });
  });
});
