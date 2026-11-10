import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Templat notifikasi',
    coverage:
      'Notifikasi yang dikirim sistem secara otomatis, beserta tampilannya. Notifikasi yang dikirim oleh alur kerja atau kode kustom mungkin tidak tercantum. Halaman ini hanya untuk dilihat.',
    filters: 'Filter templat',
    search: 'Cari templat',
    category: 'Kategori',
    channel: 'Saluran',
    all: 'Semua',
    details: 'Detail templat',
    close: 'Tutup',
    providedBy: 'Disediakan oleh {{name}}',
    trigger: 'Kapan dikirim',
    recipients: 'Siapa yang menerima',
    businessRule: 'Syarat pengiriman',
    languagePolicy: 'Bahasa',
    combined:
      'Satu pesan berisi semua bahasa ({{languages}}). Setiap penerima mendapat isi yang sama.',
    singleLocale: 'Hanya dikirim dalam {{language}}.',
    status: 'Saluran pengiriman',
    statusHelp:
      'Menunjukkan apakah setiap saluran sudah diatur. Ini tidak menguji koneksi atau memastikan pesan terkirim.',
    configured: 'Sudah diatur',
    unconfigured: 'Belum diatur',
    enabled: 'Aktif',
    disabled: 'Nonaktif',
    variables: 'Variabel',
    variablesHelp:
      'Penanda yang diganti dengan nilai sebenarnya saat notifikasi dikirim.',
    language: 'Bahasa',
    synthetic:
      'Menggunakan data contoh fiktif. Pratinjau tidak pernah mengirim notifikasi.',
    definition: 'Templat dengan variabel',
    preview: 'Pratinjau',
    html: 'Versi HTML (ditampilkan sebagai kode)',
    technical: 'Detail teknis',
    templateId: 'ID templat',
    package: 'Paket',
    channelNames: 'Nama saluran',
    channelTypes: {
      inApp: 'Pesan dalam aplikasi',
      email: 'Email',
    },
    loading: 'Memuat…',
    failed: 'Templat tidak dapat dimuat.',
    forbidden: 'Anda tidak memiliki izin untuk melihat templat notifikasi.',
    notFound: 'Templat ini sudah tidak ada.',
    retry: 'Coba lagi',
    empty: 'Belum ada templat notifikasi.',
    noResults: 'Tidak ada templat yang cocok dengan filter ini.',
  },
  logs: {
    deliveryOperations: 'Operasi pengiriman',
    recipeDescription:
      'Lacak setiap handoff saluran dan setiap upaya penyedia.',
    redacted: 'Badan pesan, penerima, dan token sewa disunting.',
    providerAttempts: 'Upaya penyedia',
    eyebrow: 'Notifikasi',
    title: 'Log pemberitahuan',
    description:
      'Lacak pengiriman notifikasi dan setiap upaya penyedia. Badan pesan, penerima, dan token sewa disunting.',
    refreshing: 'Menyegarkan…',
    refresh: 'Segarkan',
    deliveriesShown: 'Pengiriman ditampilkan',
    needAttention: 'Perlu perhatian',
    unavailable: 'Log tidak tersedia',
    recent: 'Pemberitahuan terkini',
    loading: 'Memuat riwayat pengiriman…',
    emptyTitle: 'Belum ada pengiriman',
    emptyDescription:
      'Catatan pengiriman akan muncul di sini setelah pemberitahuan dikirim.',
    expand: 'Perluas pemberitahuan',
    collapse: 'Tutup pemberitahuan',
    noDeliveries: 'Tidak ada pengiriman yang tercatat.',
    noAttempts: 'Tidak ada upaya yang tercatat.',
    columns: {
      source: 'Sumber',
      notificationId: 'ID Pemberitahuan',
      status: 'Status',
      deliveries: 'Pengiriman',
      created: 'Dibuat',
      channel: 'Saluran',
      provider: 'Penyedia',
      attempts: 'Upaya',
      updated: 'Diperbarui',
    },
  },
  status: {
    pending: 'tertunda',
    processing: 'pemrosesan',
    completed: 'selesai',
    partial: 'sebagian',
    failed: 'gagal',
    unknown: 'tidak diketahui',
    preparing: 'bersiap',
    submitting: 'mengirimkan',
    retrying: 'mencoba lagi',
    accepted: 'diterima',
  },
  errors: {
    requestFailed: 'Permintaan pemberitahuan gagal.',
    inAppRecipientNotFound: 'Penerima notifikasi dalam aplikasi tidak ada.',
  },
};

export default idID;
