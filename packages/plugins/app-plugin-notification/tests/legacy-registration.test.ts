import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { expect, it, vi } from 'vitest';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import type {
  NotificationConfig,
  ProviderSendResult,
} from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

function harness(
  config: NotificationConfig,
  store = new FakeNotificationStore(),
) {
  const executor = new InlineJobExecutor();
  const sent = vi.fn(
    async (
      _provider: string,
      _config: object,
      _message: object,
    ): Promise<ProviderSendResult> => ({ status: 'accepted' }),
  );
  const registry = createNotificationRegistry().registerChannel({
    type: 'email',
    async createChannel() {
      return {
        type: 'email',
        validateMessage(value: unknown) {
          const message = value as {
            to: string | readonly string[];
            text: string;
          };
          const recipients =
            typeof message?.to === 'string' ? [message.to] : message?.to;
          if (
            !Array.isArray(recipients) ||
            !recipients.length ||
            recipients.some(
              (to: unknown) => typeof to !== 'string' || !to.includes('@'),
            ) ||
            typeof message.text !== 'string'
          )
            throw new Error('Invalid message');
          return {
            message,
            recipients: recipients.map((address: string) => ({ address })),
          };
        },
        async prepare({ recipient, message }) {
          return { ...message, ...recipient };
        },
      };
    },
  });
  for (const type of ['fake', 'replacement'])
    registry.registerProvider({
      type,
      messageType: 'email',
      async createProvider(_context, providerConfig) {
        return {
          type,
          send: async ({ message }) => sent(type, providerConfig, message),
        };
      },
    });
  const manager = createNotificationManager({
    database: {} as DatabaseManager,
    executor,
    store,
    registry,
    logger: createLogger({ level: 'silent' }),
    config,
  });
  return {
    manager,
    executor,
    registry,
    sent,
    store,
    async close() {
      await manager.close();
    },
  };
}

it('requires globally unique Provider identifiers', () => {
  const registry = createNotificationRegistry();
  const definition = {
    type: 'smtp',
    messageType: 'email',
    async createProvider(): Promise<never> {
      throw new Error('unused');
    },
  };
  registry.registerProvider(definition);
  expect(() =>
    registry.registerProvider({ ...definition, messageType: 'im' }),
  ).toThrow('already registered');
});

it('closes already-created Providers when a later Channel fails startup', async () => {
  const h = harness({
    channels: {
      working: { provider: 'working' },
      broken: { provider: 'broken' },
    },
  });
  const close = vi.fn(async () => undefined);
  h.registry.registerProvider({
    type: 'working',
    messageType: 'email',
    async createProvider() {
      return {
        type: 'working',
        close,
        async send() {
          return { status: 'accepted' };
        },
      };
    },
  });
  h.registry.registerProvider({
    type: 'broken',
    messageType: 'email',
    async createProvider() {
      throw new Error('startup failed');
    },
  });
  try {
    await expect(h.manager.start()).rejects.toThrow('startup failed');
    expect(close).toHaveBeenCalledOnce();
  } finally {
    await h.close();
  }
});

it('normalizes type for legacy extension factories', async () => {
  const config = {
    channels: { email: { type: 'fake', from: 'system@example.com' } },
  };
  const h = harness(config);
  try {
    await h.manager.sendTransient({
      channel: 'email',
      message: { to: 'a@example.com', text: 'hello' },
    });
    expect(h.sent.mock.calls[0][1]).toEqual({
      provider: 'fake',
      from: 'system@example.com',
    });
  } finally {
    await h.close();
  }
});
