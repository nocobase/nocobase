// @vitest-environment node
import { createLogger } from '@nocobase/logging';
import { expect, it, vi } from 'vitest';
import type {
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendResult,
  ValidatedChannelMessage,
} from '../server/channel-type.js';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import { createNotificationTestDatabase } from './helpers/database.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

it.each(['constructor', 'toString', '__proto__'])(
  'persists and delivers a custom channel with type %s',
  async (type) => {
    const db = await createNotificationTestDatabase();
    const send = vi.fn(async (): Promise<ChannelSendResult> => ({
      status: 'accepted',
    }));
    class CustomChannel implements ChannelInstance {
      static readonly type = type;
      validateMessage(input: unknown): ValidatedChannelMessage {
        if (!input || typeof input !== 'object')
          throw new Error('Message must be an object.');
        return { message: input, recipients: [{ id: 'recipient' }] };
      }
      async prepare({ message }: ChannelPreparationInput): Promise<object> {
        return message;
      }
      send = send;
    }
    const manager = createNotificationManager({
      database: db.database,
      executor: new InlineJobExecutor(),
      logger: createLogger({ level: 'silent' }),
      registry: createNotificationRegistry().registerChannelType(CustomChannel),
      config: { channels: { custom: { type } } },
    });
    try {
      const result = await manager.send({
        idempotencyKey: `custom:${type}`,
        messages: { custom: { text: 'Hello' } },
      });
      expect(send).toHaveBeenCalledOnce();
      await expect(
        manager.getNotification(result.notificationId),
      ).resolves.toMatchObject({
        status: 'completed',
        deliveries: [
          {
            status: 'accepted',
            channelName: 'custom',
            channelType: type,
            provider: { type },
          },
        ],
      });
    } finally {
      await manager.close();
      await db.destroy();
    }
  },
);
