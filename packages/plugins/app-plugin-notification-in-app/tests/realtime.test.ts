import { describe, expect, it, vi } from 'vitest';

import { createRealtimeInAppStore } from '../server/realtime.js';
import { MemoryInAppStore } from '../server/store.js';

describe('createRealtimeInAppStore', () => {
  it('publishes user-scoped invalidation events after durable mutations', async () => {
    const publishFor = vi.fn();
    const store = createRealtimeInAppStore(new MemoryInAppStore(), {
      publishFor,
    });

    const item = await store.deliver({
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      message: { body: 'Review the request.' },
      createdAt: '2026-08-26T00:00:00.000Z',
    });
    await store.update({ id: item.id, userId: 'user-1', action: 'read' });
    await store.markAllRead('user-1');

    expect(publishFor).toHaveBeenNthCalledWith(1, 'user-1', {
      kind: 'inbox.changed',
      change: 'created',
    });
    expect(publishFor).toHaveBeenNthCalledWith(2, 'user-1', {
      kind: 'inbox.changed',
      change: 'read',
    });
    expect(publishFor).toHaveBeenCalledTimes(2);
  });

  it('does not turn realtime publication failure into storage failure', async () => {
    const reportError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const store = createRealtimeInAppStore(new MemoryInAppStore(), {
      publishFor: vi.fn().mockRejectedValue(new Error('broker unavailable')),
    });

    await expect(
      store.deliver({
        deliveryId: 'delivery-1',
        notificationId: 'notification-1',
        userId: 'user-1',
        message: { body: 'Still stored.' },
        createdAt: '2026-08-26T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({ body: 'Still stored.' });
    expect(reportError).toHaveBeenCalledOnce();
  });
});
