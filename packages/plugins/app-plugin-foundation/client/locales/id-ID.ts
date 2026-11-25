import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugin',
    pluginsDescription:
      'Plugin yang digunakan aplikasi ini, versinya, dan cara mengaktifkan yang lain.',
  },
  access: {
    section: 'Sistem',
    settings: {
      plugins: 'Plugin',
    },
    actions: {
      read: 'Lihat',
    },
  },
  page: {
    title: 'Plugin',
    description:
      'Plugin yang digunakan aplikasi ini. Mengaktifkan atau menonaktifkan plugin mengubah kode aplikasi dan baru berlaku setelah dimulai ulang, jadi halaman ini memberikan perintah yang perlu dijalankan, bukan sakelar.',
    deployed:
      'Untuk mengaktifkan plugin, daftarkan plugin di proyek sumber lalu deploy ulang aplikasi.',
    attention_one:
      '{{count}} plugin perlu perhatian dan ditampilkan paling atas.',
    attention_other:
      '{{count}} plugin perlu perhatian dan ditampilkan paling atas.',
    search: 'Cari berdasarkan nama atau paket',
    loading: 'Memuat plugin…',
    loadFailed: 'Plugin tidak dapat dimuat.',
    retry: 'Coba lagi',
    empty: 'Tidak ada plugin yang cocok.',
  },
  filters: {
    label: 'Tampilkan',
    all: 'Semua {{count}}',
    enabled: 'Aktif {{count}}',
    disabled: 'Belum aktif {{count}}',
    attention: 'Perlu perhatian {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Versi',
    status: 'Status',
    actions: 'Tindakan',
  },
  groups: {
    enabled: 'Aktif {{count}}',
    disabled: 'Belum aktif {{count}}',
  },
  status: {
    enabled: 'Aktif',
    skillsOnly: 'Aktif · Hanya Skill',
    enabledAttention: 'Aktif · Perlu perhatian',
    disabled: 'Belum aktif',
    disabledAttention: 'Belum aktif · Perlu perhatian',
    unknown: 'Tidak dapat dipastikan · Build ulang',
  },
  reasons: {
    partial:
      'Baru aktif sebagian: halamannya bisa dibuka, tetapi datanya tidak termuat. Jalankan lagi perintah aktivasi untuk memperbaikinya.',
    devDependency:
      'Aktif, tetapi tidak ikut saat aplikasi di-deploy, sehingga aplikasi produksi tidak memilikinya. Jalankan lagi perintah aktivasi untuk memperbaikinya.',
    missingRequires: '“{{title}}” memerlukan {{names}}, yang belum aktif.',
    other:
      'Belum terpasang sepenuhnya di aplikasi ini. Jalankan lagi perintah aktivasi untuk memperbaikinya.',
    requiresFirst:
      'Aktifkan dulu: {{names}} (sudah termasuk dalam perintah aktivasi)',
    unknown:
      'Aplikasi ini dibangun sebelum proses build mencatat plugin baris perintah yang didaftarkan, jadi di sini tidak dapat dipastikan apakah plugin ini aktif. Jalankan pnpm build lagi lalu deploy ulang.',
  },
  actions: {
    commands: 'Perintah',
    commandsFor: 'Perintah untuk {{title}}',
    enable: 'Cara mengaktifkan',
    enableFor: 'Cara mengaktifkan {{title}}',
  },
  commands: {
    title: 'Perintah untuk {{title}}',
    description:
      'Jalankan di direktori kode aplikasi, lalu mulai ulang; untuk aplikasi produksi, build dan deploy lagi.',
    fix: 'Memperbaiki yang perlu perhatian',
    update: 'Memperbarui ke versi terbaru',
    unregister: 'Menonaktifkannya; datanya tetap disimpan',
    dependents:
      'Plugin aktif yang bergantung padanya: {{names}}. Nonaktifkan bersama-sama.',
    noDependents:
      'Tidak ada plugin aktif yang bergantung padanya, jadi bisa dinonaktifkan sendiri.',
    optionalDependents:
      'Plugin aktif yang menggunakannya secara opsional: {{names}}. Plugin itu tetap berjalan tanpanya, tetapi kehilangan fitur yang memerlukannya.',
  },
  enable: {
    title: 'Aktifkan {{title}}',
    description: 'Jalankan di direktori kode aplikasi:',
    requires:
      '{{title}} bergantung pada {{names}}, yang juga belum aktif; perintahnya sudah menyertakannya.',
    development:
      'Pengembangan lokal: mulai ulang pnpm dev setelah menjalankannya, lalu muat ulang halaman ini untuk melihatnya aktif.',
    live: 'Aplikasi produksi: commit perubahan, jalankan pnpm build --tar, lalu tingkatkan dengan installer.',
    data: 'Saat pertama kali dijalankan, tabelnya dibuat. Menonaktifkannya nanti dengan plugin unregister tetap menyimpan datanya.',
  },
  dialog: {
    copy: 'Salin perintah',
    copied: 'Disalin',
    copyFailed: 'Gagal menyalin; pilih perintahnya lalu salin.',
    close: 'Mengerti',
  },
};

export default idID;
