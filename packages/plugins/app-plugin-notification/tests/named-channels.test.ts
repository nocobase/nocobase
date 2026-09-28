import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { createQueueManager, createSyncQueueConfig } from '@nocobase/queue';
import { expect, it, vi } from 'vitest';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import type {
  NotificationConfig,
  ProviderSendResult,
} from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';

function harness(
  config: NotificationConfig,
  store = new FakeNotificationStore(),
) {
  const queue = createQueueManager(createSyncQueueConfig());
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
    queue,
    store,
    registry,
    logger: createLogger({ level: 'silent' }),
    config,
  });
  return {
    manager,
    registry,
    sent,
    store,
    async close() {
      await manager.close();
      await queue.close();
    },
  };
}

it('isolates Channel configurations and sends each native address independently', async () => {
  const config = {
    channels: {
      system: { provider: 'fake', from: 'system@example.com' },
      marketing: { provider: 'fake', from: 'marketing@example.com' },
    },
  };
  const h = harness(config);
  try {
    const result = await h.manager.send({
      idempotencyKey: 'fanout',
      messages: {
        system: { to: ['a@example.com', 'b@example.com'], text: 'system' },
        marketing: { to: 'a@example.com', text: 'offer' },
      },
    });
    expect(result.deliveries).toHaveLength(3);
    expect(
      h.sent.mock.calls.map(([, cfg, message]) => ({ cfg, message })),
    ).toEqual([
      {
        cfg: config.channels.system,
        message: {
          to: ['a@example.com', 'b@example.com'],
          text: 'system',
          address: 'a@example.com',
        },
      },
      {
        cfg: config.channels.system,
        message: {
          to: ['a@example.com', 'b@example.com'],
          text: 'system',
          address: 'b@example.com',
        },
      },
      {
        cfg: config.channels.marketing,
        message: {
          to: 'a@example.com',
          text: 'offer',
          address: 'a@example.com',
        },
      },
    ]);
    expect(
      result.deliveries.every((delivery) => !('name' in delivery.provider)),
    ).toBe(true);
  } finally {
    await h.close();
  }
});

it.each(['missing', 'disabled', 'invalid'])(
  'rejects the entire request before storage or delivery: %s',
  async (kind) => {
    const h = harness({
      channels: {
        good: { provider: 'fake' },
        disabled: { provider: 'fake', enabled: false },
        invalid: { provider: 'fake' },
      },
    });
    const create = vi.spyOn(h.store, 'create');
    try {
      const messages = {
        good: { to: 'a@example.com', text: 'valid' },
        [kind]: {
          to: kind === 'invalid' ? [] : 'b@example.com',
          text: 'other',
        },
      };
      await expect(
        h.manager.send({ idempotencyKey: kind, messages }),
      ).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
      expect(h.sent).not.toHaveBeenCalled();
    } finally {
      await h.close();
    }
  },
);

it('continues other deliveries after an actual provider failure', async () => {
  const h = harness({
    channels: { first: { provider: 'fake' }, second: { provider: 'fake' } },
  });
  h.sent.mockResolvedValueOnce({
    status: 'failed',
    disposition: 'never',
    error: { message: 'rejected' },
  });
  try {
    const result = await h.manager.send({
      idempotencyKey: 'partial',
      messages: {
        first: { to: 'a@example.com', text: 'one' },
        second: { to: 'b@example.com', text: 'two' },
      },
    });
    expect(result.deliveries.map((delivery) => delivery.status)).toEqual([
      'failed',
      'accepted',
    ]);
  } finally {
    await h.close();
  }
});

it.each(['removed', 'disabled', 'changed'])(
  'rejects manual retry when original Channel is %s',
  async (kind) => {
    const first = harness({ channels: { original: { provider: 'fake' } } });
    first.sent.mockResolvedValue({
      status: 'failed',
      disposition: 'never',
      error: { message: 'rejected' },
    });
    const result = await first.manager.send({
      idempotencyKey: kind,
      messages: { original: { to: 'a@example.com', text: 'hello' } },
    });
    await first.close();
    const config: NotificationConfig = {
      channels:
        kind === 'removed'
          ? { other: { provider: 'fake' } }
          : {
              original: {
                provider: kind === 'changed' ? 'replacement' : 'fake',
                enabled: kind !== 'disabled',
              },
            },
    };
    const current = harness(config, first.store);
    try {
      expect(
        (await current.manager.getNotification(result.notificationId))
          ?.deliveries[0].status,
      ).toBe('failed');
      await expect(
        current.manager.retryDelivery({
          deliveryId: result.deliveries[0].id,
          reason: 'retry',
        }),
      ).rejects.toThrow();
      expect(current.sent).not.toHaveBeenCalled();
    } finally {
      await current.close();
    }
  },
);

it.each(['', ' padded', 'padded ', 'x'.repeat(101)])(
  'rejects invalid Channel name %j',
  (name) => {
    const registry = createNotificationRegistry();
    expect(() =>
      registry.validate({
        channels: { [name]: { provider: 'fake', enabled: false } },
      }),
    ).toThrow('Channel names');
  },
);

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

it('allows disabled Channels whose Provider is not registered', () => {
  const registry = createNotificationRegistry();
  expect(() =>
    registry.validate({
      channels: { disabled: { provider: 'missing', enabled: false } },
    }),
  ).not.toThrow();
});

it.each([
  {
    name: 'missing Provider',
    config: { channels: { email: {} } } as unknown as NotificationConfig,
    message: 'Notification Channel "email" is missing a Provider.',
  },
  {
    name: 'unregistered Provider',
    config: { channels: { email: { provider: 'smtp' } } },
    message: 'Notification Channel "email" Provider "smtp" is not registered.',
  },
])(
  'reports the Channel for startup with a $name',
  async ({ config, message }) => {
    const h = harness(config);
    try {
      await expect(h.manager.start()).rejects.toThrow(message);
    } finally {
      await h.close();
    }
  },
);

it('does not start persistence or queue resources with an empty Channel map', async () => {
  const h = harness({ channels: {} });
  const listReady = vi.spyOn(h.store, 'listReady');
  try {
    await h.manager.start();
    expect(listReady).not.toHaveBeenCalled();
  } finally {
    await h.close();
  }
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
