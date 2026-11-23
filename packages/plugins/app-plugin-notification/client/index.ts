export { default } from './plugin.js';
export type { NotificationClientOptions } from './plugin.js';

export * from '../shared/target.js';
export type * from '../shared/templates.js';
export type * from '../shared/preferences.js';
export {
  NOTIFICATION_SETTINGS_ACTIONS,
  NOTIFICATION_SETTINGS_ID,
  NOTIFICATION_SETTINGS_RESOURCE,
  type NotificationSettingsAction,
} from '../shared/access.js';

export * from './extensions.js';
export {
  createNotificationRoutes,
  NOTIFICATION_ROUTE_IDS,
  type NotificationRouteOptions,
} from './routes.js';
export {
  DELIVERY_OUTCOMES,
  notificationSettingsApi,
  type NotificationChannelView,
  type NotificationDeliveryFilter,
  type NotificationDeliveryLogDetails,
  type NotificationDeliveryLogEntry,
  type NotificationDeliveryOutcome,
  type NotificationDeliveryPage,
  type NotificationDeliverySettings,
  type NotificationDeliveryView,
  type NotificationKindListItem,
  type NotificationSettingsApi,
} from './settings/api.js';
export { NotificationSettingsPage } from './settings/notification-settings-page.js';
export { NotificationPreferencesPage } from './preferences/notification-preferences-page.js';
export { NotificationKinds } from './components/templates.js';
