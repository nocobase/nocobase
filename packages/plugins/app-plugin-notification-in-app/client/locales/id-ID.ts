import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Kotak masuk pribadi',
    title: 'Pusat pesan',
    unreadCount: '{{count}} belum dibaca',
    description: 'Pembaruan dari aplikasi dan alur kerja yang Anda gunakan.',
    markAllRead: 'Tandai semua telah dibaca',
    messagesTitle: 'Pesan',
    messagesDescription:
      'Pesan dalam aplikasi menjaga status baca independen untuk pengguna saat ini.',
    unreadFilter: 'Belum dibaca',
    unavailable: 'Kotak masuk tidak tersedia',
    retry: 'Coba lagi',
    loading: 'Memuat notifikasi…',
    emptyTitle: 'Kalian semua sudah terjebak',
    emptyDescription: 'Notifikasi baru akan muncul di sini.',
    loadingMore: 'Memuat…',
    loadMore: 'Muat lebih banyak',
    scrollMore: 'Gulir ke bawah untuk memuat lebih banyak',
    noMore: 'Tidak ada lagi pesan',
    expand: 'Tampilkan lebih banyak',
    collapse: 'Tampilkan lebih sedikit',
    channel: 'Dalam aplikasi',
    open: 'Buka',
    markUnread: 'Tandai belum dibaca',
    markRead: 'Tandai telah dibaca',
    delete: 'Hapus notifikasi',
    errors: {
      update: 'Pembaruan kotak masuk gagal.',
      loadMore: 'Tidak dapat memuat notifikasi lainnya.',
      markAllRead: 'Tidak dapat menandai notifikasi sebagai telah dibaca.',
    },
  },
};

export default idID;
