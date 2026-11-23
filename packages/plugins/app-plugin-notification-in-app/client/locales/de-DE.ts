import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const deDE: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Posteingang',
    views: {
      all: 'Alle',
      unread: 'Ungelesen',
      todo: 'Ausstehend',
    },
    categories: 'Kategorien',
    readAll: 'Alle als gelesen markieren',
    open: 'Öffnen',
    actions: {
      read: 'Als gelesen markieren',
      unread: 'Als ungelesen markieren',
      delete: 'Löschen',
    },
    tabs: {
      today: 'Heute',
      info: 'Früher',
      decision: 'Ausstehend',
    },
  },
  inboxButton: {
    title: 'Posteingang',
    viewAll: 'Posteingang öffnen',
  },
  nav: {
    inbox: 'Posteingang',
  },
};

export default deDE;
