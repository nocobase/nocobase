import {
  notificationExtensionRegistryToken,
  createNotificationRegistry,
} from '@nocobase/app-plugin-notification';
import { ServiceContainer } from '@nocobase/service-provider';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { InAppNotificationProvider } from '../server/providers/in-app-notification.js';

describe('in-app message handler for legacy Providers', () => {
  it.each(['provider', 'type'] as const)(
    'accepts legacy third-party Providers alongside the built-in class with %s config',
    async (discriminator) => {
      const registry = createNotificationRegistry();
      const container = new ServiceContainer();
      container.instance(notificationExtensionRegistryToken, registry);
      const provider = new InAppNotificationProvider({
        appName: 'main',
        publicBasePath: '/',
        config: new AppConfig(),
        paths: createAppPaths({ rootDir: process.cwd() }),
        container,
        router: new Hono(),
      });
      await provider.boot();
      registry.registerProvider({
        type: 'custom-in-app',
        messageType: 'in-app',
        async createProvider() {
          return {
            type: 'custom-in-app',
            async send() {
              return { status: 'accepted' };
            },
          };
        },
      });

      expect(() =>
        registry.validate({
          channels: {
            inbox: { type: 'in-app' },
            custom:
              discriminator === 'type'
                ? { type: 'custom-in-app' }
                : { provider: 'custom-in-app' },
          },
        }),
      ).not.toThrow();
    },
  );
});
