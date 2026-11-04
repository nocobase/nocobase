import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  templates: {
    title: 'Notification templates',
    coverage:
      'Registered scenarios only. Dynamic sends, custom callbacks and private mail templates are outside this directory. Definitions and previews are read-only.',
    search: 'Search scenarios',
    category: 'Business category',
    channel: 'Channel',
    all: 'All',
    details: 'View details',
    close: 'Close details',
    trigger: 'Trigger',
    recipients: 'Recipient rule',
    businessRule: 'Business activation',
    contributor: 'Source',
    languagePolicy: 'Language behavior',
    status: 'Channel configuration',
    statusHelp:
      'A registered definition does not imply delivery is enabled. Configuration presence does not verify connectivity.',
    configured: 'Configured',
    unconfigured: 'Not configured',
    enabled: 'Enabled',
    disabled: 'Disabled',
    unknown: 'Unknown',
    variables: 'Available variables',
    language: 'Content language',
    synthetic:
      'Synthetic example data only. Preview sends no notifications and changes no configuration.',
    definition: 'Template definition',
    preview: 'Synthetic preview',
    html: 'HTML source (inert text)',
    loading: 'Loading…',
    failed: 'Templates could not be loaded.',
    forbidden: 'You do not have permission to view notification templates.',
    notFound: 'This template is no longer registered.',
    retry: 'Retry',
    empty: 'No notification scenarios are registered.',
    noResults: 'No scenarios match these filters.',
  },
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

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
