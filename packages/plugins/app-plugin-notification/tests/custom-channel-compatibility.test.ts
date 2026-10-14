import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { expect, it, vi } from 'vitest';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

it.each(['email', 'im'])(
  'keeps custom %s validation and preparation on the notification path',
  async (type) => {
    const validate = vi.fn((message: object) => ({
      message,
      recipients: [{ address: 'synthetic-native-address' }],
    }));
    const prepare = vi.fn(async () => ({ text: 'custom-prepared-message' }));
    const send = vi.fn(async () => ({ status: 'accepted' as const }));
    const registry = createNotificationRegistry()
      .registerChannel({
        type,
        async createChannel() {
          return { type, validateMessage: validate, prepare };
        },
      })
      .registerProvider({
        type: 'custom-provider',
        messageType: type,
        async createProvider() {
          return { type: 'custom-provider', send };
        },
      });
    const manager = createNotificationManager({
      database: {} as DatabaseManager,
      registry,
      store: new FakeNotificationStore(),
      executor: new InlineJobExecutor(),
      logger: createLogger({ level: 'silent' }),
      config: { channels: { custom: { provider: 'custom-provider' } } },
    });
    try {
      expect(
        (
          await manager.sendTransient({
            channel: 'custom',
            message: { text: 'original' },
          })
        )[0]?.status,
      ).toBe('accepted');
      expect(validate).toHaveBeenCalledOnce();
      expect(prepare).toHaveBeenCalledOnce();
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: { text: 'custom-prepared-message' },
        }),
      );
    } finally {
      await manager.close();
    }
  },
);
