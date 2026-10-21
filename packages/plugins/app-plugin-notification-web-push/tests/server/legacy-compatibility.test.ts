import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import {
  createSecretsService,
  secretsServiceToken,
} from '@nocobase/app-server/secrets';
import {
  createNotificationRegistry,
  notificationExtensionRegistryToken,
} from '@nocobase/app-plugin-notification/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { expect, it } from 'vitest';
import WebPushProvider from '../../server/providers/web-push.js';

it.each(['provider', 'type'] as const)(
  'accepts legacy third-party Providers alongside the built-in class with %s config',
  (discriminator) => {
    const registry = createNotificationRegistry();
    const container = new ServiceContainer();
    container.instance(notificationExtensionRegistryToken, registry);
    container.instance(secretsServiceToken, createSecretsService({ keys: [] }));
    const provider = new WebPushProvider({
      appName: 'main',
      publicBasePath: '/',
      paths: createAppPaths({ rootDir: process.cwd() }),
      container,
      config: new AppConfig(),
      router: new Hono(),
    });
    provider.register();
    registry.registerProvider({
      type: 'custom-web-push',
      messageType: 'web-push',
      async createProvider() {
        return {
          type: 'custom-web-push',
          async send() {
            return { status: 'accepted' };
          },
        };
      },
    });

    expect(() =>
      registry.validate({
        channels: {
          webPush: { type: 'web-push' },
          custom:
            discriminator === 'type'
              ? { type: 'custom-web-push' }
              : { provider: 'custom-web-push' },
        },
      }),
    ).not.toThrow();
  },
);
