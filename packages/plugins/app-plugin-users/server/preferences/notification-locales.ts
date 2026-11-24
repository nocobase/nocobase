import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { USER_LOCALE_PREFERENCE_KEY } from './locale.js';
import type { UserPreferencesService } from './service.js';

/**
 * Tells the notification plugin, when it is installed, the language each person chose, so `notify()` writes to everyone
 * in their own language. Notification remains optional for standalone Users hosts.
 */
export async function registerNotificationUserLocales(
  app: AppPluginApplication,
  preferences: () => Pick<UserPreferencesService, 'getForUsers'>,
): Promise<boolean> {
  const notification =
    await import('@nocobase/app-plugin-notification/server').catch(
      (error: unknown) => {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'ERR_MODULE_NOT_FOUND'
        )
          return undefined;
        throw error;
      },
    );
  if (!notification?.notificationUserLocalesToken) return false;
  app.container.instance(notification.notificationUserLocalesToken, {
    async resolve(userIds) {
      const found = new Map<string, string>();
      for (const [userId, value] of await preferences().getForUsers(
        userIds,
        USER_LOCALE_PREFERENCE_KEY,
      ))
        if (typeof value === 'string') found.set(userId, value);
      return found;
    },
  });
  return true;
}
