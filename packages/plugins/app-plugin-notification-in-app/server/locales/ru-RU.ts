import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'В приложении',
  },
  providers: {
    builtIn: 'Встроенный',
  },
  errors: {
    authenticationRequired: 'Требуется вход в систему.',
    invalidPageToken:
      'pageToken не является токеном, который вернул этот список.',
    notFound: 'Уведомление не найдено.',
  },
};

export default ruRU;
