import {
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { BellIcon } from 'lucide-react';

import { NOTIFICATION_SETTINGS_RESOURCE } from '../shared/access.js';

export interface NotificationRouteOptions {
  /** `false` leaves System settings › Messages › Notifications unregistered. Defaults to `true`. */
  readonly settingsPage?: boolean;
  /** `false` leaves Personal settings › Account › Notifications unregistered. Defaults to `true`. */
  readonly preferencesPage?: boolean;
}

/** The route ids an application passes to `routeComponentOverrides` to replace a page. */
export const NOTIFICATION_ROUTE_IDS: {
  readonly settings: '@nocobase/app-plugin-notification:notificationSettings';
  readonly preferences: '@nocobase/app-plugin-notification:notificationPreferences';
} = Object.freeze({
  settings: '@nocobase/app-plugin-notification:notificationSettings',
  preferences: '@nocobase/app-plugin-notification:notificationPreferences',
});

/**
 * System settings › Messages › Notifications, for whoever holds the `read` action of the `notification` settings
 * item, and the signed-in person's own Personal settings › Account › Notifications.
 */
export function createNotificationRoutes(
  options: NotificationRouteOptions = {},
): readonly AppClientRouteContribution[] {
  const routes: AppClientRouteContribution[] = [];
  if (options.settingsPage !== false)
    routes.push(
      defineSystemSettingsRoutes([
        {
          parent: SYSTEM_SETTINGS_CATEGORIES.messages,
          name: 'notificationSettings',
          path: '/notifications',
          authz: { resource: NOTIFICATION_SETTINGS_RESOURCE, action: 'read' },
          navigation: {
            title: 'nav.notifications',
            description: 'nav.notificationsDescription',
            icon: BellIcon,
          },
          breadcrumb: { title: 'nav.notifications' },
          componentLoader: () =>
            import('./settings/notification-settings-page.js'),
        },
      ]),
    );
  if (options.preferencesPage !== false)
    routes.push(
      definePersonalSettingsRoutes([
        {
          parent: PERSONAL_SETTINGS_CATEGORIES.account,
          name: 'notificationPreferences',
          path: '/notifications',
          navigation: {
            title: 'nav.notifications',
            description: 'nav.preferencesDescription',
            order: 410,
            icon: BellIcon,
          },
          breadcrumb: { title: 'nav.notifications' },
          componentLoader: () =>
            import('./preferences/notification-preferences-page.js'),
        },
      ]),
    );
  return routes;
}
