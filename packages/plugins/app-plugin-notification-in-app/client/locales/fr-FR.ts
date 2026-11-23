import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const frFR: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Boîte de réception',
    views: {
      all: 'Tout',
      unread: 'Non lus',
      todo: 'En attente',
    },
    categories: 'Catégories',
    readAll: 'Tout marquer comme lu',
    open: 'Ouvrir',
    actions: {
      read: 'Marquer comme lu',
      unread: 'Marquer comme non lu',
      delete: 'Supprimer',
    },
    tabs: {
      today: "Aujourd'hui",
      info: 'Plus tôt',
      decision: 'En attente',
    },
  },
  inboxButton: {
    title: 'Boîte de réception',
    viewAll: 'Ouvrir la boîte',
  },
  nav: {
    inbox: 'Boîte de réception',
  },
};

export default frFR;
