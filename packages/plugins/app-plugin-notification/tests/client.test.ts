import { describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';

import {
  NotificationClient,
  NotificationTestApiError,
} from '../client/notification-client.js';
import notificationPlugin from '../client/plugin.js';
import routes from '../client/routes.js';

describe('@nocobase/app-plugin-notification client', () => {
  it('contributes notification logs and locale resources through the settings centre', () => {
    const registration = notificationPlugin();

    expect(registration.serviceProviders).toHaveLength(1);
    expect(registration.routes).toEqual([routes]);
    expect(registration.locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
    expect(routes).toMatchObject({
      parent: 'settings',
      routes: [
        {
          name: 'notifications',
          path: '/notifications',
          children: [{ name: 'logs', path: '/logs' }],
        },
      ],
    });
    const resolved = resolveAppClientContributions([
      { packageName: registration.packageName, routes },
    ]);
    expect(resolved.settingGroups).toMatchObject([
      { id: 'notifications', title: 'nav.notifications' },
    ]);
    expect(resolved.settings).toMatchObject([
      {
        path: '/settings/notifications/logs',
        authz: {
          resource: { type: 'page', id: 'notification.logs' },
          action: 'access',
        },
      },
    ]);
  });

  it('loads redacted notification log details through the API client', async () => {
    const details = [{ log: { id: 'notification-1' }, deliveries: [] }];
    const request = vi.fn().mockResolvedValue({ data: details });

    await expect(
      new NotificationClient({ request }).listLogs(),
    ).resolves.toEqual(details);
    expect(request).toHaveBeenCalledWith({
      path: 'notifications/logs',
      query: { pageSize: 100 },
    });
  });

  it('loads safe test targets and sends through the core test route', async () => {
    const target = {
      channel: { name: 'im', type: 'im', label: 'IM' },
      provider: {
        name: 'feishu',
        type: 'feishu-webhook',
        label: 'Feishu webhook',
      },
      fields: [],
    };
    const result = {
      notificationId: 'notification-1',
      idempotencyKey: 'notification-test:notification-1',
      deduplicated: false,
      status: 'pending',
      deliveries: [],
    };
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: [target] })
      .mockResolvedValueOnce({ data: result });
    const client = new NotificationClient({ request });

    await expect(client.listTestTargets()).resolves.toEqual([target]);
    await expect(
      client.sendTest({
        channel: 'im',
        values: { title: 'Test', body: 'Hello' },
      }),
    ).resolves.toEqual(result);
    expect(request).toHaveBeenNthCalledWith(1, {
      headers: { 'x-nocobase-notification-test': '1' },
      path: 'notifications/testTargets',
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      headers: { 'x-nocobase-notification-test': '1' },
      json: {
        channel: 'im',
        values: { title: 'Test', body: 'Hello' },
      },
      method: 'POST',
      path: 'notifications/testSends',
    });
  });

  it('surfaces the reason and localized message of a standard test error', async () => {
    const request = vi.fn().mockRejectedValue(
      new ApiClientError('Notification test send permission is required.', {
        status: 403,
        reason: 'NOTIFICATION_TEST_FORBIDDEN',
        domain: 'notifications',
        method: 'POST',
        url: '/api/notifications/testSends',
        payload: {
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
          },
        },
      }),
    );

    await expect(
      new NotificationClient({ request }).sendTest({
        channel: 'email',
        values: { recipient: 'test@example.com' },
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'NotificationTestApiError',
        reason: 'NOTIFICATION_TEST_FORBIDDEN',
        message: '需要发送通知测试的权限。',
        status: 403,
      } satisfies Partial<NotificationTestApiError>),
    );
  });

  it('reports testing as unavailable when the application has no test routes', async () => {
    const request = vi.fn().mockRejectedValue(
      new ApiClientError(
        'No API route matches GET /api/notifications/testTargets.',
        {
          status: 404,
          reason: 'ROUTE_NOT_FOUND',
          domain: 'app',
          method: 'GET',
          url: '/api/notifications/testTargets',
        },
      ),
    );

    await expect(
      new NotificationClient({ request }).listTestTargets(),
    ).rejects.toMatchObject({
      name: 'NotificationTestApiError',
      reason: 'NOTIFICATION_TEST_UNAVAILABLE',
      status: 404,
    });
  });
});
