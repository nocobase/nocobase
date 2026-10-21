import { expect, expectTypeOf, it } from 'vitest';
import type {
  NotificationChannelConfig,
  NotificationChannelDefinition,
  NotificationConfig,
  NotificationProviderConfig,
  NotificationTestAdapter,
} from '../server/index.js';

interface LegacyConfig extends NotificationChannelConfig {
  readonly endpoint: string;
}

it('preserves provider-based types for legacy extension callbacks', () => {
  expectTypeOf<NotificationChannelConfig>().toEqualTypeOf<NotificationProviderConfig>();
  expectTypeOf<LegacyConfig['provider']>().toEqualTypeOf<string>();

  const test: NotificationTestAdapter = {
    label: 'Legacy',
    fields: [],
    toSendInput({ channelConfig }) {
      expectTypeOf(channelConfig.provider).toEqualTypeOf<string>();
      return { provider: channelConfig.provider };
    },
  };
  const definition: NotificationChannelDefinition = {
    type: 'legacy',
    test,
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

  const config: NotificationConfig = {
    channels: {
      legacy: { provider: 'custom' },
      current: { type: 'custom' },
      aliases: { type: 'custom', provider: 'custom' },
    },
  };
  expect(config.channels.current).toEqual({ type: 'custom' });
  expect(
    definition.test?.toSendInput({
      actor: { userId: 'tester' },
      values: {},
      channelConfig: { provider: 'custom' },
    }),
  ).toEqual({ provider: 'custom' });
});
