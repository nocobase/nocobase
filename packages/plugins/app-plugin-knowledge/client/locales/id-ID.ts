import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  indexing: {
    failedDocumentCount: 'Dokumen gagal: {{count}}',
    enabled: 'Aktifkan pengindeksan',
    enabledHint:
      'Nonaktifkan untuk hanya menggunakan pencarian teks. Perubahan berlaku setelah disimpan.',
    chooseInstance: 'Pilih instans indeks',
    documentProgress: 'Dokumen terindeks',
    pendingDocuments: 'Dokumen tertunda',
    failedDocuments: 'Dokumen gagal',
    preparedChunks: 'Potongan disiapkan',
    committedChunks: 'Potongan dikomit',
    agentPrompt:
      'Bantu saya mengonfigurasi indeks basis pengetahuan di aplikasi NocoBase 3 ini.\n\nBaca AGENTS.md dan periksa jenis indeks (type) yang benar-benar tersedia. Ada dua opsi basis data vektor: SQLite dengan sqlite-vec (type sqlite-vec, berkas lokal) dan PostgreSQL dengan pgvector (type pgvector, memerlukan ekstensi vector). Jelaskan opsi dan kebutuhannya sesuai lingkungan ini lalu biarkan saya memilih sebelum melanjutkan.\n\nSetelah saya memilih, tanyakan lokasi berkas untuk SQLite atau detail koneksi dan kesiapan ekstensi vector untuk PostgreSQL. Jangan tampilkan kata sandi atau kunci API.\n\nTunjukkan rencana konfigurasi dan minta konfirmasi sebelum menuliskannya ke knowledge.indexing dalam config.yaml. Pertahankan pengaturan lain. Jika aplikasi sudah memakai config.yml, edit berkas itu tanpa membuat berkas baru.\n\nValidasi konfigurasi dengan aman dan jelaskan cara memulai ulang aplikasi. Minta izin sebelum memulai ulang atau memasang dependensi. Kemudian pandu saya membuka kembali pengaturan, mengaktifkan indeks, memilih instans serta model embedding dan menyimpan. Panggilan model berbayar dan pembangunan ulang indeks juga memerlukan konfirmasi saya.',
    databases: {
      sqlite: {
        name: 'Basis data vektor SQLite',
        description:
          'Menggunakan ekstensi vektor sqlite-vec untuk menyimpan indeks dalam berkas SQLite lokal di server aplikasi. Tidak memerlukan layanan basis data terpisah; cocok untuk satu server.',
      },
      pgvector: {
        name: 'Basis data vektor PostgreSQL',
        description:
          'Menggunakan pgvector untuk menyimpan dan mencari vektor di PostgreSQL. Memerlukan koneksi basis data dan ekstensi vector aktif. Cocok untuk PostgreSQL yang sudah tersedia atau indeks bersama beberapa server.',
      },
    },
    setupTitle: 'Langkah konfigurasi',
    setup: {
      instance:
        'Buka config.yaml dan tambahkan instans di knowledge.indexing dengan nama, jenis dan lokasi berkas lokal atau detail koneksi.',
      restart:
        'Simpan berkas lalu mulai ulang aplikasi untuk memuat konfigurasi.',
      enable:
        'Buka kembali pengaturan indeks, aktifkan, pilih instans baru dan model embedding lalu simpan.',
    },
    agentHandoff:
      'Jika belum terbiasa dengan berkas konfigurasi, salin prompt berikut untuk meminta bantuan Agent pengembangan.',
    global: 'Semua ruang pengetahuan',
    back: 'Kembali ke pengetahuan',
    configuration: 'Konfigurasi indeks',
    typeHint:
      'Instans dikelompokkan menurut type. Setiap tipe menentukan formulir dan kebutuhan model Embedding.',
    typeForm: 'Formulir dinamis dari tipe ini',
    openPage: 'Buka halaman pengaturan',
    emptyTitle: 'Konfigurasikan basis data vektor terlebih dahulu',
    emptyDescription:
      'Indeks memerlukan basis data vektor untuk menyimpan dan mencari vektor dokumen. Pilih salah satu opsi berikut dan tambahkan ke config.yaml aplikasi:',
    agentTitle: 'Prompt konfigurasi',
    copyPrompt: 'Salin petunjuk konfigurasi',
    promptCopied: 'Petunjuk disalin. Tidak ada operasi dijalankan.',
    promptCopyFallback:
      'Penyalinan otomatis tidak tersedia. Teks dipilih untuk disalin manual.',
    promptLabel: 'Petunjuk untuk Agent pengembangan',
    rebuildHint: 'Perubahan memerlukan pembangunan ulang',
    editHint: 'Ubah konfigurasi untuk menyimpan',
    confirmRetryEmbedding:
      'Coba ulang hanya dokumen gagal di semua ruang. Pekerjaan selesai tidak diulang; biaya Embedding mungkin berlaku.',
    confirmRetry:
      'Coba ulang hanya dokumen gagal di semua ruang. Pekerjaan selesai tidak diulang, tetapi sumber daya layanan digunakan.',
    confirmResources:
      'Indeks semua ruang akan dibangun ulang. Tipe ini tidak memanggil Embedding, tetapi memakai penyimpanan dan sumber daya. Indeks terbit tetap tersedia sampai penggantinya siap.',
    deploymentPg:
      'Koneksi, Schema dan prefiks tabel dikelola dalam konfigurasi deployment.',
    deploymentFile:
      'Jalur berkas indeks dikelola dalam konfigurasi deployment.',
    errors: {
      configurationChanged:
        'Pengaturan indeks atau model telah berubah. Generasi lama tidak dapat dicoba ulang dengan pengaturan baru. Periksa pengaturan dan bangun ulang semua ruang jika perlu (biaya Embedding mungkin berlaku).',
      modelAuth:
        'Autentikasi Embedding gagal. Periksa API Key, izin akses, dan wilayah endpoint.',
      modelQuota:
        'Kuota atau saldo Embedding habis. Periksa akun model sebelum mencoba lagi.',
      modelRateLimit:
        'Layanan Embedding membatasi permintaan. Tunggu sebelum mencoba lagi.',
      modelConfig:
        'Model Embedding tersimpan tidak tersedia, berubah, atau tidak didukung. Periksa layanan dan model.',
      modelInput:
        'Input Embedding terlalu panjang. Periksa ukuran potongan dokumen.',
      modelPolicy:
        'Layanan Embedding menolak input berdasarkan kebijakan konten. Periksa konten terkait.',
      modelResponse:
        'Layanan Embedding mengembalikan vektor tidak valid. Periksa kompatibilitas dan dimensi.',
      modelUnavailable:
        'Layanan Embedding tidak dapat dijangkau atau sementara tidak tersedia. Periksa endpoint dan jaringan.',
      storageAuth:
        'Autentikasi penyimpanan indeks gagal. Periksa pengguna, kata sandi, dan koneksi basis data.',
      storagePermission:
        'Penyimpanan indeks menolak operasi atau hanya-baca. Periksa izin skema dan tabel.',
      storageSchema:
        'Basis data, skema, atau tabel indeks yang diperlukan tidak tersedia. Periksa penerapan dan skema.',
      storageUnavailable:
        'Penyimpanan indeks tidak dapat dijangkau atau koneksi terputus. Periksa alamat, port, dan jaringan.',
      storageBusy:
        'Penyimpanan indeks sibuk atau terjadi konflik transaksi. Tunggu kebijakan percobaan ulang host.',
      timeout:
        'Operasi pengindeksan kehabisan waktu. Periksa penyimpanan dan layanan model sebelum mencoba lagi.',
      vectorExtension:
        'Ekstensi vector PostgreSQL belum terpasang. Minta administrator memasangnya.',
      ownership:
        'Kepemilikan atau struktur target indeks tidak sesuai. Periksa sumber daya instans; jangan hapus tabel lain.',
      dependencies:
        'Instans, ekstensi, atau konfigurasi jobs host tidak tersedia. Periksa penerapan dan mulai ulang jika perlu.',
    },
    invalidValue: 'Periksa nilai ini.',
    title: 'Pengaturan indeks pengetahuan',
    description:
      'Konfigurasikan indeks pencarian untuk semua ruang pengetahuan.',
    progress: 'Progres pengindeksan',
    instance: 'Instans pengindeksan',
    off: 'Nonaktif — hanya pencarian teks',
    missingForm:
      'Formulir instans ini tidak tersedia. Opsi yang tersimpan tetap dipertahankan.',
    statusFailed: 'Tidak dapat memperbarui status indeks.',
    loadFailed:
      'Tidak dapat memuat pengaturan indeks. Periksa izin akses Anda dan coba lagi.',
    saveFailed: 'Permintaan tidak diterima. Draf Anda tetap tersimpan.',
    conflict:
      'Pengaturan diubah di tempat lain. Muat revisi terbaru tanpa membuang draf, tinjau, lalu simpan kembali.',
    saved: 'Permintaan diterima. Pengindeksan berlanjut di latar belakang.',
    workFailed:
      'Sebagian pekerjaan gagal. Periksa instans dan layanan model lalu coba lagi.',
    rebuild: 'Bangun ulang semua ruang',
    retry: 'Ulangi pekerjaan yang gagal',
    confirmTitle: 'Konfirmasi perubahan indeks global',
    confirmRebuild:
      'Ini memengaruhi semua ruang dan dapat menghitung ulang vektor semua dokumen, menimbulkan biaya model, serta membutuhkan penyimpanan tambahan. Indeks lama tetap tersedia sampai penggantinya siap.',
    confirmDisable:
      'Ini menonaktifkan pencarian indeks untuk semua ruang. Pencarian teks tetap tersedia. Pembersihan berjalan di latar belakang.',
    discardTitle: 'Buang perubahan yang belum disimpan?',
    discardDescription: 'Pengaturan indeks yang belum disimpan akan hilang.',
    discard: 'Buang perubahan',
    confirm: 'Konfirmasi',
    documents:
      'Dokumen: {{done}} / {{total}} · Tertunda: {{pending}} · Gagal: {{failed}}',
    chunks: 'Potongan disiapkan: {{prepared}} · Diterapkan: {{committed}}',
    availability: {
      disabled: 'Nonaktif — hanya pencarian teks',
      unavailable: 'Indeks tidak tersedia — pencarian teks tetap tersedia',
      building: 'Membangun indeks',
      ready: 'Indeks siap',
      degraded: 'Indeks menurun — pencarian teks tetap tersedia',
    },
    table: 'Nama tabel',
    modelService: 'Layanan model',
    model: 'Model embedding',
    chooseService: 'Pilih layanan model',
    chooseModel: 'Pilih atau masukkan nama model',
    loadingModels: 'Memuat model embedding…',
    modelsUnavailable:
      'Model embedding tidak tersedia. Periksa layanan model dan coba lagi.',
  },
  access: {
    businessSection: 'Pengetahuan',
    businesses: {
      knowledge: {
        title: 'Pengetahuan',
        description: 'Dokumen dari setiap ruang pengetahuan.',
        actions: {
          read: {
            title: 'Membaca pengetahuan',
            description:
              'Membaca pengetahuan sistem dan ruang yang terkait dengannya',
            related: 'Membaca pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Baca pengetahuan (semua)',
          },
          propose: {
            title: 'Usulkan ilmu',
            description:
              'Usulkan perubahan bagi seseorang yang dapat mengedit untuk memutuskan; agen apa yang dapat diberikan',
            related: 'Usulkan pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Usulkan ilmu (semua)',
          },
          edit: {
            title: 'Edit pengetahuan',
            description:
              'Mengedit, mengarsipkan dan menandai terverifikasi, dan memutuskan proposal; pengetahuan sistem membutuhkan semua',
            related: 'Edit pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Edit pengetahuan (semua)',
          },
          manage: {
            title: 'Kelola akses pengetahuan',
            description:
              'Mengubah siapa yang boleh mengakses setiap folder dan artikel, dan tetap mengakses semuanya; pengetahuan sistem membutuhkan semua',
            related: 'Kelola akses pengetahuan (ruang yang terkait dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Kelola akses pengetahuan (semua)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: 'Pengetahuan',
      system: 'Pengetahuan sistem',
      count_one: 'dokumen {{count}}',
      count_other: 'dokumen {{count}}',
      archivedCount_one: 'Dokumen arsip {{count}}',
      archivedCount_other: 'Dokumen arsip {{count}}',
      selectTarget: 'Buka {{title}}',
      target: 'Buat di {{title}}',
      chooseTarget: 'Pilih proyek atau pengetahuan sistem yang akan dibuat',
      expandAll: 'Perluas semuanya',
      collapseAll: 'Runtuh semuanya',
      retry: 'Coba lagi',
      allProposals: 'Semua proposal',
      reviewPage: 'Halaman {{page}} dari {{pages}} · {{total}} total',
      previous: 'Sebelumnya',
      next: 'Berikutnya',
      empty: 'Tidak ada ruang pengetahuan yang dapat diakses',
      emptyAccessHint:
        'Mintalah administrator untuk mengakses pengetahuan proyek atau sistem.',
      noAccess:
        'Pengetahuan ini tidak tersedia atau Anda tidak lagi memiliki akses.',
      emptyHint:
        'Buka ruang ini untuk membuat dokumen, atau minta editor untuk menambahkannya.',
      createFailed:
        'Tidak dapat membuat entri ini. Periksa target dan coba lagi.',
      showResults: 'Tampilkan hasil teratas untuk “{{q}}”',
      topResults:
        'Bagian peringkat teratas di semua proyek dan pengetahuan sistem.',
      welcome:
        'Perluas proyek atau pengetahuan sistem bersama untuk menelusuri dokumen. Pilih ruang untuk dibuat di sana, atau telusuri seluruh pengetahuan resmi.',
    },
    title: 'Pengetahuan',
    someone: 'Seseorang',
    loading: 'Memuat',
    index: {
      states: {
        pending: 'Menunggu',
        done: 'Diindeks',
        failed: 'Gagal',
      },
      done: 'Diindeks',
      pending: 'Pengindeksan {{indexed}}/{{total}}',
      failed: 'Pengindeksan gagal',
      failedHint: 'Beberapa bagian gagal disematkan setelah setiap upaya.',
      reason: 'Alasan: {{reason}}',
      retry: 'Indeks lagi',
      refreshFailed: 'Tidak dapat menyegarkan status pengindeksan',
      retryRefresh: 'Coba lagi segarkan',
      queued: 'Mengantri untuk pengindeksan lagi',
    },
    chunks: {
      open: 'Lihat bagian',
      title: 'Bagian',
      description:
        'Bagian {{count}} dari versi "{{title}}" saat ini dipotong; pencarian dan kutipan bekerja bagian demi bagian. Pilih salah satu untuk menemukannya di dokumen.',
      lead: '(Sebelum judul pertama)',
      lines: 'Garis {{start}}–{{end}}',
      chars_one: 'karakter {{count}}',
      chars_other: 'karakter {{count}}',
      empty: 'Dokumen ini belum memiliki bagian.',
      showing: 'Menyorot garis {{start}}–{{end}}.',
      clear: 'Hapus sorotan',
    },
    chunking: {
      title: 'Pengaturan bagian',
      description:
        'Artikel dan file (teks yang diekstraksi) di {{space}} dipotong menjadi beberapa bagian sesuai judulnya untuk pencarian dan kutipan: Word menyimpan judulnya sendiri, setiap halaman PDF atau slide dan setiap lembar adalah judul level 2, dan teks tanpa judul dipotong panjangnya. Ruang ini dapat dipotong secara berbeda dari defaultnya.',
      own: 'Ditetapkan untuk ruang ini',
      defaults:
        'Default: turun ke level {{depth}}, membidik karakter {{target}}, paling banyak {{max}}.',
      depth: 'Potong di bagian judul',
      depths: {
        '1': 'Hanya tingkat 1 (#)',
        '2': 'Turun ke level 2 (##)',
        '3': 'Turun ke level 3 (###)',
      },
      depthHint:
        'Judul yang lebih dalam tetap berada di dalam bagiannya. Pada level 1 saja, file tidak dipotong berdasarkan halaman atau lembar.',
      target: 'Panjang target (karakter)',
      max: 'Batas (karakter)',
      sizesHint:
        'Bagian yang lebih panjang dari batas dipotong antar paragraf menjadi beberapa bagian di dekat sasaran; blok kode dan tabel tidak pernah dipotong.',
      invalid:
        'Panjangnya adalah {{min}} hingga {{max}}, dan targetnya paling banyak adalah batasnya.',
      effect:
        'Menyimpan memotong dokumen lagi di latar belakang, dan mengindeks ulang bagiannya ketika pencarian semantik aktif.',
      rechunking: 'Memotong dokumen lagi di latar belakang…',
      save: 'Simpan',
      saved: 'Pengaturan bagian disimpan',
    },
    loadFailed: 'Tidak dapat memuat pengetahuan',
    kinds: {
      folder: 'Folder',
      article: 'Artikel',
      file: 'File',
    },
    folder: {
      empty: 'Folder ini kosong.',
    },
    new: {
      label: 'Baru',
      article: 'Artikel baru',
      folder: 'Folder baru',
      childArticle: 'Artikel baru di dalam',
      childFolder: 'Folder baru di dalamnya',
    },
    files: {
      upload: 'Unggah file',
      uploadHere: 'Unggah file di sini',
      dropHint: 'Letakkan file di sini, atau di folder, untuk mengunggahnya.',
      uploaded_one: 'File {{count}} yang diunggah; teksnya sedang diekstraksi.',
      uploaded_other:
        'File {{count}} yang diunggah; teks mereka sedang diekstraksi.',
      download: 'Unduh',
      version: 'Versi {{version}}',
      statusHint: {
        parsing:
          'Teks sedang diekstraksi; pencarian menemukan file setelah siap.',
        ready: 'Teksnya diekstraksi, jadi pencari dan agen membacanya.',
        failed: 'Teks tidak dapat diekstraksi.',
        unsupported:
          'Teks tidak diekstraksi dari file jenis ini; itu disimpan apa adanya.',
      },
      replace: 'Ganti',
      replaced: 'Diganti: versi {{version}}.',
      reparse: 'Ekstrak lagi',
      file: 'File',
      propose: 'Usul',
      proposeNew: 'Usulkan file',
      proposeNewHint:
        'Seseorang yang dapat mengedit pengetahuan ini memutuskan; menerimanya menambahkan file.',
      proposeReplace: 'Usulkan penggantinya',
      proposeReplaceHint:
        'Seseorang yang dapat mengedit pengetahuan ini memutuskan; menerimanya membuat file Anda menjadi versi {{title}} berikutnya.',
      proposeReasonHint:
        'Mengapa ini harus ada di sini, bagi siapa pun yang memutuskan.',
      proposed: 'Diusulkan; seseorang yang mungkin mengedit memutuskan.',
      preview: 'Pratinjau',
      text: 'Teks yang diekstraksi',
      failed: 'Teks tidak dapat diekstraksi: {{reason}}',
      status: {
        parsing: 'Mengekstrak teks',
        ready: 'Teks diekstraksi',
        failed: 'Ekstraksi gagal',
        unsupported: 'Hanya disimpan',
      },
      noText: {
        parsing: 'Teks sedang diekstraksi; itu muncul di sini setelah siap.',
        ready: 'File tidak berisi teks.',
        failed: 'Teks tidak dapat diekstraksi.',
        unsupported:
          'Teks tidak diekstraksi dari file jenis ini; file disimpan apa adanya.',
      },
    },
    spaces: {
      actions: 'Aksi luar angkasa',
      access: 'Akses luar angkasa',
      proposeOnly: 'Usul saja',
      inherited: 'Diwarisi',
      inheritedHint: 'Diwarisi dari ruang lain; hanya baca di sini.',
      default: 'Pengetahuan',
      readOnly: 'Hanya-baca',
      empty: 'Belum ada dokumen.',
    },
    tree: {
      actions: 'Tindakan',
      expand: 'Perluas',
      collapse: 'Runtuh',
      label: 'Dokumen',
      newDoc: 'Dokumen baru',
      archived: 'Tampilkan diarsipkan',
      archivedBadge: 'Diarsipkan',
      pending: '{{count}} menunggu',
      back: 'Semua dokumen',
      restricted:
        'Dibatasi: hanya orang yang terdaftar yang dapat mengaksesnya',
    },
    doc: {
      permissions: 'Izin',
      restricted: 'Dibatasi · {{count}}',
      restrictedHint:
        'Hanya orang-orang yang terdaftar, dan siapa pun yang mengelola ruang tersebut, yang dapat mengaksesnya.',
      verifiedLabel: 'Terverifikasi',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: 'Usulkan perubahan',
      more: 'Lebih banyak tindakan',
      pending_one: '{{count}} tertunda',
      pending_other: '{{count}} tertunda',
      updatedAgo: '{{time}} yang diperbarui',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: 'Ganti nama “{{title}}”',
      renamedToast: 'Berganti nama.',
      notFound:
        'Dokumen ini tidak ada lagi, atau Anda mungkin tidak melihatnya.',
      notVerified: 'Belum diverifikasi',
      contents: 'Isi',
      edit: 'Edit',
      rename: 'Ganti nama',
      history: 'Sejarah',
      verify: 'Mark diverifikasi',
      verifiedToast: 'Ditandai terverifikasi.',
      archive: 'Arsipkan',
      archiveTitle: 'Arsipkan “{{title}}”?',
      archiveDescription:
        'Ia menghilang dari pohon dan dari agen. Anda dapat memulihkannya nanti; versinya disimpan.',
      archivedToast: 'Diarsipkan.',
      restore: 'Pulihkan',
      restoredToast: 'Dipulihkan.',
      move: 'Pindah',
      moveTitle: 'Pindahkan “{{title}}”',
      moveTo: 'Di bawah',
      root: 'Di tingkat atas',
      movedToast: 'Pindah.',
      archivedNotice: 'Dokumen ini diarsipkan dan hanya dapat dibaca.',
      oldVersion: 'Anda sedang membaca versi {{version}}.',
      backToCurrent: 'Kembali ke versi saat ini',
      proposals: 'Proposal menunggu',
      empty: 'Dokumen ini kosong.',
    },
    editor: {
      editing: 'Pengeditan',
      proposing: 'Mengusulkan perubahan',
      properties: 'Properti',
      propertiesHint: 'Agen dan tautan apa yang membaca tentang dokumen ini.',
      nothingToPreview: 'Belum ada yang bisa dipratinjau.',
      reasonPlaceholder:
        'Mengapa hal ini harus berubah, bagi siapa pun yang memutuskan',
      submitProposal: 'Kirim proposal',
      proposed: 'Diusulkan; seseorang yang mungkin mengedit memutuskan.',
      title: 'Judul',
      slug: 'Siput',
      slugHint:
        'Huruf kecil, angka dan tanda hubung; bagaimana agen dan tautan menamainya. Dibiarkan kosong, dibuat sesuai judul.',
      summary: 'Ringkasan',
      summaryHint: 'Agen satu baris membaca indeks.',
      content: 'Konten',
      contentPlaceholder: 'Markdown',
      write: 'Tulis',
      preview: 'Pratinjau',
      note: 'Ubah catatan',
      notePlaceholder: 'Apa yang berubah, untuk sejarah (opsional)',
      parent: 'Orangtua',
      save: 'Simpan',
      saved: 'Disimpan sebagai versi {{version}}.',
      unchanged: 'Tidak ada yang berubah.',
      create: 'Buat',
      created: 'Dokumen dibuat.',
      cancel: 'Batal',
      conflict:
        'Seseorang menyimpan versi {{version}} saat Anda mengedit. Salin teks Anda, muat ulang, dan terapkan perubahan Anda lagi.',
      reload: 'Muat ulang',
    },
    history: {
      by: 'oleh {{name}}',
      title: 'Sejarah',
      current: 'Saat ini',
      fromProposal: 'Dari sebuah lamaran',
      compare: 'Bandingkan',
      with: 'dengan',
      previous: 'versi sebelumnya',
      noChanges: 'Tidak ada perbedaan.',
      view: 'Lihat',
      unchangedLines: '{{count}} garis tidak berubah',
      approvedBy: 'disetujui oleh {{name}}',
    },
    search: {
      description: 'Cari dokumen ruang ini dan ruang yang diwarisinya.',
      hint: 'Ketik untuk mencari judul dan teks.',
      emptyHint: 'Coba kata lain, atau lebih sedikit kata tersebut.',
      all: 'Tampilkan semua hasil untuk “{{q}}”',
      resultsFor: 'Hasil untuk “{{q}}”',
      placeholder: 'Cari ilmu',
      label: 'Cari ilmu',
      empty: 'Tidak ditemukan apa pun untuk “{{q}}”.',
      results: 'Hasil',
      inherited: 'Diwarisi',
    },
    home: {
      emptyTitle: 'Belum ada dokumen di {{space}}',
      emptyEdit: 'Tulis artikel pertama, atau unggah file untuk memulai.',
      emptyPropose:
        'Usulkan file, dan seseorang yang dapat mengedit memutuskan apakah file tersebut ditambahkan.',
      emptyRead: 'Belum ada yang ditulis di sini.',
      count_one: 'dokumen {{count}}',
      count_other: 'dokumen {{count}}',
      pending_one: 'Menunggu peninjauan ({{count}})',
      pending_other: 'Menunggu peninjauan ({{count}})',
      all: 'Lihat semua',
      recent: 'Baru-baru ini diperbarui',
      updated: '{{time}} · {{name}}',
      unindexed: 'Tidak sepenuhnya terindeks',
      unindexedFailed: '{{failed}} gagal · {{pending}} menunggu',
      unindexedPending_one: 'Bagian {{count}} menunggu',
      unindexedPending_other: 'Bagian {{count}} menunggu',
      unverified: 'Belum diverifikasi akhir-akhir ini',
      verifiedAgo: '{{time}} Terverifikasi',
    },
    diff: {
      changes_one: '{{count}} berubah',
      changes_other: '{{count}} berubah',
      previous: 'Perubahan sebelumnya',
      next: 'Perubahan selanjutnya',
      layout: 'Tata letak berbeda',
      inline: 'Sebaris',
      split: 'Berpisah',
    },
    access: {
      you: {
        manage: 'Kamu bisa mengaturnya',
        edit: 'Anda dapat mengedit',
        propose: 'Anda bisa melamar',
        read: 'Anda bisa membaca',
        none: 'Tidak ada akses',
      },
      title: 'Akses luar angkasa',
      description: 'Siapa yang dapat mengakses {{space}}.',
      yours: 'Akses Anda',
      actions: {
        read: 'Baca dokumen dan cari',
        propose:
          'Usulkan perubahan bagi seseorang yang dapat mengedit untuk memutuskan',
        edit: 'Mengedit, mengatur, dan memverifikasi dokumen',
        manage: 'Ubah siapa yang dapat mengakses setiap folder dan artikel',
      },
      allowed: 'Diizinkan',
      notAllowed: 'Tidak diperbolehkan',
      matrix: 'Berdasarkan peran',
      role: 'Peran',
      columns: {
        read: 'Baca',
        propose: 'Usul',
        edit: 'Edit',
        manage: 'Kelola',
      },
      from: 'Sumber: {{source}}',
      source: {
        space: 'akses Anda ke {{space}}',
        manager: 'Anda mengelola {{space}}',
        entry: '{{subject}}, disetel pada “{{title}}”',
      },
      restrictedAt:
        'Dibatasi pada “{{title}}”: hanya orang yang terdaftar di sana yang dapat mengaksesnya.',
      viewOnly:
        'Hanya orang yang mengelolanya yang dapat mengubah siapa yang boleh mengaksesnya.',
      mine: '(milikmu)',
      howTitle: 'Cara kerja akses di sini',
      agents:
        'Agen yang bertindak untuk seseorang paling banyak membaca dan melamar; mereka tidak pernah mengedit atau memutuskan.',
      manage: 'Perubahan Peran',
    },
    permissions: {
      title: 'Izin “{{title}}”',
      description: {
        folder:
          'Siapa yang boleh membaca, mengusulkan, mengedit dan mengelola folder ini dan isinya.',
        article:
          'Siapa yang boleh membaca, mengusulkan, mengedit dan mengelola artikel ini.',
        file: 'Siapa yang boleh membaca, mengusulkan, mengedit dan mengelola file ini.',
      },
      modeLabel: 'Akses',
      modes: {
        inherit: 'Mewarisi dari induknya',
        custom: 'Hanya orang-orang yang terdaftar',
      },
      inheritHint:
        'Siapa pun yang dapat mengakses induknya juga dapat mengaksesnya, dan orang yang ditambahkan di bawah setidaknya mendapatkan level mereka.',
      customHint:
        'Hanya orang-orang yang tercantum di bawah ini yang dapat mengaksesnya, apa pun yang diizinkan oleh induknya; apa yang ada di bawahnya akan mengikuti kecuali jika dibatasi sendiri.',
      inherited: 'Diwarisi',
      fromSpace:
        'Setiap orang yang memiliki akses ke {{space}}, berdasarkan peran mereka',
      fromDoc: 'Dari “{{title}}”',
      fromRestricted:
        'Dari “{{title}}”, yang hanya dapat diakses oleh orang-orang yang terdaftar',
      added: 'Juga memiliki akses',
      listed: 'Orang-orang terdaftar',
      add: 'Tambahkan orang',
      addPlaceholder: 'Tambahkan orang, peran…',
      noMatches: 'Tidak ada kecocokan.',
      noneAdded: 'Tidak ada seorangpun yang melampaui apa yang diwariskan.',
      noneListed:
        'Tidak ada yang terdaftar: hanya siapa pun yang mengelola ruang yang dapat mengaksesnya.',
      managers:
        'Siapapun yang mengelola ruang selalu mempunyai akses. Agen paling banyak membaca dan melamar, dan hanya apa yang bisa dilakukan oleh mereka dan orangnya.',
      levelOf: 'Tingkat {{subject}}',
      levels: {
        read: 'Bisa membaca',
        propose: 'Bisa melamar',
        edit: 'Dapat mengedit',
        manage: 'Bisa mengatur',
      },
      remove: 'Hapus',
      removedSubject: 'Dihapus ({{id}})',
      save: 'Simpan',
      close: 'Tutup',
      saved: 'Izin disimpan.',
      loadFailed: 'Tidak dapat memuat izin.',
    },
    searchTest: {
      title: 'Tes pencarian',
      description:
        'Menjalankan pencarian seperti yang Anda lakukan dan menunjukkan bagaimana setiap hit diberi peringkat: relevansinya, peringkatnya berdasarkan kata kunci dan maknanya, skor rerankingnya, dan posisinya dalam dokumennya.',
      keyword: 'Kata Kunci',
      semantic: 'Artinya',
      relevance: 'Relevansi {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: tidak ditemukan',
      lines: 'Garis {{start}}–{{end}}',
      notExplained:
        'Detail peringkat hanya ditampilkan kepada orang yang mengelola ruang atau pengaturan pencarian.',
      query: 'Kata-kata yang harus dicari',
      run: 'Cari',
      fused: 'Menyatu {{score}}',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: 'Mengubah peringkat {{score}}',
      notReranked: 'Tidak diberi peringkat ulang',
    },
    proposals: {
      listTitle: 'Usulan',
      statuses: {
        pending: 'Tertunda',
        accepted: 'Diterima',
        rejected: 'Ditolak',
        withdrawn: 'Ditarik kembali',
      },
      none: {
        pending: 'Tidak ada yang menunggu untuk ditinjau.',
        accepted: 'Belum ada proposal yang diterima.',
        rejected: 'Tidak ada proposal yang ditolak.',
      },
      about: 'Pada “{{title}}”',
      clearAbout: 'Tampilkan semua proposal',
      onBehalf: '{{proposer}} atas nama {{person}}',
      overview: 'Ikhtisar',
      changes: 'Perubahan',
      staleTitle: 'Dokumen tersebut berubah sejak saat itu',
      decision: 'Keputusan',
      commentLabel: 'Komentar',
      pendingEntry: 'Peninjauan tertunda · {{count}}',
      kinds: {
        update: 'Perubahan',
        create: 'Dokumen baru',
        verify: 'Masih berlaku',
      },
      by: '{{proposer}} untuk {{person}}',
      from: 'Dari {{source}}',
      reason: 'Alasan',
      summary: 'Ringkasan',
      stale:
        'Dokumen berubah sejak ini ditulis (v{{base}} → v{{current}}). Menerima menggantikan versi saat ini dengan keseluruhan proposal.',
      diffProposed: 'Usulan perubahan (v{{base}} → proposal)',
      diffCurrent: 'Terhadap versi saat ini (v{{current}} → proposal)',
      newContent: 'Konten yang diusulkan',
      newFile: 'Berkas yang diusulkan',
      replacementFile: 'Penggantian untuk versi {{base}}',
      fileNote: 'Teksnya diekstraksi setelah diterima.',
      verifyNote:
        'Tidak ada perubahan dalam dokumen; itu ditandai diverifikasi hari ini.',
      accept: 'Terima',
      acceptAnyway: 'Tetap terima',
      reject: 'Tolak',
      comment: 'Komentar (opsional)',
      accepted: 'Diterima.',
      rejected: 'Ditolak.',
      decided: '{{outcome}} oleh {{name}}',
      open: 'Buka',
      readOnly: 'Seseorang yang dapat mengedit pengetahuan ini memutuskannya.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      'Proposal Anda sebelumnya untuk dokumen ini masih menunggu; itu harus diputuskan terlebih dahulu.',
    KNOWLEDGE_PROPOSAL_REJECTED:
      'Perubahan yang sama telah ditolak sebelumnya; mengusulkan sesuatu yang berbeda.',
    EMPTY_CONTENT: 'Konten yang diusulkan kosong.',
    INVALID_REASON: 'Katakan mengapa harus berubah (maksimal 500 karakter).',
    KNOWLEDGE_VERSION_CONFLICT:
      'Sementara itu, seseorang menyimpan versi yang lebih baru; muat ulang dan terapkan kembali perubahan Anda.',
    KNOWLEDGE_SLUG_TAKEN: 'Dokumen lain di ruang ini memuat siput itu.',
    KNOWLEDGE_HAS_CHILDREN:
      'Arsipkan atau pindahkan subdokumennya terlebih dahulu.',
    KNOWLEDGE_ARCHIVED:
      'Dokumen tersebut diarsipkan; memulihkannya terlebih dahulu.',
    KNOWLEDGE_DEPTH_EXCEEDED:
      'Dokumen bersarang paling banyak pada empat tingkat.',
    KNOWLEDGE_INVALID_MOVE:
      'Suatu dokumen tidak dapat berada di bawah dirinya sendiri atau miliknya sendiri.',
    KNOWLEDGE_PROPOSAL_STALE: 'Dokumen berubah sejak proposal ditulis.',
    KNOWLEDGE_PROPOSAL_DECIDED: 'Proposal ini telah diputuskan.',
    INVALID_SLUG: 'Siput menggunakan huruf kecil, angka, dan tanda hubung.',
    INVALID_TITLE: 'Judul diperlukan (maksimal 200 karakter).',
    FILE_TOO_LARGE: 'Filenya terlalu besar.',
    FILES_UNAVAILABLE: 'Aplikasi ini tidak menyimpan file.',
    INVALID_FILE: 'Kirim satu file.',
    INVALID_PARENT: 'Tidak ada yang berada di bawah file.',
    KNOWLEDGE_NOT_FAILED:
      'Hanya file yang teksnya tidak dapat diekstraksi yang diekstraksi lagi.',
  },
  ui: {
    nav: {
      knowledge: 'Pengetahuan',
    },
  },
  common: {
    forbidden: 'Anda tidak mempunyai izin untuk melakukan ini.',
    requestFailed: 'Permintaan gagal. Silakan coba lagi.',
  },
};

export default idID;
