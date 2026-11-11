import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  templates: {
    title: 'Notification templates',
    coverage:
      'Notifications the system sends automatically, and what they look like. Notifications sent by workflows or custom code may not be listed. This page is read-only.',
    filters: 'Filter templates',
    search: 'Search templates',
    category: 'Category',
    channel: 'Channel',
    all: 'All',
    details: 'Template details',
    close: 'Close',
    providedBy: 'Provided by {{name}}',
    trigger: 'When it is sent',
    recipients: 'Who receives it',
    businessRule: 'Sending conditions',
    languagePolicy: 'Language',
    combined:
      'One message contains all languages ({{languages}}). Every recipient receives the same content.',
    singleLocale: 'Sent in {{language}} only.',
    status: 'Delivery channels',
    statusHelp:
      'Shows whether each channel is set up. It does not test the connection or confirm that messages are delivered.',
    configured: 'Set up',
    unconfigured: 'Not set up',
    enabled: 'On',
    disabled: 'Off',
    variables: 'Variables',
    variablesHelp:
      'Placeholders replaced with real values when the notification is sent.',
    language: 'Language',
    synthetic:
      'Uses fictional sample data. Previewing never sends a notification.',
    definition: 'Template with variables',
    preview: 'Preview',
    html: 'HTML version (shown as code)',
    technical: 'Technical details',
    templateId: 'Template ID',
    package: 'Package',
    channelNames: 'Channel names',
    channelTypes: {
      inApp: 'In-app message',
      email: 'Email',
    },
    loading: 'Loading…',
    failed: 'Templates could not be loaded.',
    forbidden: 'You do not have permission to view notification templates.',
    notFound: 'This template no longer exists.',
    retry: 'Retry',
    empty: 'There are no notification templates yet.',
    noResults: 'No templates match these filters.',
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
