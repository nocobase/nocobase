import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Contoh surat',
    workspace: 'Kotak masuk dan tulis',
    accounts: 'Akun',
    allMail: 'Semua surat',
    activity: 'Kirim aktivitas',
    syncLogs: 'Sinkronisasi log',
  },
  workspace: {
    title: 'Kotak masuk dan tulis',
    description:
      'Membaca contoh pesan, memeriksa lampiran, membalas, atau menulis pesan baru. Penyedia tiruan menerima pengiriman tanpa menghubungi layanan email eksternal.',
  },
  activity: {
    title: 'Kirim aktivitas',
    description:
      'Tinjau catatan pengiriman yang dibuat oleh aliran pengiriman normal Mail. Penyedia tiruan menyimulasikan penerimaan dan Mail menyimpan pesan di folder Terkirim lokal.',
    subject: 'Subjek',
    recipients: 'Penerima',
    account: 'Mengirim akun',
    status: 'Status',
    created: 'Dikirim',
    noSubject: '(tanpa subjek)',
    loadFailed: 'Tidak dapat memuat aktivitas pengiriman.',
    emptyTitle: 'Belum ada aktivitas pengiriman',
    emptyDescription:
      'Kirim contoh pesan dari ruang kerja untuk melihat hasil simulasi pengirimannya di sini.',
    statuses: {
      pending: 'Tertunda',
      submitting: 'Mengirim',
      accepted: 'Diterima (simulasi)',
      failed: 'Gagal',
      unknown: 'Tidak diketahui',
      cancelled: 'Dibatalkan',
    },
  },
  providers: {
    demo: 'Gmail (tiruan)',
    'demo-microsoft': 'Microsoft 365 (tiruan)',
    'demo-imap-smtp': 'IMAP/SMTP (tiruan)',
  },
  accounts: {
    title: 'Akun kotak surat',
    description: 'Mempersiapkan contoh kotak surat dan pesannya.',
  },
  allMail: {
    title: 'Semua surat',
    description:
      'Jelajahi email yang diimpor dari kotak surat tiruan, cari berdasarkan kata kunci, dan periksa setiap akun pesan, baca status, bintang, dan metadata lampiran.',
    listTitle: 'Daftar pesan',
    resultCount: 'Pesan {{count}}',
    pageCount: 'Halaman {{page}} dari {{pages}}',
    searchLabel: 'Cari email',
    searchPlaceholder: 'Cari subjek, pengirim, atau isi pesan',
    search: 'Cari',
    account: 'Akun',
    from: 'Dari',
    subject: 'Subjek dan pratinjau',
    flags: 'Status pesan',
    date: 'Diterima',
    unread: 'Belum dibaca',
    starred: 'Berbintang',
    attachment: 'Lampiran',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    emptyTitle: 'Tidak ada pesan yang ditemukan',
    emptyDescription:
      'Coba kata kunci lain atau hapus pencarian untuk melihat semua pesan tiruan.',
    loadFailed: 'Tidak dapat memuat semua email.',
  },
  syncLogs: {
    title: 'Sinkronisasi log',
    description:
      'Tinjau riwayat dan sinkronisasi tambahan berjalan untuk tiga kotak surat tiruan, termasuk status, fase, jumlah yang diproses, dan kesalahan.',
    account: 'Akun kotak surat',
    mode: 'Mode sinkronisasi',
    status: 'Status',
    phase: 'Fase',
    progress: 'Kemajuan',
    started: 'Dimulai',
    completed: 'Selesai',
    error: 'Kesalahan',
    unknownAccount: 'Akun tidak dikenal',
    empty:
      'Belum ada sinkronisasi yang berjalan. Mulai sinkronisasi dari halaman akun.',
    loadFailed: 'Tidak dapat memuat log sinkronisasi.',
    pageCount: 'Halaman {{page}} dari {{pages}} · {{total}} berjalan',
    messages: 'Pesan {{count}} diproses',
    batches: 'kumpulan {{count}}',
    modes: {
      initial: 'Sinkronisasi awal',
      incremental: 'Sinkronisasi tambahan',
    },
    statuses: {
      pending: 'Tertunda',
      running: 'Sedang berjalan',
      completed: 'Selesai',
      partial: 'Sebagian',
      failed: 'Gagal',
      cancelled: 'Dibatalkan',
    },
    phases: {
      preparing: 'Mempersiapkan',
      history: 'Riwayat pesan',
      catchUp: 'Mengejar',
      incremental: 'Pembaruan tambahan',
      completed: 'Selesai',
    },
  },
  demo: {
    noPreview: 'Pratinjau tidak tersedia.',
    preparing: 'Mempersiapkan data kotak surat demo…',
    retry: 'Coba lagi pengaturannya',
    openWorkspace: 'Buka ruang kerja email',
    refresh: 'Segarkan',
    loading: 'Memuat…',
  },
};

export default idID;
