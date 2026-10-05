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

import { NotificationTransportUnavailableError } from '../server/manager.js';
import { createNotificationRouter } from '../server/router.js';
import { apiRoutes } from '../server/routes/index.js';
import serverLocales from '../server/locales/index.js';
import {
  notificationRuntimeToken,
  type NotificationRuntime,
} from '../server/runtime.js';
import {
  NOTIFICATION_NAMESPACE,
  notificationI18nText,
  notificationTestError,
} from '../server/types.js';

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

  it('lists only safe targets without requiring send permission', async () => {
    const targets = [
      {
        channel: {
          name: 'email',
          type: 'email',
          label: notificationI18nText('test.channels.email', 'Email'),
        },
        provider: {
          type: 'smtp',
          label: notificationI18nText('test.providers.smtp', 'SMTP'),
        },
        fields: [
          {
            name: 'recipient',
            label: notificationI18nText('test.fields.recipient', 'Recipient'),
            type: 'email',
          },
        ],
      },
    ] as const;
    const { router, can, listTestTargets } = await createRouter({
      allowed: false,
      targets,
    });

    const response = await router.request('/notifications/testTargets', {
      headers: { 'x-nocobase-notification-test': '1' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          channel: { name: 'email', type: 'email', label: 'Email' },
          provider: { type: 'smtp', label: 'SMTP' },
          fields: [{ name: 'recipient', label: 'Recipient', type: 'email' }],
        },
      ],
      meta: { total: 1 },
    });
    expect(listTestTargets).toHaveBeenCalledOnce();
    expect(can).not.toHaveBeenCalled();
  });

  it('sends through the core manager with the authenticated actor', async () => {
    const { router, sendTest } = await createRouter();
    const input = {
      channel: 'email',
      values: { recipient: 'test@example.com' },
    };

    const response = await router.request('/notifications/testSends', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nocobase-notification-test': '1',
      },
      body: JSON.stringify(input),
    });

    expect(response.status).toBe(202);
    expect(sendTest).toHaveBeenCalledWith(input, { userId: 'user-1' });
  });

  it('rejects legacy or extended test request shapes', async () => {
    const { router, sendTest } = await createRouter();
    const request = (body: object): Promise<Response> =>
      router.request('/notifications/testSends', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-nocobase-notification-test': '1',
        },
        body: JSON.stringify(body),
      });

    const legacy = await request({
      channel: 'email',
      providerType: 'smtp',
      values: { recipient: 'test@example.com' },
    });
    const extended = await request({
      channel: 'email',
      provider: { type: 'smtp', label: 'SMTP' },
      values: { recipient: 'test@example.com' },
    });

    expect(legacy.status).toBe(400);
    await expect(legacy.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: '' })],
      },
    });
    expect(extended.status).toBe(400);
    expect(sendTest).not.toHaveBeenCalled();
  });

  it('reports an invalid test field as a field violation with a localized message', async () => {
    const { router, sendTest } = await createRouter();
    sendTest.mockRejectedValueOnce(
      notificationTestError(
        'NOTIFICATION_TEST_UNKNOWN_FIELD',
        'errors.testUnknownField',
        { params: { name: 'cc' } },
      ),
    );

    const response = await router.request('/notifications/testSends', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nocobase-notification-test': '1',
      },
      body: JSON.stringify({ channel: 'email', values: { cc: 'x' } }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'NOTIFICATION_TEST_UNKNOWN_FIELD',
        domain: 'notifications',
        message: 'Unknown notification test field "cc".',
        fieldViolations: [{ field: 'values.cc' }],
        metadata: { name: 'cc' },
      },
    });
  });

  it('answers 503 only when the transport is unavailable and leaves other failures to the application', async () => {
    const { router, sendTest } = await createRouter();
    const send = (): Promise<Response> =>
      router.request('/notifications/testSends', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-nocobase-notification-test': '1',
        },
        body: JSON.stringify({
          channel: 'email',
          values: { recipient: 'test@example.com' },
        }),
      });

    sendTest.mockRejectedValueOnce(
      new NotificationTransportUnavailableError('SMTP transport refused.'),
    );
    const unavailable = await send();
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toMatchObject({
      error: {
        status: 'UNAVAILABLE',
        reason: 'NOTIFICATION_TEST_FAILED',
        domain: 'notifications',
      },
    });

    // A defect is not reported as a test failure: the error reaches the application's handler unchanged.
    const defect = new TypeError('Cannot read properties of undefined');
    sendTest.mockRejectedValueOnce(defect);
    const app = new Hono();
    let seen: unknown;
    app.onError((error, context) => {
      seen = error;
      return context.text('application handler', 500);
    });
    app.route('/', router);
    const response = await app.request('/notifications/testSends', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nocobase-notification-test': '1',
      },
      body: JSON.stringify({
        channel: 'email',
        values: { recipient: 'test@example.com' },
      }),
    });
    expect(response.status).toBe(500);
    expect(seen).toBe(defect);
  });

  it('restricts status lookup to the actor through the manager interface', async () => {
    const { router, getTestStatus } = await createRouter();

    const response = await router.request('/notifications/testSends/test-1', {
      headers: { 'x-nocobase-notification-test': '1' },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { reason: 'NOTIFICATION_TEST_NOT_FOUND', domain: 'notifications' },
    });
    expect(getTestStatus).toHaveBeenCalledWith('test-1', {
      userId: 'user-1',
    });
  });

  it('requires authentication and the anti-CSRF header, with permission checked only when sending', async () => {
    const anonymous = await createRouter({ authenticated: false });
    expect(
      (
        await anonymous.router.request('/notifications/testTargets', {
          headers: { 'x-nocobase-notification-test': '1' },
        })
      ).status,
    ).toBe(401);

    const enabled = await createRouter();
    const missingHeader = await enabled.router.request(
      '/notifications/testTargets',
    );
    expect(missingHeader.status).toBe(403);
    await expect(missingHeader.json()).resolves.toMatchObject({
      error: { reason: 'NOTIFICATION_TEST_HEADER_REQUIRED' },
    });
    // The test header guards only the test routes, never the logs that share the prefix.
    expect((await enabled.router.request('/notifications/logs')).status).toBe(
      200,
    );

    const denied = await createRouter({ allowed: false });
    await expect(
      (
        await denied.router.request('/notifications/testSends', {
          method: 'POST',
          headers: {
            'accept-language': 'zh-CN',
            'content-type': 'application/json',
            'x-nocobase-notification-test': '1',
          },
          body: JSON.stringify({
            channel: 'email',
            values: { recipient: 'test@example.com' },
          }),
        })
      ).json(),
    ).resolves.toEqual({
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'NOTIFICATION_TEST_FORBIDDEN',
        domain: 'notifications',
        message: 'Notification test send permission is required.',
        localizedMessage: {
          locale: 'zh-CN',
          message: '需要发送通知测试的权限。',
        },
        requestId: expect.any(String),
      },
    });

    expect(
      (
        await denied.router.request('/notifications/testSends', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-nocobase-notification-test': '1',
          },
          body: JSON.stringify({
            channel: 'email',
            values: { recipient: 'test@example.com' },
          }),
        })
      ).status,
    ).toBe(403);
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
      [
        'GET /api/notifications/testTargets',
        'notificationsListTestTargets',
        tags,
      ],
      [
        'POST /api/notifications/testSends',
        'notificationsCreateTestSend',
        tags,
      ],
      [
        'GET /api/notifications/testSends/{testSendId}',
        'notificationsGetTestSend',
        tags,
      ],
    ]);
    expect(
      document.paths?.['/api/notifications/testSends']?.post?.parameters,
    ).toContainEqual(
      expect.objectContaining({
        in: 'header',
        name: 'x-nocobase-notification-test',
        required: true,
      }),
    );
    expect(document.components?.schemas).toHaveProperty(
      'NotificationLogDetails',
    );
  });
});

interface RouterOptions {
  readonly allowed?: boolean;
  readonly authenticated?: boolean;
  readonly targets?: ReturnType<NotificationRuntime['listTestTargets']>;
  /** The runtime's log router; a stub answering an empty list by default. */
  readonly logsRouter?: Hono;
}

async function createRouter(options: RouterOptions = {}): Promise<{
  readonly router: Hono;
  /** The plugin's own router, as the application mounts it under `/api`. */
  readonly contribution: Hono;
  readonly can: ReturnType<typeof vi.fn>;
  readonly listTestTargets: ReturnType<typeof vi.fn>;
  readonly sendTest: ReturnType<typeof vi.fn>;
  readonly getTestStatus: ReturnType<typeof vi.fn>;
}> {
  const container = new ServiceContainer();
  const can = vi.fn(async () => options.allowed ?? true);
  const listTestTargets = vi.fn(() => options.targets ?? []);
  const sendTest = vi.fn(async () => ({
    notificationId: 'test-1',
    idempotencyKey: 'notification-test:test-1',
    deduplicated: false,
    status: 'pending' as const,
    deliveries: [],
  }));
  const getTestStatus = vi.fn(async () => undefined);
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
    listTestTargets,
    sendTest,
    getTestStatus,
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
    listTestTargets,
    sendTest,
    getTestStatus,
  };
}
