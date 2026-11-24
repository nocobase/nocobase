import type { NotificationServerResource } from './en-US.js';

const idID: NotificationServerResource = {
  errors: {
    logNotFound: 'Log notifikasi tidak ditemukan.',
    kindNotFound: 'Jenis notifikasi tidak ditemukan.',
    channelNotFound: 'Tidak ada saluran notifikasi aktif bernama "{{name}}".',
    channelTestUnsupported:
      'Saluran "{{name}}" tidak dapat mengirim pesan uji.',
    channelNoRecipient:
      'Saluran "{{name}}" tidak memiliki alamat atau perangkat Anda.',
    deliveryNotFound: 'Pengiriman tidak ditemukan.',
    deliveryNotRetryable:
      'Pengiriman ini tidak dapat dicoba ulang: hanya pengiriman gagal yang salurannya tidak berubah yang bisa.',
    retryReasonRequired: 'Masukkan alasan percobaan ulang.',
    preferenceUnknown: 'Notifikasi ini tidak memiliki saluran tersebut.',
    preferenceRequired:
      'Notifikasi ini selalu dikirim lewat saluran ini; tidak dapat dimatikan.',
  },
  test: {
    title: 'Notifikasi uji',
    body: 'Ini adalah uji dari Pengaturan › Notifikasi untuk saluran "{{channel}}".',
  },
  authorization: {
    section: 'Pesan',
    title: 'Notifikasi',
    read: 'Lihat',
    manage: 'Kelola',
  },
};

export default idID;
