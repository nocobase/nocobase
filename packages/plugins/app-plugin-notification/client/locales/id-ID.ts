import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
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
    sendTest: 'Kirim pemberitahuan tes',
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
  test: {
    title: 'Kirim pemberitahuan tes',
    description:
      'Pilih metode pengiriman, lalu klik Kirim. Pesan dikirim ke penerima yang Anda berikan dan dicatat di bawah.',
    close: 'Tutup dialog pemberitahuan pengujian',
    loadingProviders: 'Memuat Penyedia yang dikonfigurasi…',
    noProviders: 'Tidak ada Penyedia yang diaktifkan yang dikonfigurasi.',
    channelProvider: 'Metode penyampaian',
    selectProvider: 'Pilih metode pengiriman',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: 'Penerima',
    userIdPlaceholder: 'ID Pengguna',
    emailHelp: 'Alamat email yang seharusnya menerima tes ini.',
    userHelp: 'ID pengguna yang seharusnya menerima pesan dalam aplikasi ini.',
    messageTitle: 'Judul',
    message: 'Pesan',
    cancel: 'Batal',
    sending: 'Mengirim…',
    send: 'Kirim',
    defaultTitle: 'Tes notifikasi NocoBase',
    defaultBody: 'Ini adalah notifikasi pengujian dari NocoBase.',
    accepted: 'Notifikasi pengujian {{id}} diterima.',
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
