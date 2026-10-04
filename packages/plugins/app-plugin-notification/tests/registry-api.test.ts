import { createApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { fetchNotificationLogs } from '../registry/logs-ui/api.js';

describe('notification Registry API', () => {
  it('uses the application API URL and unwraps logs', async () => {
    const logs = [{ log: { id: 'log-1' }, deliveries: [] }];
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ data: logs }));
    const api = createApiClient({ baseURL: '/custom/api', fetch: transport });
    const controller = new AbortController();
    await expect(
      fetchNotificationLogs(api, controller.signal),
    ).resolves.toEqual(logs);
    expect(transport).toHaveBeenCalledWith(
      '/custom/api/notifications/logs?pageSize=100',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      }),
    );
  });

  it('preserves cancellation rejection', async () => {
    const failure = new DOMException('Aborted', 'AbortError');
    const transport = vi.fn<typeof fetch>().mockRejectedValue(failure);
    const api = createApiClient({ baseURL: '/custom/api', fetch: transport });
    await expect(
      fetchNotificationLogs(api, new AbortController().signal),
    ).rejects.toBe(failure);
  });

  it('retains server failure messages', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ error: { message: 'Access denied' } }, { status: 403 }),
      );
    const api = createApiClient({ baseURL: '/custom/api', fetch: transport });
    await expect(fetchNotificationLogs(api)).rejects.toMatchObject({
      message: 'Access denied',
      status: 403,
    });
  });
});
