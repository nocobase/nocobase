import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@nocobase/app-client';

import {
  fetchInbox,
  fetchUnreadCount,
  markInboxRead,
  mutateInboxItem,
} from '../client/api.js';

describe('in-app notification Client API', () => {
  it('uses relative paths on the injected application client', async () => {
    const responses: unknown[] = [
      { data: [], meta: { nextPageToken: 'next' } },
      { data: { count: 3 } },
    ];
    const request = vi.fn(async <T>(): Promise<T> => responses.shift() as T);
    const client = createClient(request);

    await expect(
      fetchInbox(client, {
        unreadOnly: true,
        pageSize: 10,
        pageToken: 'token',
      }),
    ).resolves.toEqual({ data: [], nextPageToken: 'next' });
    await expect(fetchUnreadCount(client)).resolves.toBe(3);

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'notificationInApp/messages?pageSize=10&unreadOnly=true&pageToken=token',
      signal: undefined,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'notificationInApp/messages/unreadCount',
      signal: undefined,
    });
  });

  it('sends mutations through the injected client without a CSRF token', async () => {
    const item = {
      id: 'item/1',
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      title: 'Title',
      body: 'Body',
      createdAt: '2026-09-02T00:00:00.000Z',
    };
    const responses: unknown[] = [
      { data: item },
      { data: { updated: 4 } },
      undefined,
    ];
    const request = vi.fn(async <T>(): Promise<T> => responses.shift() as T);
    const client = createClient(request);

    await expect(mutateInboxItem(client, 'item/1', 'read')).resolves.toEqual(
      item,
    );
    await expect(markInboxRead(client)).resolves.toBe(4);
    await expect(
      mutateInboxItem(client, 'item/1', 'delete'),
    ).resolves.toBeUndefined();

    expect(request.mock.calls).toEqual([
      [
        {
          path: 'notificationInApp/messages/item%2F1/markRead',
          method: 'POST',
        },
      ],
      [{ path: 'notificationInApp/messages/markAllRead', method: 'POST' }],
      [{ path: 'notificationInApp/messages/item%2F1', method: 'DELETE' }],
    ]);
  });
});

function createClient(request: ApiClient['request']): ApiClient {
  return {
    request,
    repository: vi.fn(),
    stream: async (): Promise<ReadableStream<Uint8Array>> =>
      new ReadableStream<Uint8Array>(),
  };
}
