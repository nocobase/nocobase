import type { FoundationResource } from './en-US.js';

const idID: FoundationResource = {
  nav: {
    settings: 'Pengaturan sistem',
    foundation: 'Fondasi aplikasi',
  },
  page: {
    title: 'Fondasi aplikasi',
    description:
      'Aplikasi Anda berfokus pada bisnis. Data, izin, dan alur kerja didukung NocoBase Core: kemampuan umum yang dikembangkan, diuji, dipelihara oleh NocoBase, serta diperbarui melalui rilis resmi.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'Kemampuan yang digunakan menyala berurutan. Pilih satu untuk melihat perannya.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'kemampuan mendukung aplikasi',
    refresh: 'Segarkan',
    refreshing: 'Mengumpulkan…',
    updatedAt: 'Dikumpulkan {{time}}',
    loading: 'Mengumpulkan kemampuan…',
    refreshFailed:
      'Pembaruan gagal. Menampilkan hasil terakhir yang berhasil dikumpulkan.',
    loadFailed: 'Ringkasan tidak dapat dimuat.',
    forbidden:
      'Hanya administrator dengan akses tak terbatas yang dapat melihat halaman ini.',
    retry: 'Coba lagi',
    undetermined_one: '{{count}} kemampuan belum dapat ditentukan',
    undetermined_other: '{{count}} kemampuan belum dapat ditentukan',
    highlightsLabel: 'Angka utama',
    unavailable: 'Tidak tersedia',
    lowerBound: 'Nilai minimum: sebagian data tidak dapat dibaca.',
  },
  matrix: {
    collections: 'Koleksi data: {{names}}',
    title: 'Modul bisnis dan kemampuan fondasi',
    description:
      'Lihat kemampuan yang mendukung tiap modul. Pilih tanda centang untuk melihat dasar hubungan dan pekerjaan yang perlu dibuat sendiri.',
    modules: 'Modul bisnis',
    summary: '{{count}} kemampuan · {{pages}} halaman',
    inspect: 'Lihat {{module}} × {{capability}}',
    unknown: 'Belum dikenali',
    empty:
      'Belum ada modul yang ditemukan. Modul akan muncul otomatis saat halaman dan navigasi ditambahkan.',
    legend:
      '✓ Integrasi dikenali; · hubungan belum dikenali. Referensi kode menunjukkan dependensi, bukan jumlah eksekusi.',
    partial:
      'Beberapa dependensi halaman belum dapat dipastikan; hanya hubungan yang telah dikonfirmasi yang ditampilkan.',
    evidence: {
      page: 'Halaman terdaftar di aplikasi',
      authentication: 'Halaman memerlukan login',
      authorization: 'Akses halaman dikendalikan oleh izin',
      provider: 'Halaman disediakan penyedia ini',
      source: 'Penyedia dirujuk oleh kode halaman',
      apiSource: 'Penyedia dirujuk oleh penangan API yang sesuai',
    },
  },
  inventory: {
    recognitionNotes: 'Catatan identifikasi',
    title: 'Kemampuan dan penyedia',
    description:
      'Kemampuan mencerminkan inti, plugin resmi dan Pro, serta ekstensi yang terhubung ke aplikasi.',
    discovered: 'paket penyedia ditemukan',
    mapped: 'paket penyedia terklasifikasi',
    unmapped: 'menunggu klasifikasi',
    partial: 'Penemuan belum lengkap. Tidak dapat membaca: {{sources}}.',
    selectedCategory: 'Penyedia untuk {{category}}',
    usageBoundary:
      'Status berlaku untuk seluruh kategori, bukan bukti bahwa setiap paket telah diaktifkan, dikonfigurasi, atau digunakan.',
    noCategoryProviders:
      'Katalog saat ini belum mengenali penyedia untuk kategori ini.',
    extensionsTitle: 'Penyedia tambahan · menunggu identifikasi',
    extensionsDescription:
      'Penyedia tanpa kategori tetap terlihat. Tidak otomatis dianggap integrasi eksternal atau belum digunakan.',
    noExtensions: 'Tidak ditemukan penyedia tambahan dalam cakupan saat ini.',
    discoveryBoundary:
      'Cakupan: dependensi langsung, penyedia yang dikenal, kontribusi basis data dan API terusan publik, serta kontribusi klien yang diamati di peramban. Tidak mencakup semua kontribusi runtime, ekstensi tidak langsung, atau modul lokal. Asal dan edisi Pro memerlukan katalog tepercaya; nama dan lisensi saja tidak cukup.',
    versionUnknown: 'Versi tidak tersedia',
    origin: 'Asal',
    officialCatalog: 'Katalog NocoBase',
    unverifiedOrigin: 'Asal belum diverifikasi',
    installation: 'Pemasangan',
    installed: 'Manifes ditemukan',
    manifestUnavailable: 'Manifes tidak tersedia',
    registration: 'Pendaftaran',
    observed: 'Kontribusi runtime saat ini teramati',
    registrationUnknown: 'Belum dipastikan · bukan berarti dinonaktifkan',
    evidence: 'Bukti',
    noEvidence: 'Belum ada bukti terkonfirmasi',
    categories: 'Kategori',
    awaitingRecognition: 'Menunggu klasifikasi',
    evidenceLabels: {
      manifest: 'Manifes paket terpasang',
      databaseContribution: 'Kontribusi tugas basis data',
      apiContribution: 'Kontribusi API terusan',
      foundationRuntime: 'Layanan fondasi berjalan',
      clientContribution: 'Kontribusi klien teramati di peramban',
      serverRegistration: 'Pendaftaran plugin server',
    },
  },
  status: {
    active: 'Digunakan',
    needsSetup: 'Siap, perlu konfigurasi',
    unused: 'Belum digunakan',
    undetermined: 'Belum ditentukan',
    legendActive: 'Digunakan {{count}}',
    legendNeedsSetup: 'Perlu konfigurasi {{count}}',
    legendUnused: 'Belum digunakan {{count}}',
  },
  detail: {
    collectionCount: '{{count}} tabel',
    collectionPreview: 'Pratinjau tabel',
    collectionsTitle: 'Tabel',
    noCollectionMatches: 'Tidak ada tabel yang cocok',
    noCollectionMatchesHint: 'Coba nama lain atau kosongkan pencarian.',
    collectionRange: '{{from}}–{{to}} dari {{total}}',
    closeCollections: 'Tutup daftar tabel',
    viewCollections: 'Lihat semua koleksi',
    searchCollections: 'Cari koleksi',
    collectionResults: '{{count}} koleksi cocok',
    previousPage: 'Sebelumnya',
    nextPage: 'Berikutnya',
    countRecords: 'Hitung catatan bisnis',
    recordsOnDemand:
      'Catatan bisnis dihitung sesuai permintaan. Basis data besar mungkin memerlukan waktu lebih lama.',
    recordsCountedAt: 'Catatan dihitung {{time}}',

    businessModules: 'Modul bisnis terkait',
    inThisApp: 'Dalam aplikasi ini',
    withoutFoundation: 'Tanpa fondasi',
    onceInUse: 'Setelah digunakan',
    whyNot: 'Alasan belum digunakan',
    liveData: 'Data aktual',
    parts: 'Komponen',
    packages: 'Disediakan paket NocoBase',
    noPackages: 'Belum ada paket kemampuan ini yang terpasang.',
    noFacts: 'Belum ada fakta terkonfirmasi.',
    partial:
      'Sebagian bukti tidak dapat dibaca; nilai minimum hanya menghitung data yang terbaca.',
    failed: 'Kemampuan ini belum dapat diperiksa. Segarkan untuk mencoba lagi.',
    unreadable: 'Tidak dapat membaca: {{sources}}',
    timeout: 'Pemeriksaan melewati batas waktu.',
  },
  capabilities: {
    dataModeling: {
      name: 'Pemodelan data',
      tagline: 'Koleksi, kolom, relasi, dan migrasi',
      without:
        'Perlu membuat perubahan skema, kueri, filter, paginasi, perlindungan injeksi, dan kompatibilitas basis data sendiri.',
      onceInUse:
        'Migrasi mendefinisikan koleksi dengan antarmuka kueri seragam untuk basis data yang didukung.',
    },
    files: {
      name: 'Pengelolaan berkas',
      tagline: 'Unggahan, penyimpanan, dan lampiran',
      without:
        'Perlu membuat unggahan, adaptor, pemeriksaan ukuran dan jenis, serta tautan unduhan sendiri.',
      onceInUse: 'Kontrak koleksi dan penyimpanan seragam mengelola lampiran.',
    },
    usersAndOrganizations: {
      name: 'Pengguna dan organisasi',
      tagline: 'Akun, masuk, dan undangan',
      without:
        'Perlu membuat pendaftaran, sesi, pemulihan kata sandi, dan pengelolaan akun yang aman sendiri.',
      onceInUse: 'Akun, proses masuk, dan undangan dikelola terpusat.',
    },
    permissions: {
      name: 'Izin',
      tagline: 'Kumpulan izin dan aturan akses',
      without:
        'Perlu memeriksa akses pada setiap API tanpa pengelolaan terpusat.',
      onceInUse:
        'Kumpulan izin mengatur halaman, data, dan tindakan, diperiksa server pada setiap permintaan.',
    },
    workflows: {
      name: 'Alur dan persetujuan',
      tagline: 'Siklus hidup, transisi, dan jadwal',
      without:
        'Perlu membuat status, transisi, riwayat, percobaan ulang, dan batas waktu sendiri.',
      onceInUse:
        'Siklus hidup menyediakan transisi terkendali, riwayat, dan efek dengan percobaan ulang.',
    },
    aiAgents: {
      name: 'AI dan agen',
      tagline: 'Layanan model, agen, dan pelaksana',
      without:
        'Perlu mengintegrasikan model, melindungi kunci, mencatat penggunaan, dan menjalankan agen secara aman.',
      onceInUse:
        'Aktifkan layanan model untuk OnlineAgent dan gateway model, atau daftarkan pelaksana untuk menjalankan agen.',
    },
    knowledge: {
      name: 'Basis pengetahuan',
      tagline: 'Ruang, dokumen, dan pencarian',
      without:
        'Perlu membuat penyimpanan dokumen, versi, akses, dan pencarian sendiri.',
      onceInUse:
        'Ruang mengelola dokumen, versi, dan akses untuk pengguna dan agen.',
    },
    mail: {
      name: 'Email',
      tagline: 'Kotak surat, sinkronisasi, dan pengiriman',
      without:
        'Perlu menghubungkan layanan, menyinkronkan folder, mengelola otorisasi, dan mengirim ulang sendiri.',
      onceInUse:
        'Hubungkan kotak surat untuk membaca, menyinkronkan, dan mengirim dalam aplikasi.',
    },
    notifications: {
      name: 'Notifikasi',
      tagline: 'Kanal, pengiriman, dan pesan internal',
      without:
        'Perlu membuat pengiriman, percobaan ulang, deduplikasi, dan riwayat untuk setiap kanal.',
      onceInUse:
        'Kanal terkonfigurasi menyediakan pengiriman dengan percobaan ulang, deduplikasi, dan riwayat.',
    },
    integrations: {
      name: 'Integrasi',
      tagline: 'Kunci API dan akses eksternal',
      without:
        'Perlu menerbitkan dan memeriksa kredensial untuk setiap sistem eksternal.',
      onceInUse: 'Sistem eksternal memakai kunci API dengan izin pemiliknya.',
    },
    interface: {
      name: 'Antarmuka dan konfigurasi',
      tagline: 'Halaman, navigasi, bahasa, dan tema',
      without:
        'Perlu membuat perutean, menu, terjemahan, dan tema sebelum halaman bisnis.',
      onceInUse: 'Klien NocoBase menyediakan halaman, menu, bahasa, dan tema.',
    },
    audit: {
      name: 'Log audit',
      tagline: 'Catatan operasi sensitif',
      without:
        'Perlu mencatat sendiri siapa yang melakukan setiap perubahan penting.',
      onceInUse: 'Catatan terpusat menyimpan operasi sensitif aplikasi.',
    },
    operations: {
      name: 'Operasional',
      tagline: 'Migrasi, tugas, antrean, dan rahasia',
      without:
        'Perlu mengelola peningkatan, tugas latar, antrean, dan penyimpanan rahasia sendiri.',
      onceInUse:
        'Server menyediakan migrasi tercatat, tugas, antrean, dan pengelolaan rahasia.',
    },
  },
  reasons: {
    installedNotUsed:
      'Sudah terpasang, tetapi belum ditemukan bukti pengaktifan atau penggunaan saat ini.',
    noRecognizedAudit:
      'Katalog saat ini belum mengenali penyedia audit; ekstensi lain mungkin menyediakannya.',
    noDatabase: 'Aplikasi berjalan tanpa basis data.',
    notRegistered: 'Plugin penyedia belum terdaftar dalam aplikasi.',
    notProvided: 'NocoBase Core belum menyediakan kemampuan ini.',
    noFileCollection: 'Belum ada koleksi yang menyimpan berkas.',
    noDrive: 'Ada koleksi berkas, tetapi penyimpanan belum dikonfigurasi.',
    noAccounts: 'Aplikasi belum memiliki akun.',
    onlyUnrestrictedAccess:
      'Hanya administrator memiliki akses tak terbatas; belum ada izin untuk pengguna lain.',
    noWorkflows: 'Belum ada siklus hidup tersimpan atau jadwal aktif.',
    noSchedules: 'Belum ada jadwal aktif.',
    noModelOrRunner: 'Belum ada layanan model aktif atau pelaksana terdaftar.',
    noModelService: 'Belum ada layanan model aktif.',
    noAgent: 'Belum ada agen yang didefinisikan.',
    noDocuments: 'Ruang pengetahuan belum memiliki dokumen.',
    noConnectedMailbox: 'Belum ada kotak surat terhubung.',
    noChannel: 'Belum ada kanal notifikasi terkonfigurasi.',
    noApiKey: 'Belum ada kunci API.',
    noUsedApiKey: 'Ada kunci API, tetapi belum digunakan.',
    noClient: 'Aplikasi tidak menyediakan klien NocoBase.',
    notConfigured: 'Belum dikonfigurasi.',
  },
  facts: {
    collectionOwnershipUnknown:
      'Ditemukan ekstensi runtime tanpa klasifikasi. Kepemilikan koleksi belum pasti; angka bisnis disembunyikan.',
    noApplicationCollections:
      'Lapisan data berjalan, aplikasi belum memiliki koleksi sendiri.',
    applicationCollectionsPreview:
      'Aplikasi ini memiliki {{count}} koleksi, termasuk {{names}}.',
    applicationCollections: '{{count}} koleksi milik aplikasi: {{names}}.',
    relations: '{{count}} relasi menghubungkannya.',
    fileCollections: '{{count}} koleksi berkas: {{names}}.',
    accounts: '{{count}} akun memakai autentikasi NocoBase.',
    permissionSets:
      '{{count}} kumpulan izin selain akses tak terbatas: {{names}}.',
    accessRules: '{{count}} aturan berbagi, pembatasan, atau akses bawaan.',
    lifecyclesWithoutTransitions:
      'Penyimpanan siklus hidup siap, belum ada transisi.',
    lifecycles:
      '{{count}} siklus hidup mencatat {{transitions}} transisi: {{names}}.',
    schedules: '{{count}} jadwal aktif.',
    modelServices:
      '{{count}} layanan model aktif mendukung OnlineAgent dan panggilan gateway model.',
    runners: '{{count}} pelaksana terdaftar mendukung eksekusi agen.',
    agents: '{{count}} agen, {{runs}} eksekusi.',
    documents: '{{count}} dokumen pengetahuan.',
    mailboxes: '{{count}} kotak surat terhubung.',
    mailboxesNeedAttention:
      '{{count}} kotak surat memerlukan tindakan agar sinkronisasi berlanjut.',
    channels: '{{count}} kanal notifikasi: {{names}}.',
    usedApiKeys: '{{count}} kunci API telah memanggil aplikasi.',
    locales: '{{count}} bahasa: {{names}}.',
    migrations: '{{count}} migrasi dijalankan, {{own}} milik aplikasi.',
    latestMigration: 'Eksekusi terakhir: {{at}}.',
    registeredExtension: 'Ekstensi terdaftar dalam aplikasi ini.',
  },
  parts: {
    accounts: 'Akun',
    organizations: 'Organisasi',
    permissionSets: 'Kumpulan izin',
    sharingRules: 'Aturan berbagi',
    restrictionRules: 'Aturan pembatasan',
    defaultAccess: 'Akses bawaan',
    lifecycles: 'Siklus hidup',
    schedules: 'Jadwal',
    modelServices: 'Layanan model',
    agents: 'Agen',
    runners: 'Pelaksana',
    migrations: 'Migrasi',
    jobs: 'Tugas',
    queue: 'Antrean',
    secrets: 'Rahasia',
    caching: 'Cache',
  },
  metrics: {
    businessRecords: 'catatan bisnis',
    businessCollections: 'koleksi bisnis',
    views: 'tampilan',
    fields: 'kolom',
    relations: 'relasi',
    systemCollections: 'koleksi sistem NocoBase',
    files: 'berkas',
    storedBytes: 'penyimpanan tercatat',
    fileCollections: 'koleksi berkas',
    accounts: 'akun',
    disabledAccounts: 'akun nonaktif',
    invitations: 'undangan',
    grants: 'pemberian izin',
    permissionSets: 'kumpulan izin',
    assignments: 'penetapan',
    sharingRules: 'aturan berbagi',
    restrictionRules: 'aturan pembatasan',
    defaultAccess: 'aturan akses bawaan',
    transitions: 'transisi status',
    lifecycles: 'siklus hidup dengan transisi',
    effectsSucceeded: 'efek berhasil',
    effectsFailed: 'efek gagal',
    effectsPending: 'efek menunggu',
    schedules: 'jadwal aktif',
    scheduleOccurrences: 'kejadian jadwal',
    agents: 'agen',
    modelServices: 'layanan model aktif',
    runners: 'pelaksana',
    runs: 'eksekusi',
    modelCalls: 'panggilan model di luar eksekusi',
    tokens: 'token',
    documents: 'dokumen',
    spaces: 'ruang pengetahuan',
    chunks: 'potongan',
    connectedMailboxes: 'kotak surat terhubung',
    mailboxesNeedAttention: 'kotak surat perlu tindakan',
    messages: 'pesan',
    submissions: 'pesan diajukan untuk dikirim',
    failedSubmissions: 'pengiriman gagal',
    acceptedDeliveries: 'pengiriman diterima penyedia',
    notifications: 'notifikasi',
    deliveries: 'pengiriman',
    failedDeliveries: 'pengiriman gagal',
    pendingDeliveries: 'pengiriman berlangsung',
    deliveryAttempts: 'percobaan pengiriman',
    inAppMessages: 'pesan internal',
    inAppMessagesRead: 'pesan internal dibaca',
    channels: 'kanal',
    usedApiKeys: 'kunci API digunakan',
    apiKeys: 'kunci API aktif',
    locales: 'bahasa',
    migrations: 'migrasi dijalankan',
    applicationMigrations: 'migrasi milik aplikasi',
    seeds: 'seed dijalankan',
  },
  dynamic: {
    pending: 'Menunggu identifikasi',
    pendingDescription:
      'Plugin telah terdaftar. Konfigurasi dan penggunaan aktual belum ditentukan.',
  },
};

export default idID;
