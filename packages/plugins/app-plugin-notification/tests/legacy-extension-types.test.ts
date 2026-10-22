import { expect, expectTypeOf, it } from 'vitest';
import { AppConfig } from '@nocobase/app-server/config';
import type {
  NotificationChannelConfig,
  NotificationChannelDefinition,
  NotificationConfig,
  NotificationConfigInput,
  NotificationProviderConfig,
} from '../server/index.js';

interface LegacyConfig extends NotificationChannelConfig {
  readonly endpoint: string;
}

it('preserves provider-based types for legacy extension callbacks', () => {
  expectTypeOf<NotificationChannelConfig>().toEqualTypeOf<NotificationProviderConfig>();
  expectTypeOf<LegacyConfig['provider']>().toEqualTypeOf<string>();

  const definition: NotificationChannelDefinition = {
    type: 'legacy',
    validateConfig(config) {
      expectTypeOf(config.provider).toEqualTypeOf<string>();
    },
    async createChannel(_context, config) {
      expectTypeOf(config.provider).toEqualTypeOf<string>();
      return {
        type: 'legacy',
        validateMessage() {
          return { message: { provider: config.provider }, recipients: [{}] };
        },
        async prepare({ message }) {
          return message;
        },
      };
    },
  };

  const config: NotificationConfigInput = {
    channels: {
      legacy: { provider: 'custom' },
      current: { type: 'custom' },
      aliases: { type: 'custom', provider: 'custom' },
    },
  };
  expect(config.channels.current).toEqual({ type: 'custom' });
  expect(() =>
    definition.validateConfig?.({ provider: 'custom' }),
  ).not.toThrow();
});

it('preserves legacy config reads and provider-only defaults while accepting type-only input', async () => {
  const defaults: NotificationConfig = {
    channels: { legacy: { provider: 'in-app' } },
  };
  const input: NotificationConfigInput = {
    channels: { current: { type: 'in-app' } },
  };
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ notification: defaults });
  config.mergeDefaults({ notification: input });
  const notification = config.get<NotificationConfig>('notification')!;
  expectTypeOf(notification.channels).toExtend<
    Readonly<Record<string, NotificationChannelConfig>>
  >();
  for (const channel of Object.values(notification.channels)) {
    expectTypeOf(channel.provider).toEqualTypeOf<string>();
    expectTypeOf(channel.type).toEqualTypeOf<string | undefined>();
    expect(channel.provider).toBe('in-app');
    expect(channel.type).toBe('in-app');
  }
});
