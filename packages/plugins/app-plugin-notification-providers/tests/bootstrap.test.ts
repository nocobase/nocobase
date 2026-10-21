import { createNotificationRegistry } from '@nocobase/app-plugin-notification';
import { describe, expect, it, vi } from 'vitest';

import { ServiceContainer } from '@nocobase/service-provider';
import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';
import NotificationProvidersProvider from '../server/provider.js';

describe('@nocobase/app-plugin-notification-providers bootstrap', () => {
  it('registers concrete channel classes', () => {
    const registry = createNotificationRegistry();

    registerBuiltInNotificationProviders(registry);

    expect(registry.channel('email')?.type).toBe('email');
    expect(registry.channelType('smtp')?.type).toBe('smtp');
    expect(registry.channelType('resend')?.type).toBe('resend');
    expect(registry.channel('im')?.type).toBe('im');
    expect(registry.channelType('feishu-webhook')?.type).toBe('feishu-webhook');
    expect(registry.channelType('dingtalk-webhook')?.type).toBe(
      'dingtalk-webhook',
    );
  });

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

  it('fails fast when the required extension registry is absent', async () => {
    const provider = new NotificationProvidersProvider({
      container: new ServiceContainer(),
    });

    await expect(provider.boot()).rejects.toThrow(
      'Built-in notification Providers require the notification extension registry.',
    );
  });
});
