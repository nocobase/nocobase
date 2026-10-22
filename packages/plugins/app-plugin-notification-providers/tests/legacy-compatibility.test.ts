import { createNotificationRegistry } from '@nocobase/app-plugin-notification';
import { describe, expect, it, vi } from 'vitest';
import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';

describe('built-in message handlers for legacy Providers', () => {
  it.each(['email', 'im'])(
    'keeps the built-in %s handler available to legacy providers',
    (messageType) => {
      const registry = createNotificationRegistry();
      registerBuiltInNotificationProviders(registry);
      const type = `custom-${messageType}`;
      const validateConfig = vi.fn();
      registry.registerProvider({
        type,
        messageType,
        validateConfig,
        async createProvider() {
          return {
            type,
            async send() {
              return { status: 'accepted' as const };
            },
          };
        },
      });
      const config = {
        channels: {
          legacy: { provider: type },
          current: { type },
        },
      };

      expect(() => registry.validate(config)).not.toThrow();
      expect(validateConfig.mock.calls).toEqual([
        [{ provider: type }],
        [{ provider: type }],
      ]);
    },
  );
});
