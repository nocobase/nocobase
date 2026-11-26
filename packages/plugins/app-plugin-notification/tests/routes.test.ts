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
  ApiError,
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
  NotificationTemplateRegistry,
  notificationTemplateRegistryToken,
} from '../server/templates.js';
import {
  notificationRuntimeToken,
  type NotificationRuntime,
} from '../server/runtime.js';
import { NOTIFICATION_NAMESPACE } from '../server/types.js';

describe('@nocobase/app-plugin-notification routes', () => {
  it('keeps logs on the notification settings read action', async () => {
    const { router, require } = await createRouter();

    const response = await router.request('/notifications/logs');

    expect(response.status).toBe(200);
    expect(require).toHaveBeenCalledWith({
      resource: { type: 'settings', id: 'notification' },
      action: 'read',
    });
  });

  it.each([
    ['GET', '/notifications/logs', 'read'],
    ['GET', '/notifications/channels', 'read'],
    ['GET', '/notifications/kinds', 'read'],
    ['GET', '/notifications/deliveries', 'read'],
    ['POST', '/notifications/channels/inbox/test', 'manage'],
    ['POST', '/notifications/deliveries/delivery-1/retry', 'manage'],
  ])('refuses %s %s without the %s action', async (method, path, action) => {
    const { router, require } = await createRouter({ allowed: false });

    const response = await router.request(path, {
      method,
      ...(method === 'POST'
        ? {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ reason: 'Fixed', locale: 'en-US' }),
          }
        : {}),
    });

    expect(response.status).toBe(403);
    expect(require).toHaveBeenCalledWith({
      resource: { type: 'settings', id: 'notification' },
      action,
    });
  });

  it('serves preferences to any signed-in user without a permission check', async () => {
    const { router, require, preferencesFor } = await createRouter({
      allowed: false,
    });

    const response = await router.request('/notifications/preferences');

    expect(response.status).toBe(200);
    expect(preferencesFor).toHaveBeenCalledWith('user-1');
    expect(require).not.toHaveBeenCalled();
  });

  it('requires authentication for logs', async () => {
    const { router, require } = await createRouter({ authenticated: false });
    expect((await router.request('/notifications/logs')).status).toBe(401);
    expect((await router.request('/notifications/preferences')).status).toBe(
      401,
    );
    expect(require).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', '/notifications/testTargets'],
    ['POST', '/notifications/testSends'],
    ['GET', '/notifications/testSends/previous-test'],
  ])('does not expose the removed %s %s endpoint', async (method, path) => {
    const { router, require } = await createRouter();
    const response = await router.request(path, {
      method,
      headers: { 'x-nocobase-notification-test': '1' },
    });
    expect(response.status).toBe(404);
    expect(require).not.toHaveBeenCalled();
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
      ['GET /api/notifications/channels', 'notificationsListChannels', tags],
      [
        'POST /api/notifications/channels/{name}/test',
        'notificationsTestChannel',
        tags,
      ],
      ['GET /api/notifications/kinds', 'notificationsListKinds', tags],
      ['GET /api/notifications/kinds/{kindId}', 'notificationsGetKind', tags],
      [
        'POST /api/notifications/kinds/{kindId}/preview',
        'notificationsPreviewKind',
        tags,
      ],
      [
        'GET /api/notifications/deliveries',
        'notificationsListDeliveries',
        tags,
      ],
      [
        'GET /api/notifications/deliveries/{deliveryId}',
        'notificationsGetDelivery',
        tags,
      ],
      [
        'POST /api/notifications/deliveries/{deliveryId}/retry',
        'notificationsRetryDelivery',
        tags,
      ],
      [
        'GET /api/notifications/preferences',
        'notificationsGetPreferences',
        tags,
      ],
      [
        'PUT /api/notifications/preferences',
        'notificationsUpdatePreferences',
        tags,
      ],
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
  readonly require: ReturnType<typeof vi.fn>;
  readonly preferencesFor: ReturnType<typeof vi.fn>;
}> {
  const container = new ServiceContainer();
  container.instance(
    notificationTemplateRegistryToken,
    new NotificationTemplateRegistry(),
  );
  const require = vi.fn(async () => {
    if (options.allowed === false)
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        reason: 'AUTHORIZATION_DENIED',
        domain: 'authorization',
        message: 'Permission denied.',
      });
  });
  const preferencesFor = vi.fn(async () => ({ channelTypes: [], kinds: [] }));
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
      context.set('authz', { require });
      await next();
    },
  } as unknown as Authorization);
  container.instance(notificationRuntimeToken, {
    router: logsRouter,
    preferencesFor,
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
    require,
    preferencesFor,
  };
}
