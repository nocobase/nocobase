import { createNotificationRegistry } from '@nocobase/app-plugin-notification';
import { describe, expect, it } from 'vitest';

import { ServiceContainer } from '@nocobase/service-provider';
import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';
import NotificationProvidersProvider from '../server/provider.js';

describe('@nocobase/app-plugin-notification-providers bootstrap', () => {
  it('registers concrete channel classes', () => {
    const registry = createNotificationRegistry();

    registerBuiltInNotificationProviders(registry);

    expect(registry.channelType('email')?.type).toBe('email');
    expect(registry.channelType('smtp')?.type).toBe('smtp');
    expect(registry.channelType('resend')?.type).toBe('resend');
    expect(registry.channelType('feishu-webhook')?.type).toBe('feishu-webhook');
    expect(registry.channelType('dingtalk-webhook')?.type).toBe(
      'dingtalk-webhook',
    );
  });

  it('fails fast when the required extension registry is absent', async () => {
    const provider = new NotificationProvidersProvider({
      container: new ServiceContainer(),
    });

    await expect(provider.boot()).rejects.toThrow(
      'Built-in notification Providers require the notification extension registry.',
    );
  });
});
