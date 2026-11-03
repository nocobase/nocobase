import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      'Gunakan akun di bawah ini sebagai pengganti administrator. Administrator melewati batasan tersebut. Ini adalah latihan kolaborasi penjualan independen, bukan alur kerja persetujuan penawaran harga yang lengkap. Setiap latihan dimulai dari status rekor yang diunggulkan.',
    read: {
      title: 'Seorang asisten berkonsultasi dengan informasi proyek',
      steps:
        'Masuk sebagai sales_assistant: Proyek menampilkan project-1, project-2, dan project-3, tetapi tidak ada tindakan edit. Penawaran dan pesanan tetap terbatas pada proyek yang dimiliki.',
      reason:
        'Pembagian proyek memberikan catatan hibah hanya untuk dilihat; itu tidak memberikan pengeditan atau catatan terkait. project-4 rahasia tetap dikecualikan.',
    },
    scopes: {
      title: 'Seorang insinyur mempersiapkan dan mengirimkan penawaran',
      steps:
        'Masuk sebagai sales_engineer: edit dan kirimkan quote-2 Anda. Anda boleh berkonsultasi dengan quote-5, namun tidak dapat mengubah atau mengirimkan penawaran harga rekanan. Anda dapat melanjutkan persiapan quote-6, namun tidak dapat mengirimkannya untuk proyek di luar wilayah Anda.',
      reason:
        'Kutipan yang tidak bersifat rahasia merupakan bahan referensi internal lintas wilayah. Pembuatnya memiliki konten; tanggung jawab regional mengatur penyerahan. Melihat tidak mengizinkan pengeditan. Pesanan yang ada merujuk pada kutipan terpisah yang diterima; mengirimkan kutipan latihan tidak membuat pesanan.',
    },
    handover: {
      title: 'Seorang insinyur yang didelegasikan mengambil alih penawaran',
      steps:
        'Pemilik proyek wilayah Selatan menyerahkan quote-7 kepada sales_proposal, seorang insinyur dari wilayah Utara. Masuk sebagai sales_proposal, edit kutipan dan kirimkan. Sebagai administrator, atur ulang catatan dan hapus sales_proposal dari aturan pembagian serah terima penawaran Proposal. Masuk lagi: akun tidak dapat lagi mengedit atau mengirimkan penawaran ini.',
      reason:
        'Serah terima mengizinkan pengeditan dan penyerahan kutipan ini ditambah akses proyek yang diperlukan untuk penyerahan; itu tidak mendelegasikan seluruh wilayah Selatan. Peran insinyur memberikan operasi, sementara berbagi mengidentifikasi catatan. Sebagai latihan lanjutan, tarik cakupan proyek atau penawaran: penyerahan memerlukan keduanya.',
    },
    delivery: {
      title: 'Seorang spesialis pengiriman memenuhi pesanan',
      steps:
        'Masuk sebagai sales_delivery. Buka order-2, tetapkan operator, kelola cek, dan masukkan referensi pengiriman. Setelah mengonfirmasi pengiriman, baik hubungan maupun status pengirimannya tidak dapat diubah lagi. Atur ulang catatan sebelum mengulangi latihan.',
      reason:
        'Staf pengiriman hanya memasukkan Pesanan; tautan ke kutipan dan proyek tidak memberikan akses ke halaman tersebut.',
    },
  },
  reset: {
    action: 'Reset catatan latihan',
    cancel: 'Batal',
    confirm:
      'Kembalikan proyek, penawaran, dan pesanan unggulan untuk setiap akun demo? Perubahan pada catatan tersebut akan ditimpa.',
    description:
      'Administrator dapat mengatur ulang catatan bisnis di sini sebelum mengulangi latihan. Pengaturan akun dan izin dipertahankan; memulihkan perubahan otorisasi apa pun secara manual.',
    done: 'Catatan latihan dipulihkan. Segarkan semua daftar rekaman yang terbuka.',
  },
  access: {
    title: 'Peranmu',
    direct: 'Penugasan langsung',
    coverage:
      'Setiap akun contoh mempunyai tanggung jawab pekerjaannya melalui penugasan langsung.',
  },
  rules: {
    public: 'Kecualikan proyek rahasia',
    delivery: 'Pesanan regional untuk pengiriman',
    handover: 'Penyerahan kutipan proposal',
    projects: 'Berbagi contoh proyek',
  },
  accountMenus: {
    assistant: 'Proyek, penawaran dan pesanan (hanya baca)',
    engineer:
      'Konsultasikan kutipan non-rahasia; edit kutipan sendiri dan kirimkan dalam wilayah yang ditentukan',
    manager: 'Kelola proyek milik; penawaran dan pesanan hanya dapat dibaca',
    delivery: 'Perintah saja; mengkonfirmasi pengiriman regional',
    proposal: 'Edit dan kirimkan quote-7 yang telah diserahkan',
    coordinator: 'Kelola project-8, di luar wilayah asal',
  },
  relations: {
    access: {
      notGranted: 'Hanya baca: koordinasi pengiriman tidak diberikan.',
      outsideScope: 'Hanya baca: pesanan ini di luar cakupan pengiriman Anda.',
      notReady: 'Pesanan yang sudah dikirim tidak dapat diubah.',
    },
    title: 'Memesan hubungan',
    description:
      'Tetapkan operator aktif, pertahankan pemeriksaan, dan kelola operator yang berkolaborasi. Coba akun pengiriman dan akun hanya baca untuk membandingkan akses.',
    order: 'Pesanan',
    carrier: 'Perusahaan pengangkut',
    unassigned: 'Tidak ada yang ditugaskan',
    assign: 'Tetapkan operator',
    disconnect: 'Batalkan penugasan',
    checks: 'Cek pengiriman',
    done: 'Selesai',
    pending: 'Tertunda',
    toggle: 'Beralih penyelesaian',
    delete: 'Hapus item pemeriksaan',
    checkTitle: 'Periksa judul',
    add: 'Tambahkan cek',
    collaborators: 'Operator yang berkolaborasi',
    note: 'Catatan kolaborasi',
    addProposal: 'Tambahkan operator yang dipilih',
    replace: 'Ganti dengan pembawa yang dipilih',
    clear: 'Hapus semua kolaborator',
    unavailable: 'Hubungan ini tidak dapat diakses.',
    loading: 'Memuat hubungan…',
  },
  sales: {
    manageRelations: 'Mengatur pengiriman pesanan',
    saveFirst: 'Simpan perubahan sebelum mengirimkan.',
    states: {
      draft: 'Draf',
      submitted: 'Dikirim',
      accepted: 'Diterima',
      ready: 'Siap',
      delivered: 'Terkirim',
    },
    errors: {
      session: 'Sesi berakhir. Masuk lagi.',
      input: 'Periksa jumlah dan kolom yang wajib diisi.',
      conflict: 'Status rekaman berubah. Segarkan sebelum mencoba lagi.',
      request: 'Permintaan gagal. Periksa koneksi Anda dan coba lagi.',
    },
    operation: {
      outsideScope: 'Di luar lingkup operasi yang diizinkan',
      notReady: 'Hanya pesanan siap pakai yang dapat dikirimkan',
      allowed: 'Dalam lingkup penyerahan',
      notGranted: 'Hanya baca — operasi tidak diberikan',
      quoteScope: 'Di luar cakupan kutipan yang diizinkan',
      projectScope: 'Proyek di luar cakupan yang diizinkan',
      notDraft: 'Hanya draf yang dapat diserahkan',
      invalidAmount: 'Jumlahnya harus positif',
    },
    preparedBy: 'Disiapkan oleh',
    parentProject: 'Proyek',
    sourceQuote: 'Kutipan sumber',
    relationships: 'Catatan terkait',
    relatedQuotes: 'Kutipan proyek',
    relatedOrders: 'Perintah proyek',
    filtered: 'Difilter berdasarkan',
    clearFilter: 'Hapus filter',
    noPageAccess: 'Tidak ada akses halaman',
    descriptions: {
      projects:
        'Buka penawaran dan pesanan terkait dari suatu proyek. Daftar terkait hanya memperlihatkan rekaman yang dapat diakses akun ini.',
      quotes:
        'Sebuah proyek dapat memiliki beberapa kutipan. Pengajuan memeriksa ruang lingkup proyek dan pembuat penawaran secara independen, kemudian memvalidasi status dan jumlah draf.',
      orders:
        'Setiap pesanan merujuk pada kutipan sumber dan proyeknya. Akun pengiriman hanya memasukkan Pesanan; referensi tidak memberikan akses ke halaman atau catatan lain.',
    },
    delivery: 'Pengiriman',
    orders: 'Pesanan',
    editProject: 'Edit informasi proyek',
    editQuote: 'Edit harga',
    submit: 'Kirimkan penawaran',
    submitScopes: {
      projects: 'Proyek yang ditautkan ke kutipan',
      quotes: 'Kutipan diperbolehkan untuk dikirimkan',
    },
    deliver: 'Konfirmasikan pengiriman',
    amount: 'Jumlah',
    status: 'Status',
    deliveryReference: 'Referensi pengiriman',
    group: 'Kolaborasi penjualan',
    title: 'Contoh izin penjualan',
    projects: 'Proyek',
    quotes: 'Penawaran',
    view: 'Lihat',
    edit: 'Edit catatan',
    intro:
      'Jelajahi batas akses catatan konsultasi asisten, insinyur yang menyiapkan penawaran, penyerahan penawaran harga yang didelegasikan, dan staf pengiriman yang memenuhi pesanan.',
    record: 'Rekaman',
    notes: 'Catatan',
    save: 'Simpan',
    refresh: 'Segarkan',
    loading: 'Memuat…',
    empty: 'Tidak ada catatan yang dapat diakses',
    readOnly: 'Hanya baca',
    saved: 'Tersimpan',
    scope: {
      prepared: 'Kutipan yang saya siapkan',
      title: 'Cakupan data penjualan',
      unrestricted: 'Tidak ada batasan',
      region: 'Wilayah saya',
      own: 'Proyek induk milik saya',
      public: 'Proyek non-rahasia',
    },
  },
  title: 'Contoh izin penjualan',
  overview: 'Panduan',
  actions: 'Tindakan',
  testAccounts: 'Contoh akun',
  account: 'Akun',
  permissionSet: 'Izin ditetapkan',
  password: 'Contoh kata sandi: AuthzExample123!',
  tryTitle: 'Konfigurasikan dan verifikasi',
  roles: {
    assistant: 'Asisten penjualan',
    engineer: 'Insinyur penjualan',
    manager: 'Manajer proyek',
    delivery: 'Spesialis pengiriman',
  },
  forbidden: 'Anda tidak memiliki izin untuk operasi ini.',
  error: 'Gagal memuat. Silakan coba lagi.',
};

export default idID;
