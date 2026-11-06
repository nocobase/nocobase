import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { expect, it, vi } from 'vitest';
import type {
  ChannelInstance,
  ChannelSendResult,
} from '../server/channel-type.js';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

it.each([
  ['smtp', 'email'],
  ['resend', 'email'],
  ['feishu-webhook', 'im'],
  ['dingtalk-webhook', 'im'],
  ['in-app', 'in-app'],
  ['web-push', 'web-push'],
])(
  'retries historical %s deliveries after switching to a class and type config',
  async (type, family) => {
    const store = new FakeNotificationStore();
    const validateMessage = (message: unknown) => ({
      message: message as object,
      recipients: [{ id: 'recipient' }],
    });
    const legacy = createNotificationRegistry()
      .registerChannel({
        type: family,
        async createChannel() {
          return {
            type: family,
            validateMessage,
            async prepare({ message }) {
              return message;
            },
          };
        },
      })
      .registerProvider({
        type,
        messageType: family,
        async createProvider() {
          return {
            type,
            async send(): Promise<ChannelSendResult> {
              return {
                status: 'failed',
                disposition: 'never',
                error: { message: 'Rejected' },
              };
            },
          };
        },
      });
    const options = {
      database: {} as DatabaseManager,
      store,
      logger: createLogger({ level: 'silent' }),
    };
    const old = createNotificationManager({
      ...options,
      executor: new InlineJobExecutor(),
      registry: legacy,
      config: { channels: { alerts: { provider: type } } },
    });
    const input = {
      idempotencyKey: 'historical',
      messages: { alerts: { text: 'Hello' } },
    };
    const original = await old.send(input);
    await old.close();
    const send = vi.fn(async (): Promise<ChannelSendResult> => ({
      status: 'accepted',
    }));
    class Replacement implements ChannelInstance {
      static readonly type = type;
      validateMessage = validateMessage;
      async prepare({ message }: { message: object }): Promise<object> {
        return message;
      }
      send = send;
    }
    const current = createNotificationManager({
      ...options,
      executor: new InlineJobExecutor(),
      registry: createNotificationRegistry().registerChannelType(Replacement),
      config: { channels: { alerts: { type } } },
    });
    try {
      const deduplicated = await current.send(input);
      expect(deduplicated.deduplicated).toBe(true);
      expect(deduplicated.notificationId).toBe(original.notificationId);
      expect(send).not.toHaveBeenCalled();
      const retried = await current.retryDelivery({
        deliveryId: original.deliveries[0].id,
        reason: 'Configuration repaired',
      });
      expect(retried).toMatchObject({
        status: 'accepted',
        channelName: 'alerts',
        channelType: family,
        provider: { type },
      });
      expect(send).toHaveBeenCalledOnce();
    } finally {
      await current.close();
    }
  },
);
