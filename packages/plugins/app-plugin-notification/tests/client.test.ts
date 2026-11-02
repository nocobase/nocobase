import { ApiClientError } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import { NotificationClient } from '../client/notification-client.js';
import notificationPlugin from '../client/plugin.js';

describe('@nocobase/app-plugin-notification client', () => {
  it('contributes its service and locale resources but no pages', () => {
    const registration = notificationPlugin();

    expect(registration.serviceProviders).toHaveLength(1);
    expect(registration.routes).toEqual([]);
    expect(registration.locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
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

  it('preserves log API failures for the application to handle', async () => {
    const failure = new ApiClientError(
      'Notification logs access is required.',
      {
        status: 403,
        reason: 'NOTIFICATION_LOGS_FORBIDDEN',
        domain: 'notifications',
        method: 'GET',
        url: '/api/notifications/logs',
      },
    );
    const request = vi.fn().mockRejectedValue(failure);
    await expect(new NotificationClient({ request }).listLogs()).rejects.toBe(
      failure,
    );
  });
});
