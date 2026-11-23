import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  NotificationExtensionRegistry,
  NotificationService,
  NotificationUserLocales,
} from './types.js';

export const notificationServiceToken: ServiceToken<NotificationService> =
  createServiceToken<NotificationService>(
    '@nocobase/app-plugin-notification/service',
  );

export const notificationExtensionRegistryToken: ServiceToken<NotificationExtensionRegistry> =
  createServiceToken<NotificationExtensionRegistry>(
    '@nocobase/app-plugin-notification/extension-registry',
  );

/**
 * Where `notify()` reads each person's language. The users plugin provides it; without it everyone receives the
 * application's default language.
 */
export const notificationUserLocalesToken: ServiceToken<NotificationUserLocales> =
  createServiceToken<NotificationUserLocales>(
    '@nocobase/app-plugin-notification/user-locales',
  );
