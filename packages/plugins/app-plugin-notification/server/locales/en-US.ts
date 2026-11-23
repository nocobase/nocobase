import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    logNotFound: 'Notification log not found.',
    kindNotFound: 'Notification kind not found.',
    channelNotFound: 'No enabled notification channel is named "{{name}}".',
    channelTestUnsupported:
      'The "{{name}}" channel cannot send a test message.',
    channelNoRecipient:
      'The "{{name}}" channel has no address or device for you.',
    deliveryNotFound: 'Notification delivery not found.',
    deliveryNotRetryable:
      'This delivery cannot be retried: only a failed delivery whose channel is unchanged can be.',
    retryReasonRequired: 'Enter a reason for the retry.',
    preferenceUnknown: 'This notification has no such channel.',
    preferenceRequired:
      'This notification is always sent on this channel; it cannot be turned off.',
  },
  test: {
    title: 'Test notification',
    body: 'This is a test from Settings › Notifications for the "{{channel}}" channel.',
  },
  authorization: {
    section: 'Messages',
    title: 'Notifications',
    read: 'View',
    manage: 'Manage',
  },
};

export type NotificationServerResource = LocaleResource<typeof enUS>;
export default enUS;
