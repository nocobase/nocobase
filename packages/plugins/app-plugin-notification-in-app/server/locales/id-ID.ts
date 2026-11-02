import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'Dalam aplikasi',
  },
  providers: {
    builtIn: 'Terpasang',
  },
  errors: {
    authenticationRequired: 'Otentikasi diperlukan.',
    invalidPageToken: 'pageToken bukan token yang dikembalikan daftar ini.',
    notFound: 'Pesan pemberitahuan tidak ditemukan.',
  },
};

export default idID;
