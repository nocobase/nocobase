import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  permissionSets: {
    builtIn: {
      root: 'Administrator sistem',
      member: 'Anggota',
    },
  },
  sections: {
    pages: 'Izin halaman',
    page: 'Halaman',
    business: 'Izin usaha',
    administration: 'Administrasi',
    other: 'Lainnya',
  },
  options: {
    defaultAndSharing: 'Gunakan cakupan data default',
    actions: {
      assign: 'Kelola tugas',
      configure: 'Konfigurasi',
      inspect: 'Periksa izin',
      read: 'Baca',
      create: 'Buat',
      update: 'Perbarui',
      delete: 'Hapus',
      access: 'Akses',
    },
    settingsModules: {
      authorization: 'Otorisasi',
    },
    pages: {
      all: 'Semua halaman',
      allDescription:
        'Izinkan akses ke setiap halaman, termasuk halaman yang ditambahkan nanti.',
    },
    settings: {
      inspector: 'Inspektur izin',
      'permission-sets': 'Kumpulan izin',
    },
    subjectTypes: {
      authenticated: 'Semua pengguna yang masuk',
      authenticatedDescription:
        'Berlaku untuk setiap pengguna dengan sesi masuk yang valid.',
      user: 'Pengguna',
    },
    recordAccessPolicies: {
      allRecords: 'Semua Catatan',
      recordsIOwn: 'Catatan yang Saya Miliki',
      recordsICreated: 'Catatan yang Saya Buat',
      customFilter: 'Filter Khusus',
      customFilterHint: 'Pilih rekaman dengan kondisi filter khusus.',
    },
  },
};

export default idID;
