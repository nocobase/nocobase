import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import {
  ServiceContainer,
  createServiceToken,
} from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';
import type {
  ChannelConfig,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
  ChannelTypeClass,
  ValidatedChannelMessage,
} from '../server/channel-type.js';
import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import type { NotificationConfigInput } from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

interface Message {
  readonly to: string;
  readonly text: string;
}
interface Recipient {
  readonly address: string;
}
interface Config extends ChannelConfig {
  readonly type: 'custom';
  readonly prefix: string;
}
const dependency = createServiceToken<string>('channel-test');

function harness(channels: NotificationConfigInput['channels']) {
  const initialized = vi.fn(async (_channel: string): Promise<void> => {});
  const closed = vi.fn(async (_channel: string): Promise<void> => {});
  const sent = vi.fn(
    async (_input: ChannelSendInput<Message>): Promise<ChannelSendResult> => ({
      status: 'accepted',
    }),
  );
  const constructed = vi.fn();
  class CustomChannel implements ChannelInstance<Message, Recipient, Message> {
    static readonly type = 'custom';
    static validateConfig(config: Config): void {
      if (!config.prefix) throw new Error('prefix is required');
    }
    constructor(
      private readonly context: ChannelContext,
      private readonly config: Config,
    ) {
      constructed(context, config);
    }
    async initialize(): Promise<void> {
      expect(this.context.container.resolve(dependency)).toBe('dependency');
      await initialized(this.context.channelName);
    }
    validateMessage(
      input: unknown,
    ): ValidatedChannelMessage<Message, Recipient> {
      const message = input as Message;
      if (!message?.to || !message.text) throw new Error('Invalid message');
      return { message, recipients: [{ address: message.to }] };
    }
    async prepare(
      input: ChannelPreparationInput<Message, Recipient>,
    ): Promise<Message> {
      return {
        to: input.recipient.address,
        text: this.config.prefix + input.message.text,
      };
    }
    send(input: ChannelSendInput<Message>): Promise<ChannelSendResult> {
      return sent(input);
    }
    close(): Promise<void> {
      return closed(this.context.channelName);
    }
  }
  const checked: ChannelTypeClass<Config, Message, Recipient, Message> =
    CustomChannel;
  const registry = createNotificationRegistry().registerChannelType(checked);
  const container = new ServiceContainer();
  container.instance(dependency, 'dependency');
  const store = new FakeNotificationStore();
  const manager = createNotificationManager({
    database: {} as DatabaseManager,
    executor: new InlineJobExecutor(),
    logger: createLogger({ level: 'silent' }),
    config: { channels },
    registry,
    container,
    store,
  });
  return {
    manager,
    registry,
    CustomChannel,
    container,
    store,
    initialized,
    constructed,
    sent,
    closed,
  };
}

describe('class channel types', () => {
  it('normalizes aliases, isolates named instances, and keeps durable send deduplication', async () => {
    const config = {
      first: { type: 'custom', prefix: 'A:' },
      second: { provider: 'custom', prefix: 'B:' },
      third: { type: 'custom', provider: 'custom', prefix: 'C:' },
    };
    const h = harness(config);
    try {
      const input = {
        idempotencyKey: 'class-send',
        messages: Object.fromEntries(
          Object.keys(config).map((name) => [
            name,
            { to: 'recipient', text: 'hello' },
          ]),
        ),
      };
      const result = await h.manager.send(input);
      expect(result.deliveries).toHaveLength(3);
      expect(
        result.deliveries.every((delivery) => delivery.status === 'accepted'),
      ).toBe(true);
      expect(h.sent.mock.calls.map(([input]) => input.message.text)).toEqual([
        'A:hello',
        'B:hello',
        'C:hello',
      ]);
      expect(
        h.constructed.mock.calls.map(([context, config]) => [
          context.channelName,
          config,
        ]),
      ).toEqual(
        ['first', 'second', 'third'].map((name, index) => [
          name,
          { type: 'custom', prefix: `${'ABC'[index]}:` },
        ]),
      );
      expect((await h.manager.send(input)).deduplicated).toBe(true);
      expect(h.sent).toHaveBeenCalledTimes(3);
    } finally {
      await h.manager.close();
    }
    expect(h.closed.mock.calls).toEqual([['third'], ['second'], ['first']]);
  });

  it('initializes once under concurrency and drains transient sends before closing', async () => {
    const h = harness({
      first: { type: 'custom', prefix: 'A:' },
    } as NotificationConfigInput['channels']);
    const ready = Promise.withResolvers<void>();
    const delivered = Promise.withResolvers<ChannelSendResult>();
    h.initialized.mockImplementation(() => ready.promise);
    h.sent.mockImplementation(() => delivered.promise);
    const input = {
      channel: 'first',
      message: { to: 'recipient', text: 'hello' },
    };
    const sends = [
      h.manager.sendTransient(input),
      h.manager.sendTransient(input),
    ];
    await vi.waitFor(() => expect(h.initialized).toHaveBeenCalledOnce());
    const closing = h.manager.close();
    await expect(h.manager.sendTransient(input)).rejects.toThrow('closing');
    expect(h.closed).not.toHaveBeenCalled();
    ready.resolve();
    await vi.waitFor(() => expect(h.sent).toHaveBeenCalledTimes(2));
    expect(h.closed).not.toHaveBeenCalled();
    delivered.resolve({ status: 'accepted' });
    expect(await Promise.all(sends)).toEqual([
      [{ status: 'accepted' }],
      [{ status: 'accepted' }],
    ]);
    await closing;
    expect(h.closed).toHaveBeenCalledExactlyOnceWith('first');
    expect(await h.store.getLogByIdempotencyKey('class-send')).toBeUndefined();
  });

  it('drains an accepted manual retry before shutting down the executor and channel', async () => {
    const h = harness({
      first: { type: 'custom', prefix: 'A:' },
    } as NotificationConfigInput['channels']);
    h.sent.mockResolvedValueOnce({
      status: 'failed',
      disposition: 'never',
      error: { message: 'Rejected' },
    });
    const first = await h.manager.send({
      idempotencyKey: 'retry-drain',
      messages: { first: { to: 'recipient', text: 'hello' } },
    });
    const gate = Promise.withResolvers<void>();
    const original = h.store.retryDelivery.bind(h.store);
    const retry = vi
      .spyOn(h.store, 'retryDelivery')
      .mockImplementation(async (...args) => {
        await gate.promise;
        return original(...args);
      });
    const retrying = h.manager.retryDelivery({
      deliveryId: first.deliveries[0].id,
      reason: 'Repaired',
    });
    await vi.waitFor(() => expect(retry).toHaveBeenCalledOnce());
    const closing = h.manager.close();
    expect(h.closed).not.toHaveBeenCalled();
    gate.resolve();
    expect((await retrying).status).toBe('accepted');
    await closing;
    expect(h.closed).toHaveBeenCalledOnce();
    expect(h.sent).toHaveBeenCalledTimes(2);
  });

  it('closes partial initialization and retries with a fresh instance', async () => {
    const h = harness({
      first: { type: 'custom', prefix: 'A:' },
    } as NotificationConfigInput['channels']);
    h.initialized.mockRejectedValueOnce(
      new Error('temporary initialization failure'),
    );
    try {
      const input = {
        channel: 'first',
        message: { to: 'recipient', text: 'hello' },
      };
      await expect(h.manager.sendTransient(input)).rejects.toThrow(
        'temporary initialization failure',
      );
      expect(h.closed).toHaveBeenCalledOnce();
      await expect(h.manager.sendTransient(input)).resolves.toEqual([
        { status: 'accepted' },
      ]);
      expect(h.constructed).toHaveBeenCalledTimes(2);
    } finally {
      await h.manager.close();
    }
    expect(h.closed).toHaveBeenCalledTimes(2);
  });

  it('does not redeliver an unknown submission', async () => {
    const h = harness({
      first: { type: 'custom', prefix: 'A:' },
    } as NotificationConfigInput['channels']);
    h.sent.mockResolvedValue({
      status: 'submission_unknown',
      error: { category: 'network', message: 'Connection lost' },
    });
    try {
      const input = {
        idempotencyKey: 'unknown',
        messages: { first: { to: 'recipient', text: 'hello' } },
      };
      expect((await h.manager.send(input)).deliveries[0].status).toBe(
        'unknown',
      );
      await h.manager.send(input);
      await h.manager.reconcile();
      expect(h.sent).toHaveBeenCalledOnce();
    } finally {
      await h.manager.close();
    }
  });

  it('rejects invalid aliases and registration collisions before initialization', () => {
    const h = harness({});
    for (const config of [
      { type: 'custom', provider: 'other' },
      { type: '' },
      { type: ' custom' },
      { type: 'custom', provider: '' },
      { type: 'custom', provider: 'other', enabled: false },
    ])
      expect(() =>
        h.registry.validate({ channels: { first: config } }),
      ).toThrow();
    expect(() => h.registry.registerChannelType(h.CustomChannel)).toThrow(
      'already registered',
    );
    const legacy = {
      type: 'custom',
      messageType: 'legacy',
      async createProvider(): Promise<never> {
        throw new Error('unused');
      },
    };
    expect(() => h.registry.registerProvider(legacy)).toThrow(
      'already registered',
    );
    expect(() =>
      createNotificationRegistry()
        .registerProvider(legacy)
        .registerChannelType(h.CustomChannel),
    ).toThrow('already registered');
    expect(h.constructed).not.toHaveBeenCalled();
  });
});
