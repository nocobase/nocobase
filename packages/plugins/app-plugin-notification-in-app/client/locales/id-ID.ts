import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  inbox: {
    title: 'Kotak masuk',
    views: {
      all: 'Semua',
      unread: 'Belum dibaca',
      todo: 'Menunggu',
    },
    categories: 'Kategori',
    readAll: 'Tandai semua sudah dibaca',
    open: 'Buka',
    actions: {
      read: 'Tandai sudah dibaca',
      unread: 'Tandai belum dibaca',
      delete: 'Hapus',
    },
    tabs: {
      today: 'Hari ini',
      info: 'Sebelumnya',
      decision: 'Menunggu',
    },
    actionsFor: 'Tindakan untuk {{title}}',
    allRead: 'Semua ditandai sudah dibaca.',
    back: 'Kembali ke daftar',
    cancel: 'Batal',
    clearFilter: 'Hapus filter',
    count: '×{{count}}',
    deleted: 'Dihapus.',
    description: 'Notifikasi dan permintaan yang dikirim kepada Anda.',
    empty: {
      decision: 'Tidak ada keputusan yang menunggu Anda',
      info: 'Tidak ada notifikasi',
      todo: 'Tidak ada yang menunggu Anda',
      unread: 'Semua sudah ditangani',
    },
    emptyAll: 'Tidak ada apa-apa di sini',
    emptyDescription:
      'Notifikasi dan permintaan yang dikirim kepada Anda muncul di sini.',
    filters: 'Filter kotak masuk',
    forbidden: 'Anda tidak diizinkan melakukan ini.',
    keyMove: 'Pindahkan',
    keyOpen: 'Terbuka',
    kinds: {
      all: 'Semua jenis',
      decision: 'Keputusan',
      info: 'Sebelumnya',
      label: 'Jenis',
      today: 'Hari ini',
    },
    detailsUnavailable: 'Beberapa detail kotak masuk gagal dimuat.',
    loadFailed: 'Tidak dapat memuat kotak masuk',
    loadFailedDescription: 'Periksa koneksi Anda dan coba lagi.',
    loadMore: 'Muat lebih banyak',
    loading: 'Memuat',
    noMatchDescription: 'Hapus filter untuk melihat semua jenis.',
    nothingSelected: 'Pilih item untuk melihatnya',
    notification: 'Notifikasi',
    outcomes: {
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
    },
    pendingDecisions: '{{count}} menunggu',
    request: {
      approve: 'Setujui',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Tulis sesuatu…',
      newLine: 'untuk baris baru',
      quickSend: 'untuk mengirim',
      reject: 'Tolak',
    },
    requestFailed: 'Permintaan gagal. Coba lagi.',
    resolved: 'Ditangani',
    retry: 'Coba lagi',
    unread: 'Belum dibaca',
    unreadCount: '{{count}} belum dibaca',
  },
  inboxButton: {
    title: 'Kotak masuk',
    viewAll: 'Buka kotak masuk',
    empty: 'Belum ada pesan',
    pending: 'Kotak masuk, {{count}} menunggu',
    recent: 'Pesan terbaru',
    unread: 'Kotak masuk, {{count}} belum dibaca',
  },
  nav: {
    inbox: 'Kotak masuk',
  },
  common: { loading: 'Memuat' },
};

export default idID;
