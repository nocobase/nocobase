import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    authenticationRequired: 'Authentication required.',
    invalidPageToken: 'pageToken is not a token this list returned.',
    notFound: 'Notification message was not found.',
  },
  test: {
    channels: { inApp: 'In-app' },
    providers: { builtIn: 'Built-in' },
    fields: {
      route: 'Internal route (without deployment prefix)',
      url: 'Full HTTP(S) URL',
      recipientUserId: 'Recipient user ID',
      title: 'Title',
      message: 'Message',
    },
    placeholders: { currentUser: 'Application user ID' },
    defaults: {
      title: 'NocoBase notification test',
      body: 'This is a test notification from NocoBase.',
    },
  },
};

export type InAppNotificationResource = LocaleResource<typeof enUS>;
export default enUS;
