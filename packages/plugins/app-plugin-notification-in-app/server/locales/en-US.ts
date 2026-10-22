import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  channels: { inApp: 'In-app' },
  providers: { builtIn: 'Built-in' },
  errors: {
    authenticationRequired: 'Authentication required.',
    invalidPageToken: 'pageToken is not a token this list returned.',
    notFound: 'Notification message was not found.',
  },
};

export type InAppNotificationResource = LocaleResource<typeof enUS>;
export default enUS;
