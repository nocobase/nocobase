import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
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
  'push.testSent': 'Notifikasi uji antri',
  'push.failed':
    'Tidak dapat memperbarui pemberitahuan push. Silakan coba lagi.',
  'push.loadingFailed': 'Tidak dapat memuat perangkat. Silakan coba lagi.',
  'push.retry': 'Coba lagi',
};

export default idID;
