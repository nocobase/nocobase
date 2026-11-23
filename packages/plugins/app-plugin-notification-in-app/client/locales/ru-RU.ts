import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const ruRU: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Входящие',
    views: {
      all: 'Все',
      unread: 'Непрочитанные',
      todo: 'Ожидают',
    },
    categories: 'Категории',
    readAll: 'Отметить все как прочитанные',
    open: 'Открыть',
    actions: {
      read: 'Отметить как прочитанное',
      unread: 'Отметить как непрочитанное',
      delete: 'Удалить',
    },
    tabs: {
      today: 'Сегодня',
      info: 'Ранее',
      decision: 'Ожидают',
    },
  },
  inboxButton: {
    title: 'Входящие',
    viewAll: 'Открыть входящие',
  },
  nav: {
    inbox: 'Входящие',
  },
};

export default ruRU;
