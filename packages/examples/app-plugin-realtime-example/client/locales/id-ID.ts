import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Skenario waktu nyata',
    tabs: {
      tasks: 'Tugas',
      inbox: 'Kotak masuk',
      exports: 'Ekspor',
      lab: 'Lab kemampuan',
    },
    assignee: 'Penerima tugas',
    creator: 'Dibuat oleh',
    updated: 'Terakhir diperbarui',
    statusLabel: 'Status',
    detail: 'Detail tugas',
    saving: 'Menyimpan…',
    saved: 'Status tugas diperbarui',
    updating: 'Memperbarui…',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    close: 'Tutup',
    cancel: 'Batal',
    create: 'Buat',
    created: 'Membuat tugas "{{title}}"',
    status: {
      open: 'Yang harus dilakukan',
      'in-progress': 'Sedang berlangsung',
      done: 'Selesai',
    },
    actions: {
      'in-progress': 'Mulai',
      done: 'Selesai',
      open: 'Buka kembali',
    },
    form: {
      help: 'Jelaskan pekerjaannya dan pilih siapa yang harus menanganinya.',
      title: 'Judul',
      description: 'Deskripsi',
      choose: 'Pilih penerima tugas',
      titleRequired: 'Masukkan judul 1–200 karakter.',
      descriptionRequired: 'Jelaskan apa yang perlu dilakukan.',
      assigneeRequired: 'Pilih penerima tugas yang aktif.',
    },
    errors: {
      session: 'Sesi Anda telah berakhir. Masuk lagi.',
      forbidden:
        'Anda tidak lagi memiliki akses ke tugas ini. Tutup dan tanyakan kepada pembuatnya.',
      missing:
        'Catatan ini sudah tidak ada lagi. Tutup atau kembali ke daftar saat ini.',
      failed: 'Permintaan gagal. Silakan coba lagi.',
      active: 'Ekspor masih berjalan. Tunggu sampai selesai.',
    },
    read: 'Baca',
    unread: 'Belum dibaca',
    markRead: 'Tandai telah dibaca',
    markUnread: 'Tandai belum dibaca',
    markedRead: 'Notifikasi ditandai telah dibaca',
    markedUnread: 'Notifikasi ditandai belum dibaca',
    loadMore: 'Muat lebih banyak',
    jobs: {
      queued: 'Mengantri',
      running: 'Mengekspor',
      completed: 'Siap diunduh',
      failed: 'Gagal',
    },
    tasks: {
      title: 'Kolaborasi tugas',
      description:
        'Tetapkan pekerjaan dan ikuti kemajuannya bersama-sama dalam waktu nyata.',
      try: 'Coba dua jendela: buat tugas di sini, lalu lihat tugas itu muncul dan ubah status di jendela lainnya. Hanya tugas yang Anda buat atau tugaskan yang terlihat.',
      create: 'Tugas baru',
      empty: 'Belum ada tugas',
      emptyHelp:
        'Buat tugas nyata, tugaskan kepada diri Anda sendiri atau kolega, dan ikuti di sini.',
      stageEmpty: 'Tidak ada tugas dalam tahap ini di halaman ini',
      page: 'Halaman {{page}} · {{count}} tugas secara total. Kolom menampilkan hingga 30 tugas di halaman ini.',
    },
    inbox: {
      title: 'Kotak masuk pribadi',
      description:
        'Menerima penetapan tugas dan pembaruan, dan tetap menyinkronkan status baca di seluruh jendela.',
      try: 'Tetapkan tugas pada diri Anda sendiri untuk menerima pemberitahuan. Untuk kolaborasi, gunakan akun lain: pembaruan beri tahu peserta lain. Kotak masuk ini berisi semua notifikasi aplikasi Anda.',
      empty: 'Belum ada pemberitahuan',
      emptyHelp:
        'Buat tugas yang ditetapkan untuk Anda sendiri di Tasks, lalu kembali ke sini.',
    },
    exports: {
      missing:
        'File ekspor ini tidak lagi tersedia. Buat ekspor baru untuk mengunduh tugas Anda saat ini.',
      title: 'Ekspor tugas',
      description:
        'Ekspor tugas Anda yang terlihat di latar belakang dan unduh CSV yang dihasilkan.',
      try: 'Mulai ekspor, ganti halaman, lalu kembali untuk mendownloadnya. Jendela lain mengikuti pekerjaan yang sama. Kemajuan menghitung baris nyata; ekspor kecil mungkin segera selesai.',
      create: 'Ekspor tugas',
      empty: 'Belum ada ekspor',
      emptyHelp:
        'Hasilkan cuplikan CSV tugas Anda, termasuk deskripsi, status, dan penerima tugas.',
      accepted: 'Ekspor dimulai',
      active:
        'Ekspor sedang berlangsung. Anda dapat meninggalkan halaman ini dan kembali lagi nanti.',
      file: 'Tugas CSV',
      rows: 'Baris {{processed}} / {{total}} diproses',
      progress: 'Kemajuan ekspor',
      limit:
        'Ekspor melebihi 5.000 tugas. Contoh ini mendukung maksimal 5.000 baris per ekspor.',
      failed: 'Ekspor gagal. Gunakan tugas Ekspor untuk memulai upaya baru.',
      download: 'Unduh',
      downloaded: 'Pengunduhan CSV dimulai',
      retention:
        '20 ekspor terbaru Anda dipertahankan. Setiap file adalah cuplikan tugas yang dapat Anda akses saat dibuat.',
    },
  },
  routeOverlay: {
    close: 'Tutup',
  },
  title: 'Contoh waktu nyata',
  description:
    'Jelajahi langganan, kontrol akses, dan pemulihan dengan siaran langsung dan snapshot yang dapat diamati.',
  scope:
    'Nilai demo milik akun Anda, aktif dalam proses ini saja, dan disetel ulang setelah satu jam tidak aktif atau server dimulai ulang.',
  account: 'Rekening koran',
  loading: 'Memuat',
  working: 'Bekerja…',
  retry: 'Coba lagi',
  reload: 'Muat ulang demonstrasi',
  signIn: 'Masuk lagi',
  cancel: 'Batal',
  connection: 'Koneksi',
  subscription: 'Berlangganan',
  events: 'Acara diterima',
  ready: 'Ucapan Terima Kasih',
  snapshot: 'Cuplikan yang diamati',
  reads: 'Pembacaan snapshot selesai',
  readAt: 'Pembacaan terakhir yang berhasil',
  waiting: 'Menunggu acara pertama…',
  none: 'Belum tersedia',
  topic: 'Topik',
  receipt: 'Tanda terima publikasi terakhir',
  pause: 'Jeda langganan',
  resume: 'Lanjutkan berlangganan',
  reconnect: 'Hubungkan kembali',
  states: {
    idle: 'Menganggur',
    connecting: 'Menghubungkan',
    open: 'Buka',
    reconnecting: 'Menghubungkan kembali',
    closed: 'Tertutup',
    pending: 'Tertunda',
    subscribing: 'Berlangganan',
    subscribed: 'Berlangganan',
    error: 'Kesalahan',
  },
  clock: {
    title: '1. Topik publik dan React hook',
    description:
      'useRealtimeTopic berlangganan jam publik. Menjeda akan melepaskan jam tangan kartu ini.',
    latest: 'Waktu server terbaru',
    paused: 'Kartu ini dijeda. Lanjutkan untuk menerima tanda centang baru.',
    initial: 'Jam mulai diterbitkan ketika pelanggan pertamanya diakui.',
  },
  personal: {
    title: '2. Acara pribadi',
    description:
      'publikasikanUntuk menargetkan akun Anda. Tab lain dari akun ini menerima acara tersebut; akun lain tidak.',
    send: 'Kirim ke akun saya',
    empty: 'Belum ada acara pribadi. Kirim satu untuk mengamati pengiriman.',
    recovery:
      'onReady membaca cuplikan pribadi terbaru setelah setiap pengakuan.',
  },
  room: {
    title: '3. Otorisasi sumber daya dinamis',
    description:
      'Ruangan ini menggunakan kebijakan pemilik dan akses yang sama untuk pembacaan HTTP dan pengiriman waktu nyata.',
    allowed: 'Akses diberikan',
    denied: 'Akses ditolak',
    grant: 'Berikan akses',
    revoke: 'Cabut akses',
    retry: 'Coba lagi berlangganan',
    send: 'Publikasikan perubahan ruang',
    grantHint: 'Berikan akses, lalu coba lagi langganan yang ditolak.',
    retryHint: 'Akses diberikan. Coba lagi untuk mendapatkan pengakuan baru.',
    revokeTitle: 'Cabut akses ke ruang demo Anda?',
    revokeDescription:
      'Langganan yang ada kehilangan akses dan menghapus snapshot ruangan. Anda dapat memberikan akses lagi.',
    blocked: 'Cuplikan ruangan disembunyikan saat akses ditolak.',
    success: 'Akses kamar diperbarui',
  },
  counter: {
    title: '4. Gabungan penyegaran dan ketertinggalan',
    description:
      'Lima pembatalan memperbarui satu penghitung. useRealtimeRefresh menyatukan bacaan; bandingkan jumlah meningkat setelah kesiapan awal.',
    burst: 'Publikasikan 5 perubahan',
    pause: 'Jeda penyegaran langsung',
    resume: 'Lanjutkan penyegaran langsung',
    paused:
      'Penyegaran cuplikan dijeda; pengamat acara tetap aktif. Publikasikan lagi, lalu lanjutkan untuk mengejar ketinggalan.',
    running:
      'Penyegaran cuplikan aktif. Tab tersembunyi disegarkan saat terlihat kembali.',
    refreshing: 'Cuplikan yang menyegarkan…',
    note: 'Nilai ini hanya berasal dari pembacaan API, tidak pernah dari tanggapan publikasi.',
  },
  unknown: {
    title: '5. Kesalahan berlangganan',
    description:
      'Topik yang tidak diumumkan ditolak tanpa menghentikan topik yang diizinkan.',
    try: 'Cobalah topik yang tidak diketahui',
    explanation:
      'TOPIC_NOT_FOUND diharapkan di sini. Server harus mendeklarasikan suatu topik sebelum dapat berlangganan.',
    initial: 'Mulai upaya untuk mengamati kesalahan protokol yang sebenarnya.',
  },
  recovery: {
    title: '6. Pemulihan koneksi',
    description:
      'Putuskan sambungan soket lokal akun ini, termasuk tab lainnya. Klien menyambung kembali secara otomatis dan onReady mengambil kembali perubahan yang terlewat.',
    disconnect: 'Simulasikan pemutusan hubungan',
    history: 'Status koneksi terkini',
    note: 'Sambungkan kembali di bagian atas membuka kembali koneksi aplikasi bersama. Peristiwa bersifat sementara: status pemulihan snapshot tanpa pemutaran ulang.',
    instruction:
      'Publikasikan perubahan dari tab lain. Lanjutkan penyegaran yang dijeda untuk mengejar ketinggalan; menyambungkan kembali mengambil ulang snapshot saat penyegaran aktif.',
    disconnected: 'Soket waktu nyata terputus',
  },
  published: 'Publikasi diterima',
  errors: {
    request: 'Permintaan gagal. Coba lagi.',
    session: 'Sesi Anda telah berakhir. Masuk lagi.',
    forbidden: 'Akses ditolak. Periksa izin Anda saat ini.',
    expired:
      'Demonstrasi telah berakhir. Muat ulang untuk membuat ruangan baru.',
    capacity: 'Demonstrasi sedang sibuk. Coba lagi nanti.',
    subscription:
      'Langganan gagal. Sambungkan kembali atau coba lagi setelah akses dipulihkan.',
  },
};

export default idID;
