import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Otentikasi diperlukan.',
    invalidPageToken: 'pageToken bukan token yang dikembalikan daftar ini.',
    notFound: 'Pesan pemberitahuan tidak ditemukan.',
  },
  test: {
    channels: {
      inApp: 'Dalam aplikasi',
    },
    providers: {
      builtIn: 'Terpasang',
    },
    fields: {
      route: 'Rute internal (tanpa awalan penerapan)',
      url: 'HTTP(S) URL Penuh',
      recipientUserId: 'ID pengguna penerima',
      title: 'Judul',
      message: 'Pesan',
    },
    placeholders: {
      currentUser: 'ID pengguna aplikasi',
    },
    defaults: {
      title: 'Tes notifikasi NocoBase',
      body: 'Ini adalah notifikasi pengujian dari NocoBase.',
    },
  },
};

export default idID;
