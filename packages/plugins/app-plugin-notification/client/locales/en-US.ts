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
    refresh: 'Refresh',
    sendTest: 'Send test notification',
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
  test: {
    title: 'Send test notification',
    description:
      'Select a delivery method, then click Send. The message is sent to the recipient you provide and recorded below.',
    close: 'Close test notification dialog',
    loadingProviders: 'Loading configured Providers…',
    noProviders: 'No enabled Providers are configured.',
    channelProvider: 'Delivery method',
    selectProvider: 'Select a delivery method',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: 'Recipient',
    userIdPlaceholder: 'User ID',
    emailHelp: 'The email address that should receive this test.',
    userHelp: 'The user ID that should receive this in-app message.',
    messageTitle: 'Title',
    message: 'Message',
    cancel: 'Cancel',
    sending: 'Sending…',
    send: 'Send',
    defaultTitle: 'NocoBase notification test',
    defaultBody: 'This is a test notification from NocoBase.',
    accepted: 'Test notification {{id}} accepted.',
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

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
