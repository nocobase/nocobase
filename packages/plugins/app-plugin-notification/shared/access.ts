/**
 * What this plugin offers to be granted: the `notification` settings item. `read` shows the channels, notification
 * kinds and the delivery log under System settings › Messages › Notifications; `manage` adds test sends and retries.
 * The pages and their routes check the same item. A person's own notification preferences and inbox only need a
 * signed-in account.
 */

/** The namespace of the plugin's wording, in its locales. */
export const NOTIFICATION_ACCESS_NAMESPACE =
  '@nocobase/app-plugin-notification';

export const NOTIFICATION_SETTINGS_ID = 'notification' as const;

export const NOTIFICATION_SETTINGS_ACTIONS = ['read', 'manage'] as const;

export type NotificationSettingsAction =
  (typeof NOTIFICATION_SETTINGS_ACTIONS)[number];

/** The resource a page or route checks for `action`. */
export const NOTIFICATION_SETTINGS_RESOURCE: {
  readonly type: 'settings';
  readonly id: 'notification';
} = { type: 'settings', id: NOTIFICATION_SETTINGS_ID };
