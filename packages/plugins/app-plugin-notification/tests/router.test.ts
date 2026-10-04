import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
  createNotificationRouter,
  NOTIFICATION_NAMESPACE,
  notificationServerLocales,
} from '../server/index.js';

describe('notification router', () => {
  it('lists redacted notification details', async () => {
    const listDetails = vi.fn(async () => [
      {
        log: {
          id: 'notification-1',
          sourceType: 'test',
          status: 'completed' as const,
          createdAt: '2026-08-25T00:00:00.000Z',
          updatedAt: '2026-08-25T00:00:01.000Z',
        },
        deliveries: [],
      },
    ]);
    const router = await localizedRouter({
      logs: { listDetails, get: vi.fn(async () => undefined) },
    });

    const response = await router.request('/logs');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: await listDetails(),
      meta: {},
    });
    expect(listDetails).toHaveBeenCalledWith(21, undefined);
  });

  it('returns one log or a not-found response', async () => {
    const details = {
      log: {
        id: 'notification-1',
        sourceType: 'test',
        status: 'completed' as const,
        createdAt: '2026-08-25T00:00:00.000Z',
        updatedAt: '2026-08-25T00:00:01.000Z',
      },
      deliveries: [],
    };
    const get = vi.fn(async (id: string) =>
      id === details.log.id ? details : undefined,
    );
    const router = await localizedRouter({
      logs: { listDetails: vi.fn(async () => []), get },
    });

    const found = await router.request('/logs/notification-1');
    const missing = await router.request('/logs/missing');

    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({ data: details });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: {
        code: 404,
        status: 'NOT_FOUND',
        reason: 'NOTIFICATION_LOG_NOT_FOUND',
        domain: 'notifications',
        message: 'Notification log not found.',
        localizedMessage: {
          locale: 'en-US',
          message: 'Notification log not found.',
        },
        requestId: expect.any(String),
      },
    });
  });

  it('pages logs with an opaque token and caps the page size', async () => {
    const log = (id: string, createdAt: string) => ({
      log: {
        id,
        sourceType: 'test',
        status: 'completed' as const,
        createdAt,
        updatedAt: createdAt,
      },
      deliveries: [],
    });
    const listDetails = vi.fn(async (limit?: number) =>
      [
        log('notification-3', '2026-08-25T00:00:03.000Z'),
        log('notification-2', '2026-08-25T00:00:02.000Z'),
        log('notification-1', '2026-08-25T00:00:01.000Z'),
      ].slice(0, limit),
    );
    const router = await localizedRouter({
      logs: { listDetails, get: vi.fn(async () => undefined) },
    });

    const first = await router.request('/logs?pageSize=2');
    const firstBody = (await first.json()) as {
      readonly data: readonly unknown[];
      readonly meta: { readonly nextPageToken?: string };
    };
    expect(firstBody.data).toHaveLength(2);
    expect(firstBody.meta.nextPageToken).toEqual(expect.any(String));

    await router.request(
      `/logs?pageSize=2&pageToken=${firstBody.meta.nextPageToken}`,
    );
    expect(listDetails).toHaveBeenLastCalledWith(3, {
      createdAt: '2026-08-25T00:00:02.000Z',
      id: 'notification-2',
    });

    const tooLarge = await router.request('/logs?pageSize=101');
    expect(tooLarge.status).toBe(400);
    await expect(tooLarge.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'pageSize' })],
      },
    });

    const badToken = await router.request('/logs?pageToken=not-a-token');
    expect(badToken.status).toBe(400);
    await expect(badToken.json()).resolves.toMatchObject({
      error: { reason: 'INVALID_PAGE_TOKEN', domain: 'notifications' },
    });
  });
});

async function localizedRouter(
  options: Parameters<typeof createNotificationRouter>[0],
): Promise<Hono> {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace(NOTIFICATION_NAMESPACE, notificationServerLocales);
  await runtime.init();
  const router = new Hono();
  router.use('*', createI18nMiddleware(runtime));
  router.route('/', createNotificationRouter(options));
  return router;
}
