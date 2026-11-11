import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  logs: {
    deliveryOperations: 'Delivery operations',
    recipeDescription: 'Trace each channel handoff and every provider attempt.',
    redacted: 'Message bodies, recipients, and lease tokens are redacted.',
    providerAttempts: 'Provider attempts',

    eyebrow: 'Notifications',
    title: 'Notification logs',
    description:
      'Trace notification delivery and every provider attempt. Message bodies, recipients, and lease tokens are redacted.',
    refreshing: 'Refreshing…',
    retryRead: 'Retry',
    deliveriesShown: 'Deliveries shown',
    needAttention: 'Need attention',
    unavailable: 'Logs unavailable',
    recent: 'Recent notifications',
    loading: 'Loading delivery history…',
    emptyTitle: 'No deliveries yet',
    emptyDescription:
      'Delivery records will appear here after notifications are sent.',
    expand: 'Expand notification',
    collapse: 'Collapse notification',
    noDeliveries: 'No deliveries recorded.',
    noAttempts: 'No attempts recorded.',
    columns: {
      source: 'Source',
      notificationId: 'Notification ID',
      status: 'Status',
      deliveries: 'Deliveries',
      created: 'Created',
      channel: 'Channel',
      provider: 'Provider',
      attempts: 'Attempts',
      updated: 'Updated',
    },
  },
  status: {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    partial: 'partial',
    failed: 'failed',
    unknown: 'unknown',
    preparing: 'preparing',
    submitting: 'submitting',
    retrying: 'retrying',
    accepted: 'accepted',
  },
  errors: {
    requestFailed: 'Notification request failed.',
    inAppRecipientNotFound: 'In-app notification recipient does not exist.',
  },
};

/** The shape of the whole resource this file exports, as merged into an application's or a plugin's locale. */
export type NotificationLogsResource = LocaleResource<{
  notificationLogs: typeof enUS;
}>;
/**
 * The shape of the block's own group. It carries no top-level `overrides`, so a resource built from it merges into
 * a resource typed with `LocaleResource` without changing that resource's shape.
 */
export type NotificationResource = NotificationLogsResource['notificationLogs'];

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: enUS,
};
export default resource;
