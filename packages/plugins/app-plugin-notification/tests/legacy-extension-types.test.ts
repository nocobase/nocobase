import { expect, expectTypeOf, it } from 'vitest';
import type {
  NotificationChannelConfig,
  NotificationChannelDefinition,
  NotificationConfig,
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

  const config: NotificationConfig = {
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
