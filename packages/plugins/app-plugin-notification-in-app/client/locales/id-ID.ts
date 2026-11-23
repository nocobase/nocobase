import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const idID: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Kotak masuk',
    views: {
      all: 'Semua',
      unread: 'Belum dibaca',
      todo: 'Menunggu',
    },
    categories: 'Kategori',
    readAll: 'Tandai semua sudah dibaca',
    open: 'Buka',
    actions: {
      read: 'Tandai sudah dibaca',
      unread: 'Tandai belum dibaca',
      delete: 'Hapus',
    },
    tabs: {
      today: 'Hari ini',
      info: 'Sebelumnya',
      decision: 'Menunggu',
    },
  },
  inboxButton: {
    title: 'Kotak masuk',
    viewAll: 'Buka kotak masuk',
  },
  nav: {
    inbox: 'Kotak masuk',
  },
};

export default idID;
