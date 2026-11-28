import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Terdaftar: {{total}} · Aktif: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
  'push.title': 'Pemberitahuan push',
  'push.description':
    'Terima pengingat di setiap perangkat, bahkan saat aplikasi ditutup.',
  'push.subscribe': 'Berlangganan perangkat ini',
  'push.name': 'Nama perangkat',
  'push.empty': 'Tidak ada perangkat berlangganan',
  'push.emptyHint':
    'Berlangganan perangkat ini untuk menerima pengingat saat aplikasi ditutup.',
  'push.ios':
    'Di iOS atau iPadOS 16.4 atau lebih baru, buka menu Bagikan di Safari, pilih Tambahkan ke Layar Utama, lalu buka aplikasi dari ikonnya untuk berlangganan.',
  'push.unsupported':
    'Push membutuhkan HTTPS dan browser dengan dukungan Web Push.',
  'push.unavailable':
    'Push tidak dikonfigurasi. Minta administrator untuk mengonfigurasi VAPID dan kunci rahasia.',
  'push.denied':
    'Notifikasi diblokir. Izinkan mereka di pengaturan situs browser Anda, lalu coba lagi.',
  'push.current': 'Perangkat ini',
  'push.more': 'Tindakan perangkat',
  'push.test': 'Kirim pemberitahuan tes',
  'push.remove': 'Hapus',
  'push.removeTitle': 'Hapus perangkat “{{name}}”?',
  'push.removeHint':
    'Perangkat ini akan berhenti menerima notifikasi push. Anda dapat berlangganan lagi dari perangkat itu.',
  'push.cancel': 'Batal',
  'push.saved': 'Pengaturan perangkat disimpan',
  'push.saving': 'Menyimpan pengaturan perangkat',
  'push.testSent': 'Layanan push menerima notifikasi uji.',
  'push.invalid':
    'Browser mengembalikan data langganan yang tidak valid. Coba berlangganan lagi.',
  'push.endpoint':
    'Server tidak mendukung layanan push yang digunakan browser ini.',
  'push.owned':
    'Langganan browser ini milik akun lain. Hapus dari akun tersebut sebelum berlangganan lagi.',
  'push.browserFailed':
    'Browser tidak dapat membuat langganan push. Periksa pengaturan notifikasi dan koneksi browser.',
  'push.expired':
    'Langganan perangkat ini telah kedaluwarsa atau dihapus. Berlangganan lagi di perangkat tersebut.',
  'push.testPaused':
    'Aktifkan kembali push di perangkat ini sebelum mengirim notifikasi uji.',
  'push.testLimited': 'Tunggu 30 detik di antara pengiriman notifikasi uji.',
  'push.testNetwork':
    'Server tidak dapat menjangkau layanan push. Minta administrator memeriksa jaringan dan proksi Web Push.',
  'push.testGatewayAuth':
    'Layanan push menolak kredensial server. Minta administrator memeriksa kunci VAPID.',
  'push.testGatewayLimited':
    'Layanan push membatasi permintaan. Coba lagi nanti.',
  'push.testGateway':
    'Layanan push tidak dapat menerima notifikasi uji. Coba lagi nanti.',
  'push.failed':
    'Tidak dapat memperbarui pemberitahuan push. Silakan coba lagi.',
  'push.loadingFailed': 'Tidak dapat memuat perangkat. Silakan coba lagi.',
  'push.retry': 'Coba lagi',
  'channelType.title': 'Push browser',
  'channelType.testHint':
    'Mengirim notifikasi uji ke browser tempat Anda mengaktifkan push. Aktifkan dulu di Pengaturan pribadi › Notifikasi.',
};

export default idID;
