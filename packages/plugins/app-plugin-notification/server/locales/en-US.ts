import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    logsForbidden: 'Notification logs access is required.',
    logNotFound: 'Notification log not found.',
  },
};

export type NotificationServerResource = LocaleResource<typeof enUS>;
export default enUS;
