import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Templat notifikasi',
    coverage:
      'Hanya skenario terdaftar. Pengiriman dinamis, fungsi khusus, dan templat email pribadi tidak tercakup. Definisi dan pratinjau hanya baca.',
    search: 'Cari skenario',
    category: 'Kategori bisnis',
    channel: 'Kanal',
    all: 'Semua',
    details: 'Lihat detail',
    close: 'Tutup detail',
    trigger: 'Pemicu',
    recipients: 'Aturan penerima',
    businessRule: 'Aktivasi bisnis',
    contributor: 'Sumber',
    languagePolicy: 'Perilaku bahasa',
    status: 'Konfigurasi kanal',
    statusHelp:
      'Definisi terdaftar tidak berarti notifikasi diaktifkan. Konfigurasi tidak menjamin konektivitas.',
    configured: 'Dikonfigurasi',
    unconfigured: 'Belum dikonfigurasi',
    enabled: 'Aktif',
    disabled: 'Nonaktif',
    unknown: 'Tidak diketahui',
    variables: 'Variabel tersedia',
    language: 'Bahasa konten',
    synthetic:
      'Hanya data sintetis. Pratinjau tidak mengirim notifikasi atau mengubah konfigurasi.',
    definition: 'Definisi templat',
    preview: 'Pratinjau sintetis',
    html: 'Sumber HTML (teks pasif)',
    loading: 'Memuat…',
    failed: 'Templat tidak dapat dimuat.',
    forbidden: 'Anda tidak memiliki izin melihat templat.',
    notFound: 'Templat ini tidak lagi terdaftar.',
    retry: 'Coba lagi',
    empty: 'Belum ada skenario terdaftar.',
    noResults: 'Tidak ada skenario yang cocok dengan filter.',
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
