import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import serverLocales from '../server/locales/index.js';
import { createNotificationRouter } from '../server/router.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  notificationRuntimeToken,
  type NotificationRuntime,
} from '../server/runtime.js';
import { NOTIFICATION_NAMESPACE } from '../server/types.js';

describe('@nocobase/app-plugin-notification routes', () => {
  it('keeps logs on their page access permission', async () => {
    const { router, can } = await createRouter();

    const response = await router.request('/notifications/logs');

    expect(response.status).toBe(200);
    expect(can).toHaveBeenCalledWith({
      resource: { type: 'page', id: 'notification.logs' },
      action: 'access',
    });
  });

  it('returns a stable localized error when log access is denied', async () => {
    const { router } = await createRouter({ allowed: false });

    const response = await router.request('/notifications/logs', {
      headers: { 'accept-language': 'zh-CN' },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'NOTIFICATION_LOGS_FORBIDDEN',
        domain: 'notifications',
        message: 'Notification logs access is required.',
        localizedMessage: {
          locale: 'zh-CN',
          message: '需要通知日志访问权限。',
        },
        requestId: expect.any(String),
      },
    });
  });

  it('requires authentication for logs', async () => {
    const { router, can } = await createRouter({ authenticated: false });
    expect((await router.request('/notifications/logs')).status).toBe(401);
    expect(can).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', '/notifications/testTargets'],
    ['POST', '/notifications/testSends'],
    ['GET', '/notifications/testSends/previous-test'],
  ])('does not expose the removed %s %s endpoint', async (method, path) => {
    const { router, can } = await createRouter();
    const response = await router.request(path, {
      method,
      headers: { 'x-nocobase-notification-test': '1' },
    });
    expect(response.status).toBe(404);
    expect(can).not.toHaveBeenCalled();
  });
});

describe('API document', () => {
  it('declares every route with a unique operation', async () => {
    const { contribution } = await createRouter({
      logsRouter: createNotificationRouter({
        logs: { get: vi.fn(), listDetails: vi.fn() },
      }),
    });

    expect(findUndeclaredApiRoutes(contribution)).toEqual([]);
    const document = await generateApiDocument(contribution, {
      info: { title: 'test', version: '0.0.0' },
    });
    const operations = Object.entries(document.paths ?? {}).flatMap(
      ([path, item]) =>
        Object.entries(item ?? {}).map(([method, operation]) => [
          `${method.toUpperCase()} ${path}`,
          (operation as { operationId?: string }).operationId,
          (operation as { tags?: string[] }).tags,
        ]),
    );
    const tags = ['Notification'];
    expect(operations).toEqual([
      ['GET /api/notifications/logs', 'notificationsListLogs', tags],
      ['GET /api/notifications/logs/{logId}', 'notificationsGetLog', tags],
    ]);
    expect(document.components?.schemas).toHaveProperty(
      'NotificationLogDetails',
    );
  });
});

interface RouterOptions {
  readonly allowed?: boolean;
  readonly authenticated?: boolean;
  /** The runtime's log router; a stub answering an empty list by default. */
  readonly logsRouter?: Hono;
}

async function createRouter(options: RouterOptions = {}): Promise<{
  readonly router: Hono;
  /** The plugin's own router, as the application mounts it under `/api`. */
  readonly contribution: Hono;
  readonly can: ReturnType<typeof vi.fn>;
}> {
  const container = new ServiceContainer();
  const can = vi.fn(async () => options.allowed ?? true);
  let logsRouter = options.logsRouter;
  if (!logsRouter) {
    logsRouter = new Hono();
    logsRouter.get('/logs', (context) => context.json({ data: [] }));
  }
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (options.authenticated === false) {
        return context.json(
          { code: 'UNAUTHORIZED', message: 'Authentication required' },
          401,
        );
      }
      context.set('auth', { user: { id: 'user-1' }, session: {} });
      await next();
    },
  } as unknown as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', { can });
      await next();
    },
  } as unknown as Authorization);
  container.instance(notificationRuntimeToken, {
    router: logsRouter,
  } as unknown as NotificationRuntime);

  const contribution = await apiRoutes.createRouter({
    appName: 'test',
    publicBasePath: '',
    config: {
      get: () => ({
        channels: {},
      }),
    },
    paths: {} as never,
    router: new Hono(),
    container,
  } as unknown as AppPluginApplication);
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace(NOTIFICATION_NAMESPACE, serverLocales);
  await runtime.init();
  const router = new Hono();
  router.use('*', createI18nMiddleware(runtime));
  router.route('/', contribution);
  return {
    router,
    contribution,
    can,
  };
}
