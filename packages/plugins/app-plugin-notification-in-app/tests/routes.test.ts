import {
  Auth,
  authenticationToken,
  type AuthSession,
} from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection } from '@nocobase/db';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { IN_APP_NOTIFICATION_NAMESPACE } from '../server/i18n.js';
import serverLocales from '../server/locales/index.js';
import { inAppNotificationStoreToken } from '../server/tokens.js';
import { MemoryInAppStore } from '../server/store.js';

describe('@nocobase/app-plugin-notification-in-app routes', () => {
  it('answers 401 through the authentication plugin when nobody is signed in', async () => {
    const { request, getSession } = await createRoutes();
    getSession.mockResolvedValue(null);

    const response = await request('/notificationInApp/messages');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'UNAUTHENTICATED',
        reason: 'AUTHENTICATION_REQUIRED',
        domain: 'authentication',
      },
    });
    expect(getSession).toHaveBeenCalledOnce();
  });

  it('reads the user from the authenticated session and answers 401 once that session is signed out', async () => {
    const { request, getSession, store } = await createRoutes();
    await store.deliver({
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      message: { body: 'Visible' },
      createdAt: '2026-08-26T00:00:00.000Z',
    });
    getSession.mockResolvedValueOnce(sessionOf('user-1'));

    const signedIn = await request('/notificationInApp/messages/unreadCount');
    expect(signedIn.status).toBe(200);
    await expect(signedIn.json()).resolves.toEqual({ data: { count: 1 } });

    // Signing out invalidates the Better Auth session; nothing the inbox stored earlier may keep the user signed in.
    getSession.mockResolvedValueOnce(null);
    const signedOut = await request('/notificationInApp/messages/unreadCount');
    expect(signedOut.status).toBe(401);
    await expect(signedOut.json()).resolves.toMatchObject({
      error: { reason: 'AUTHENTICATION_REQUIRED' },
    });
  });

  it('never authenticates from, nor writes, the NocoBase session', async () => {
    const set = vi.fn();
    const { request, getSession } = await createRoutes({
      session: { get: async () => ({ userId: 'user-1' }), set },
    });
    getSession.mockResolvedValueOnce(null);

    const anonymous = await request('/notificationInApp/messages');
    expect(anonymous.status).toBe(401);

    getSession.mockResolvedValue(sessionOf('user-1'));
    expect((await request('/notificationInApp/messages')).status).toBe(200);
    expect(set).not.toHaveBeenCalled();
  });

  it("rejects a cross-site cookie-authenticated write through the authentication plugin's origin check", async () => {
    const { request, getSession, store } = await createRoutes();
    const delivered = await store.deliver({
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      message: { body: 'Unread' },
      createdAt: '2026-08-26T00:00:00.000Z',
    });
    getSession.mockResolvedValue(sessionOf('user-1'));

    for (const [path, method] of [
      ['/notificationInApp/messages/markAllRead', 'POST'],
      [`/notificationInApp/messages/${delivered.id}/markRead`, 'POST'],
      [`/notificationInApp/messages/${delivered.id}/markUnread`, 'POST'],
      [`/notificationInApp/messages/${delivered.id}`, 'DELETE'],
    ] as const) {
      for (const headers of [
        { origin: 'https://evil.example' },
        { referer: 'https://evil.example/page' },
        {},
      ]) {
        const response = await request(path, {
          method,
          headers: { cookie: SESSION_COOKIE, ...headers },
        });
        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toMatchObject({
          error: {
            status: 'PERMISSION_DENIED',
            reason: 'INVALID_CSRF_ORIGIN',
            domain: 'authentication',
          },
        });
      }
    }
    // The origin check answers before the session is looked up, and nothing was written.
    expect(getSession).not.toHaveBeenCalled();
    expect(await store.countUnread('user-1')).toBe(1);
  });

  it('accepts a same-origin cookie-authenticated write without any CSRF header', async () => {
    const { request, getSession, store } = await createRoutes();
    const delivered = await store.deliver({
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      message: { body: 'Unread' },
      createdAt: '2026-08-26T00:00:00.000Z',
    });
    getSession.mockResolvedValue(sessionOf('user-1'));
    const sameOrigin = { cookie: SESSION_COOKIE, origin: 'http://localhost' };

    const read = await request(
      `/notificationInApp/messages/${delivered.id}/markRead`,
      { method: 'POST', headers: sameOrigin },
    );
    expect(read.status).toBe(200);
    expect(await store.countUnread('user-1')).toBe(0);

    const deleted = await request(
      `/notificationInApp/messages/${delivered.id}`,
      { method: 'DELETE', headers: sameOrigin },
    );
    expect(deleted.status).toBe(204);
    expect(await store.list({ userId: 'user-1', limit: 10 })).toEqual([]);
  });
});

/** Any cookie makes the write cookie-authenticated; the session behind it comes from the stubbed lookup. */
const SESSION_COOKIE = 'better-auth.session_token=session-user-1';

function sessionOf(userId: string): AuthSession {
  return {
    user: { id: userId },
    session: { id: `session-${userId}`, userId },
  } as unknown as AuthSession;
}

async function createRoutes(
  options: { readonly session?: unknown } = {},
): Promise<{
  readonly request: (path: string, init?: RequestInit) => Promise<Response>;
  readonly getSession: ReturnType<typeof vi.fn<Auth['getSession']>>;
  readonly store: MemoryInAppStore;
}> {
  const container = new ServiceContainer();
  // The real middleware, with only the session lookup replaced, so the 401 is the authentication plugin's own answer.
  const auth = new Auth({
    connection: {} as DatabaseConnection,
    baseURL: 'http://localhost/api/auth',
    secret: 'development-secret-at-least-32-characters',
  });
  const getSession = vi.fn<Auth['getSession']>();
  auth.getSession = getSession;
  container.instance(authenticationToken, auth);
  const router = new Hono();
  const store = new MemoryInAppStore();
  container.instance(inAppNotificationStoreToken, store);
  const contributionRouter = await apiRoutes.createRouter(
    createApp(router, container),
  );

  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace(IN_APP_NOTIFICATION_NAMESPACE, serverLocales);
  await runtime.init();
  const app = new Hono<{ Variables: { session: unknown } }>();
  app.use('*', createI18nMiddleware(runtime));
  if (options.session) {
    const session = options.session;
    app.use('*', async (context, next) => {
      context.set('session', session);
      await next();
    });
  }
  app.route('/', contributionRouter);
  return {
    request: async (path, init) => app.request(path, init),
    getSession,
    store,
  };
}

function createApp(
  router: Hono,
  container: ServiceContainer,
): AppPluginApplication {
  return {
    appName: 'test',
    publicBasePath: '',
    config: { app: { name: 'test', publicBasePath: '' } },
    paths: {} as never,
    router,
    container,
  };
}
