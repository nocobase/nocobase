import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  notificationTemplates: {
    contributor: 'Contoh notifikasi',
    category: 'Tugas',
    assigned: {
      name: 'Tugas ditetapkan',
      trigger: 'Sebuah tugas dibuat.',
      recipients:
        'Penerima tugas, bahkan jika mereka menetapkan tugas untuk diri sendiri.',
    },
    updated: {
      name: 'Tugas diperbarui',
      trigger: 'Sebuah tugas diubah, termasuk saat ditetapkan ulang.',
      recipients:
        'Pembuat, penerima tugas sebelumnya, dan penerima tugas baru, masing-masing sekali. Orang yang membuat perubahan tidak diberi tahu.',
    },
    businessRule:
      'Dikirim setiap kali aksi tugas terjadi. Tidak ada tombol terpisah untuk mematikannya.',
    languagePolicy: 'Selalu dalam bahasa Inggris, apa pun bahasa penerimanya.',
    channel: 'Kotak masuk tugas',
    variables: {
      title: 'Judul tugas',
      description: 'Deskripsi tugas',
      status: 'Status tugas',
    },
  },
  navigation: {
    tasks: 'Contoh pemberitahuan',
    taskManagement: 'Tugas',
    taskDetail: 'Detail tugas',
  },
  common: {
    close: 'Tutup',
    loading: 'Memuat…',
    saving: 'Menyimpan…',
  },
  fields: {
    title: 'Judul',
    description: 'Deskripsi',
    status: 'Status',
    assignee: 'Penerima tugas',
    creator: 'Pencipta',
    chooseAssignee: 'Pilih pengguna',
  },
  status: {
    open: 'Buka',
    'in-progress': 'Sedang berlangsung',
    done: 'Selesai',
  },
  tasks: {
    title: 'Tugas',
    description:
      'Tetapkan tugas kecil ke pengguna lain. Penerima tugas menerima pemberitahuan dalam aplikasi dengan ringkasan tugas dan dapat mengedit tugas dari halaman detail. Gunakan tombol notifikasi di bilah atas untuk membuka notifikasi pesan Anda.',
    listTitle: 'Semua tugas',
    listDescription: 'Semua tugas yang Anda buat atau tugaskan.',
    count: 'Catatan {{count}}',
    empty: 'Belum ada tugas.',
    assignee: 'Ditugaskan ke',
    columns: {
      title: 'Judul',
      description: 'Deskripsi',
      status: 'Status',
      creator: 'Pencipta',
      assignee: 'Penerima tugas',
      updatedAt: 'Terakhir diperbarui',
      actions: 'Tindakan',
    },
    view: 'Lihat detailnya',
    retryRead: 'Coba lagi',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    page: 'Halaman {{page}}',
    add: 'Tugas baru',
    drawerTitle: 'Tugas baru',
    drawerDescription:
      'Membuat tugas mengirimkan informasi dasarnya kepada penerima tugas.',
    create: 'Buat tugas',
    cancel: 'Batal',
  },
  taskDetail: {
    title: 'Detail tugas',
    summary: 'Detail tugas',
    createdAt: 'Dibuat',
    updatedAt: 'Terakhir diperbarui',
    notificationHint:
      'Setelah tugas disimpan, orang terkait selain editor saat ini akan diberitahu: pembuat dan penerima tugas saat ini. Jika penerima tugas berubah, penerima tugas sebelumnya dan baru akan diberitahu.',
    edit: 'Edit tugas',
    retryRead: 'Coba lagi',
    save: 'Simpan perubahan',
    cancel: 'Batal',
    back: 'Kembali ke tugas',
  },
};

export default idID;
