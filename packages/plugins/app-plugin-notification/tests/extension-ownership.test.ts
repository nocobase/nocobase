import { expect, it, vi } from 'vitest';
import { createLogger } from '@nocobase/logging';
import type { DatabaseManager } from '@nocobase/db';
import {
  SendingManager,
  SendingRegistry,
  registerBuiltInSendingProviders,
} from '@nocobase/sending';
import { NotificationRegistry } from '../server/registry.js';
import { createNotificationManager } from '../server/manager.js';
import type { NotificationChannelDefinition } from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

function customChannel(type: string) {
  const validate = vi.fn((input: unknown) => {
    if (
      !input ||
      typeof input !== 'object' ||
      Reflect.get(input, 'valid') !== true
    )
      throw new Error('Custom validation failed.');
    return { message: input, recipients: [{}] };
  });
  const prepare = vi.fn(async () => ({ subject: 'Custom prepared subject' }));
  const definition: NotificationChannelDefinition = {
    type,
    createChannel: async () => ({ type, validateMessage: validate, prepare }),
  };
  return { definition, validate, prepare };
}

it.each(['email', 'im'])(
  'retains legacy custom %s validation and preparation in the shared executable owner',
  async (type) => {
    const core = new SendingRegistry();
    registerBuiltInSendingProviders(core);
    const registry = new NotificationRegistry(core);
    const custom = customChannel(type);
    registry.registerChannel(custom.definition);
    const send = vi.fn(async () => ({ status: 'accepted' as const }));
    registry.registerProvider({
      type: 'custom',
      messageType: type,
      createProvider: async () => ({ type: 'custom', send }),
    });
    // Built-in compatibility fallbacks and their test metadata cannot replace custom execution.
    registry.registerChannel(
      {
        type,
        test: { label: 'Default form', fields: [], toSendInput: () => ({}) },
        createChannel: async () => {
          throw new Error('Default execution selected.');
        },
      },
      { fallback: true },
    );
    const config = { channels: { external: { provider: 'custom' } } };
    const sending = new SendingManager({
      registry: core,
      config,
      logger: createLogger({ level: 'silent' }),
    });
    const manager = createNotificationManager({
      registry,
      config,
      sending,
      database: {} as DatabaseManager,
      executor: new InlineJobExecutor(),
      store: new FakeNotificationStore(),
      logger: createLogger({ level: 'silent' }),
    });
    try {
      await manager.sendTransient({
        channel: 'external',
        message: { valid: true, subject: 'Original subject' },
      });
      expect(custom.validate).toHaveBeenCalledTimes(1);
      expect(custom.prepare).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: { subject: 'Custom prepared subject' },
        }),
      );
      await expect(
        manager.sendTransient({
          channel: 'external',
          message: { valid: false },
        }),
      ).rejects.toThrow('Custom validation failed.');
      expect(custom.prepare).toHaveBeenCalledTimes(1);
      expect(manager.listTestTargets()).toEqual([]); // An explicit custom channel without a form stays without one.
      expect(core.channel(type)).not.toHaveProperty('test');
    } finally {
      await manager.close();
      await sending.close();
    }
  },
);

it.each(['core-first', 'legacy-first'])(
  'rejects explicit channel/provider conflicts in %s order',
  (order) => {
    const core = new SendingRegistry();
    registerBuiltInSendingProviders(core);
    const registry = new NotificationRegistry(core);
    const channel = customChannel('email').definition;
    const provider = {
      type: 'custom',
      messageType: 'email',
      createProvider: async () => ({
        type: 'custom',
        send: async () => ({ status: 'accepted' as const }),
      }),
    };
    if (order === 'core-first') {
      core.registerChannel(channel);
      core.registerProvider(provider);
      expect(() => registry.registerChannel(channel)).toThrow(
        'already registered',
      );
      expect(() => registry.registerProvider(provider)).toThrow(
        'already registered',
      );
    } else {
      registry.registerChannel(channel);
      registry.registerProvider(provider);
      expect(() => core.registerChannel(channel)).toThrow('already registered');
      expect(() => core.registerProvider(provider)).toThrow(
        'already registered',
      );
    }
  },
);

it.each(['core-first', 'legacy-first'])(
  'rejects separate-layer ownership conflicts in %s order',
  (order) => {
    const core = new SendingRegistry();
    const registry = new NotificationRegistry(core);
    const channel = customChannel('sms').definition;
    if (order === 'core-first') {
      core.registerChannel(channel);
      expect(() => registry.registerChannel(channel)).toThrow('already owned');
    } else {
      registry.registerChannel(channel);
      core.registerChannel(channel);
      expect(() => registry.validate({ channels: {} })).toThrow(
        'conflicting owners',
      );
    }
  },
);

it('allows framework fallbacks in either order and forbids executable mutation after activation', () => {
  const core = new SendingRegistry();
  const registry = new NotificationRegistry(core);
  const custom = customChannel('email').definition;
  registry.registerChannel(custom);
  registerBuiltInSendingProviders(core);
  core.seal();
  expect(() => registry.registerChannel(custom)).toThrow('cannot change');
});

it('attaches test metadata to a sending-only explicit definition without registering another executor', async () => {
  const core = new SendingRegistry();
  registerBuiltInSendingProviders(core);
  const custom = customChannel('email');
  core.registerChannel(custom.definition);
  const send = vi.fn(async () => ({ status: 'accepted' as const }));
  core.registerProvider({
    type: 'custom',
    messageType: 'email',
    createProvider: async () => ({ type: 'custom', send }),
  });
  const registry = new NotificationRegistry(core);
  registry.registerChannelTest('email', {
    label: 'Application form',
    fields: [],
    toSendInput: () => ({ valid: true }),
  });
  registry.registerProviderLabel('custom', 'Application provider');
  const config = { channels: { external: { provider: 'custom' } } };
  const sending = new SendingManager({
    registry: core,
    config,
    logger: createLogger({ level: 'silent' }),
  });
  const manager = createNotificationManager({
    registry,
    config,
    sending,
    database: {} as DatabaseManager,
    executor: new InlineJobExecutor(),
    store: new FakeNotificationStore(),
    logger: createLogger({ level: 'silent' }),
  });
  try {
    expect(manager.listTestTargets()[0]?.provider.label).toBe(
      'Application provider',
    );
    await manager.sendTransient({
      channel: 'external',
      message: { valid: true },
    });
    await sending.send({ channel: 'external', message: { valid: true } });
    expect(custom.prepare).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(2);
  } finally {
    await manager.close();
    await sending.close();
  }
});
