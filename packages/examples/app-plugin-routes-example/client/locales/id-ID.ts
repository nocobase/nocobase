import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  providerDescription:
    'Halaman ini menggunakan penyedia yang dikontribusikan oleh plugin klien yang sama.',
  loadError: 'Tidak dapat memuat rute server.',
  clientExample: 'Contoh rute klien',
  title: 'Contoh rute',
  pageDescription:
    'Itu dimuat dengan lambat dan membaca respons dari rute server plugin yang sama.',
  loading: 'Memuat data server…',
  retry: 'Coba lagi permintaan',
  plugin: 'Pengaya',
  scope: 'Cakupan',
  message: 'Pesan',
};

export default idID;
