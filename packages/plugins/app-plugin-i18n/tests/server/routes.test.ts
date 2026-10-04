import { I18nRuntime } from '@nocobase/i18n';
import {
  createI18nMiddleware,
  getRequestLocale,
  getRequestTranslator,
} from '@nocobase/i18n/server';
import { i18nToken } from '@nocobase/app-server/i18n';
import { apiErrorHandler } from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { i18nApiRoutes } from '../../server/routes.js';

interface StoredSession {
  readonly values: Record<string, unknown>;
}

async function createRouter(
  session?: StoredSession,
  defaultLocale = 'en-US',
): Promise<{ router: Hono; session?: StoredSession }> {
  const runtime = new I18nRuntime({
    defaultLocale,
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('@test/app', {
    'en-US': () => Promise.resolve({ default: { greeting: 'Hello' } }),
    'zh-CN': () => Promise.resolve({ default: { greeting: '你好' } }),
  });
  await runtime.init(defaultLocale);

  const container = new ServiceContainer();
  container.instance(i18nToken, runtime);

  const routes = await i18nApiRoutes.createRouter({ container } as never);

  // The session middleware runs ahead of the routes, the way it is mounted in a real application, so it has to be
  // registered on an outer router rather than added to one that already carries them.
  const router = new Hono();
  router.onError(apiErrorHandler);
  if (session) {
    router.use('*', async (context, next) => {
      context.set(
        'session' as never,
        {
          get: () => Promise.resolve(session.values),
          set: (key: string, value: unknown) => {
            session.values[key] = value;
            return Promise.resolve();
          },
        } as never,
      );
      await next();
    });
  }
  router.use('*', createI18nMiddleware(runtime));
  router.route('/', routes);
  router.get('/translated', (context) =>
    context.json({
      locale: getRequestLocale(context),
      message: getRequestTranslator(context)('greeting'),
    }),
  );

  return { router, session };
}

describe('GET /i18n/locales', () => {
  it('reports the default locale and everything available', async () => {
    const { router } = await createRouter();

    const response = await router.request('/i18n/locales');

    await expect(response.json()).resolves.toEqual({
      data: {
        defaultLocale: 'en-US',
        locales: [
          { locale: 'en-US', label: expect.any(String), direction: 'ltr' },
          { locale: 'zh-CN', label: expect.any(String), direction: 'ltr' },
        ],
      },
    });
  });
});

describe('PUT /i18n/locale', () => {
  it('stores a supported locale on the session', async () => {
    const session: StoredSession = { values: {} };
    const { router } = await createRouter(session);

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'zh-CN' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { locale: 'zh-CN', requestedLocale: 'zh-CN', fallback: false },
    });
    expect(session.values).toEqual({ locale: 'zh-CN' });
  });

  it('falls back to English and uses it on subsequent requests even with a Chinese default', async () => {
    const session: StoredSession = { values: { locale: 'zh-CN' } };
    const { router } = await createRouter(session, 'zh-CN');

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'fr-FR' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { locale: 'en-US', requestedLocale: 'fr-FR', fallback: true },
    });
    expect(session.values).toEqual({ locale: 'en-US' });
    const translated = await router.request('/translated', {
      headers: { 'Accept-Language': 'zh-CN' },
    });
    await expect(translated.json()).resolves.toEqual({
      locale: 'en-US',
      message: 'Hello',
    });
  });

  it('rejects a request with no locale', async () => {
    const { router } = await createRouter();

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { reason: string; fieldViolations: { field: string }[] };
    };
    expect(body.error.reason).toBe('INVALID_INPUT');
    expect(body.error.fieldViolations[0]?.field).toBe('locale');
  });

  it('rejects an unknown body field', async () => {
    const { router } = await createRouter();

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'zh-CN', persist: true }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { reason: string } };
    expect(body.error.reason).toBe('INVALID_INPUT');
  });

  it('rejects a malformed body instead of throwing', async () => {
    const { router } = await createRouter();

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    expect(response.status).toBe(400);
  });

  it.each(['', '  ', 42, null])(
    'rejects an invalid locale %j',
    async (locale) => {
      const session: StoredSession = { values: { locale: 'zh-CN' } };
      const { router } = await createRouter(session);
      const response = await router.request('/i18n/locale', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      expect(response.status).toBe(400);
      expect(session.values).toEqual({ locale: 'zh-CN' });
    },
  );

  it('answers the standard error body when mounted on a bare Hono', async () => {
    const runtime = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: ['en-US'],
    });
    await runtime.init('en-US');
    const container = new ServiceContainer();
    container.instance(i18nToken, runtime);
    const bare = new Hono();
    bare.route('/', await i18nApiRoutes.createRouter({ container } as never));

    const response = await bare.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
    });
  });

  it('succeeds with no session mounted', async () => {
    const { router } = await createRouter();

    const response = await router.request('/i18n/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'zh-CN' }),
    });

    expect(response.status).toBe(200);
  });
});
