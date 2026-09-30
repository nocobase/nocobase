import { createLogger } from '@nocobase/logging';
import type { DatabaseManager } from '@nocobase/db';
import { describe, expect, it, vi } from 'vitest';

import { createNotificationManager } from '../server/manager.js';
import type {
  NotificationProviderCapabilities,
  NotificationProviderSendInput,
  ProviderSendResult,
} from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

describe('NotificationManager delivery lifecycle', () => {
  it('deduplicates repeated sends and rejects reuse with different content', async () => {
    const send = vi.fn(async () => ({ status: 'accepted' }) as const);
    const { manager } = createEmailManagerHarness({ send });
    const input = {
      idempotencyKey: 'order-won:42:user-7:email',
      messages: { email: { title: 'Order won', body: 'Order 42 was won.' } },
    };

    const first = await manager.send(input);
    const repeated = await manager.send(input);

    expect(first.deduplicated).toBe(false);
    expect(repeated).toMatchObject({
      notificationId: first.notificationId,
      idempotencyKey: input.idempotencyKey,
      deduplicated: true,
      status: 'completed',
    });
    expect(send).toHaveBeenCalledOnce();
    await expect(
      manager.getByIdempotencyKey(input.idempotencyKey),
    ).resolves.toMatchObject({
      notificationId: first.notificationId,
      terminal: true,
      summary: { accepted: 1 },
    });
    await expect(
      manager.send({
        ...input,
        messages: { email: { title: 'Order won', body: 'Different body.' } },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_CONFLICT' });

    await manager.close();
  });

  it('derives a self-consistent status snapshot from one Delivery read', async () => {
    const store = new StaleLogStatusNotificationStore();
    const { manager } = createEmailManagerHarness({
      store,
      send: async () => ({ status: 'accepted' }),
    });

    const sent = await manager.send({
      idempotencyKey: 'consistent-status-snapshot-1',
      messages: { email: { body: 'Consistent status.' } },
    });

    await expect(
      manager.getNotification(sent.notificationId),
    ).resolves.toMatchObject({
      status: 'completed',
      terminal: true,
      summary: { accepted: 1, pending: 0 },
      deliveries: [{ status: 'accepted' }],
    });

    await manager.close();
  });

  it('emits process-local status events without awaiting listener work', async () => {
    const { manager } = createEmailManagerHarness({
      send: async () => ({ status: 'accepted' }),
    });
    const listener = vi.fn(async () => new Promise<void>(() => undefined));
    const unsubscribe = manager.onStatusChanged(
      { idempotencyKey: 'status-event-1' },
      listener,
    );

    const result = await manager.send({
      idempotencyKey: 'status-event-1',
      messages: { email: { body: 'Status event.' } },
    });
    await vi.waitFor(() => expect(listener).toHaveBeenCalled());

    expect(result.status).toBe('completed');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'status-event-1',
        notificationId: result.notificationId,
      }),
    );
    unsubscribe();
    await manager.close();
  });

  it('does not emit an older status snapshot after a newer one', async () => {
    const store = new DelayedLogNotificationStore();
    const send = vi
      .fn<
        (input: NotificationProviderSendInput) => Promise<ProviderSendResult>
      >()
      .mockResolvedValueOnce({
        status: 'failed',
        disposition: 'never',
        error: { message: 'rejected', category: 'provider' },
      })
      .mockResolvedValueOnce({ status: 'accepted' });
    const { manager } = createEmailManagerHarness({ send, store });
    const sent = await manager.send({
      idempotencyKey: 'status-event-order-1',
      messages: { email: { body: 'Ordered status event.' } },
    });
    const gate = store.delayNextLogRead();
    const statuses: string[] = [];
    const unsubscribe = manager.onStatusChanged(
      { notificationId: sent.notificationId },
      (event) => {
        statuses.push(event.status);
      },
    );
    await gate.captured;

    await manager.retryDelivery({
      deliveryId: sent.deliveries[0]!.id,
      reason: 'Retry after correcting the terminal failure.',
    });
    await vi.waitFor(() => expect(statuses).toContain('completed'));
    gate.release();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(statuses.at(-1)).toBe('completed');
    unsubscribe();
    await manager.close();
  });

  it('retries terminal failed Deliveries and records the retry resolution', async () => {
    const send = vi
      .fn<
        (input: NotificationProviderSendInput) => Promise<ProviderSendResult>
      >()
      .mockResolvedValueOnce({
        status: 'failed',
        disposition: 'never',
        error: { message: 'rejected', category: 'provider' },
      })
      .mockResolvedValueOnce({ status: 'accepted' });
    const { manager, store } = createEmailManagerHarness({ send });
    const sent = await manager.send({
      idempotencyKey: 'retry-failed-1',
      messages: { email: { body: 'Retry failure.' } },
    });

    expect(sent.deliveries[0]).toMatchObject({ status: 'failed' });
    await expect(
      manager.retryDelivery({
        deliveryId: sent.deliveries[0]!.id,
        reason: '   ',
      }),
    ).rejects.toMatchObject({
      code: 'NOTIFICATION_DELIVERY_RETRY_NOT_ALLOWED',
      message: expect.stringContaining('reason'),
    });
    await expect(
      manager.retryDelivery({
        deliveryId: sent.deliveries[0]!.id,
        reason: 'Retry after correcting the terminal failure.',
      }),
    ).resolves.toMatchObject({ status: 'accepted', attemptCount: 2 });
    await expect(
      store.listAttempts(sent.deliveries[0]!.id),
    ).resolves.toMatchObject([
      { sequence: 1, retryResolution: undefined },
      {
        sequence: 2,
        retryResolution: { type: 'terminal_failure' },
      },
    ]);

    await manager.close();
  });

  it('uses the configured retry policy and exposes retrying status', async () => {
    const send = vi
      .fn<
        (input: NotificationProviderSendInput) => Promise<ProviderSendResult>
      >()
      .mockResolvedValueOnce({
        status: 'failed',
        disposition: 'same_provider',
        error: { message: 'temporarily unavailable', category: 'provider' },
      })
      .mockResolvedValueOnce({ status: 'accepted' });
    const { manager } = createEmailManagerHarness({
      send,
      retry: { maxAttempts: 2, intervalMs: 5_000 },
    });

    const sent = await manager.send({
      idempotencyKey: 'retrying-status-1',
      messages: { email: { body: 'Retry later.' } },
    });

    expect(sent).toMatchObject({
      status: 'processing',
      deliveries: [{ status: 'retrying', nextRunAt: expect.any(String) }],
    });

    await manager.close();
  });

  it('dispatches a scheduled retry at nextRunAt without waiting for reconciliation', async () => {
    vi.useFakeTimers();
    try {
      const send = vi
        .fn<
          (input: NotificationProviderSendInput) => Promise<ProviderSendResult>
        >()
        .mockResolvedValueOnce({
          status: 'failed',
          disposition: 'same_provider',
          error: { message: 'temporarily unavailable', category: 'provider' },
        })
        .mockResolvedValueOnce({ status: 'accepted' });
      const { manager } = createEmailManagerHarness({
        send,
        reconcileIntervalMs: 60_000,
        retry: { maxAttempts: 2, intervalMs: 1_000 },
      });

      const sent = await manager.send({
        idempotencyKey: 'retry-timer-1',
        messages: { email: { body: 'Retry on schedule.' } },
      });
      expect(sent.deliveries[0]).toMatchObject({ status: 'retrying' });
      expect(send).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(999);
      expect(send).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(send).toHaveBeenCalledTimes(2);
      await expect(
        manager.getNotification(sent.notificationId),
      ).resolves.toMatchObject({
        status: 'completed',
        deliveries: [{ status: 'accepted', attemptCount: 2 }],
      });

      await manager.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retry an unknown Delivery', async () => {
    const send = vi
      .fn<
        (input: NotificationProviderSendInput) => Promise<ProviderSendResult>
      >()
      .mockResolvedValueOnce({
        status: 'submission_unknown',
        error: { message: 'connection lost', category: 'network' },
      });
    const { manager } = createEmailManagerHarness({ send });
    const sent = await manager.send({
      idempotencyKey: 'retry-unknown-unsafe-1',
      messages: { email: { body: 'Unknown result.' } },
    });
    expect(sent.deliveries[0]).toMatchObject({ status: 'unknown' });
    await expect(
      manager.retryDelivery({
        deliveryId: sent.deliveries[0]!.id,
        reason: 'Provider result must be confirmed externally first.',
      }),
    ).rejects.toMatchObject({
      code: 'NOTIFICATION_DELIVERY_RETRY_NOT_ALLOWED',
    });

    await manager.close();
  });
});

function createEmailManagerHarness(input: {
  readonly send: (
    input: NotificationProviderSendInput,
  ) => Promise<ProviderSendResult>;
  readonly capabilities?: NotificationProviderCapabilities;
  readonly store?: FakeNotificationStore;
  readonly prepare?: (message: object) => object | Promise<object>;
  readonly retry?: {
    readonly maxAttempts?: number;
    readonly intervalMs?: number;
  };
  readonly reconcileIntervalMs?: number;
}) {
  const store = input.store ?? new FakeNotificationStore();
  const manager = createNotificationManager({
    database: {} as DatabaseManager,
    executor: new InlineJobExecutor(),
    logger: createLogger({ level: 'silent' }),
    config: {
      channels: { email: { provider: 'fake' } },
      retry: input.retry,
    },
    reconcileIntervalMs: input.reconcileIntervalMs,
    store,
  });
  manager.registry
    .registerChannel({
      type: 'email',
      async createChannel() {
        return {
          type: 'email',
          validateMessage(message: object) {
            return { message, recipients: [{ address: 'buyer@example.com' }] };
          },
          async prepare({ message }): Promise<object> {
            return input.prepare ? input.prepare(message) : message;
          },
        };
      },
    })
    .registerProvider({
      type: 'fake',
      messageType: 'email',
      capabilities: input.capabilities,
      async createProvider(_context, config) {
        return {
          type: config.provider,
          capabilities: input.capabilities,
          send: input.send,
        };
      },
    });
  return { manager, store };
}

class DelayedLogNotificationStore extends FakeNotificationStore {
  private nextLogRead?: {
    readonly captured: () => void;
    readonly released: Promise<void>;
  };

  delayNextLogRead(): {
    readonly captured: Promise<void>;
    readonly release: () => void;
  } {
    let capture!: () => void;
    let release!: () => void;
    const captured = new Promise<void>((resolve) => {
      capture = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.nextLogRead = { captured: capture, released };
    return { captured, release };
  }

  override async getLog(id: string) {
    const gate = this.nextLogRead;
    if (gate) this.nextLogRead = undefined;
    const snapshot = await super.getLog(id);
    if (gate) {
      gate.captured();
      await gate.released;
    }
    return snapshot;
  }
}

class StaleLogStatusNotificationStore extends FakeNotificationStore {
  override async getLog(id: string) {
    const log = await super.getLog(id);
    return log ? { ...log, status: 'pending' as const } : undefined;
  }
}
