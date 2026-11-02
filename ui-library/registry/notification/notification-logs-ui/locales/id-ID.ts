import type { NotificationResource } from './en-US.js';

const idID: NotificationResource = {
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

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: idID,
};
export default resource;
