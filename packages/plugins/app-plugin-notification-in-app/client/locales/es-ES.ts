import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const esES: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Bandeja de entrada',
    views: {
      all: 'Todo',
      unread: 'No leídos',
      todo: 'Pendiente',
    },
    categories: 'Categorías',
    readAll: 'Marcar todo como leído',
    open: 'Abrir',
    actions: {
      read: 'Marcar como leído',
      unread: 'Marcar como no leído',
      delete: 'Eliminar',
    },
    tabs: {
      today: 'Hoy',
      info: 'Anteriores',
      decision: 'Pendiente',
    },
  },
  inboxButton: {
    title: 'Bandeja de entrada',
    viewAll: 'Abrir la bandeja',
  },
  nav: {
    inbox: 'Bandeja de entrada',
  },
};

export default esES;
