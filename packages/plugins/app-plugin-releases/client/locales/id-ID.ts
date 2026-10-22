import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  access: {
    section: 'Rilis',
    pages: {
      'rel-apps': 'Aplikasi',
    },
    businessSection: 'Rilis',
    businesses: {
      apps: {
        title: 'Aplikasi',
        description: 'Aplikasi, rilisnya, penerapannya, dan waktu prosesnya.',
        actions: {
          view: {
            title: 'Lihat Aplikasi',
            description:
              'Lihat Aplikasi, rilis, penerapan, dan status runtimenya',
            related: 'Lihat Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Lihat Aplikasi (semua)',
          },
          readLogs: {
            title: 'Baca log',
            description: 'Membaca log Aplikasi dan penerapan',
            related: 'Baca log (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Baca log (semua)',
          },
          create: {
            title: 'Buat Aplikasi',
            description: 'Membuat Aplikasi di suatu lingkungan',
            all: 'Buat Aplikasi',
          },
          configure: {
            title: 'Konfigurasikan Aplikasi',
            description:
              'Membaca dan mengubah konfigurasi Aplikasi, yang mungkin menyimpan rahasia',
            related: 'Konfigurasikan Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Konfigurasikan Aplikasi (semua)',
          },
          upload: {
            title: 'Unggah rilis',
            description: 'Unggah dan promosikan rilis',
            related: 'Unggah rilis (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Unggah rilis (semua)',
          },
          deploy: {
            title: 'Sebarkan',
            description:
              'Menyebarkan dan memutar kembali pada lingkungan yang tidak dilindungi, meminta penerapan ke lingkungan yang dilindungi',
            related: 'Deploy (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Terapkan (semua)',
          },
          deployProtected: {
            title: 'Menyetujui penerapan yang dilindungi',
            description:
              'Menyetujui penerapan pada lingkungan yang dilindungi tanpa menyebutkan nama pemberi persetujuan; hanya orang',
            related:
              'Menyetujui penerapan yang dilindungi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Menyetujui penerapan yang dilindungi (semua)',
          },
          operate: {
            title: 'Mulai dan berhenti',
            description: 'Mulai, hentikan, dan mulai ulang Aplikasi',
            related: 'Mulai dan berhenti (yang berhubungan dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Mulai dan hentikan (semua)',
          },
          delete: {
            title: 'Hapus Aplikasi',
            description: 'Hapus Aplikasi beserta datanya',
            related: 'Hapus Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Hapus Aplikasi (semua)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplikasi yang mereka buat',
    },
    settings: {
      rel: {
        environments: 'Menyebarkan lingkungan',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplikasi dan penerapan',
        description:
          'Baca: lihat aplikasi, rilis, penerapan, dan log. Membaca dan menulis: juga mengunggah rilis. Admin: juga menerapkan dan memulai atau menghentikan aplikasi.',
        objects: 'Aplikasi',
      },
      environments: {
        title: 'Menyebarkan lingkungan',
        description:
          'Baca: daftar lingkungan. Membaca dan menulis: mengelolanya.',
      },
      presets: {
        ciDeploy: {
          title: 'Penerapan CI',
          description:
            'Unggah rilis ke aplikasi yang dipilih dan terapkan, selama 90 hari.',
        },
        ciUpload: {
          title: 'Unggahan CI',
          description:
            'Unggah rilis ke aplikasi yang dipilih tanpa menerapkannya, selama 90 hari.',
        },
      },
    },
    actions: {
      read: 'Lihat',
      manage: 'Kelola',
      view: 'Lihat',
      'read-logs': 'Baca log',
      create: 'Buat',
      configure: 'Konfigurasi',
      upload: 'Unggah rilis',
      deploy: 'Sebarkan',
      'deploy-protected': 'Menyetujui penerapan yang dilindungi',
      operate: 'Mulai dan berhenti',
      delete: 'Hapus',
    },
  },
  drivers: {
    host: 'Server ini',
  },
  ui: {
    nav: {
      apps: 'Aplikasi',
      environments: 'Menyebarkan lingkungan',
    },
    apps: {
      title: 'Aplikasi',
      description: 'Aplikasi, rilisnya, dan di mana penerapannya.',
      search: 'Cari berdasarkan ID atau nama',
      create: 'Buat aplikasi',
      id: 'ID Aplikasi',
      name: 'Nama',
      environment: 'Lingkungan',
      version: 'Versi',
      state: 'Keadaan',
      url: 'Alamat',
      labels: 'Label',
      loadFailed: 'Tidak dapat memuat aplikasi.',
      loadOneFailed: 'Tidak dapat memuat aplikasi.',
      emptyTitle: 'Belum ada aplikasi',
      emptyNoAccess: 'Minta administrator untuk membuat aplikasi.',
      emptyDescription:
        'Buat aplikasi, lalu unggah rilis dan terapkan ke suatu lingkungan.',
      noResults: 'Tidak ada aplikasi yang cocok dengan pencarian.',
      created: '{{name}} dibuat.',
      createDescription:
        'Sebuah aplikasi diterapkan ke satu lingkungan; rilisnya diunggah setelahnya.',
      idHint:
        'Huruf, angka, garis bawah dan tanda hubung; bagian dari alamatnya. Itu tidak bisa diubah nanti.',
      noEnvironment: 'Belum ada lingkungan',
      lastAccess: 'Kunjungan terakhir',
    },
    advanced: 'Tingkat Lanjut (opsional)',
    labels: {
      name: 'Nama',
      value: 'Nilai',
      nameOf: 'Nama label {{index}}',
      valueOf: 'Nilai label {{index}}',
      remove: 'Hapus label {{index}}',
      add: 'Tambahkan label',
      hint: 'Label memungkinkan alat dan orang menemukan dan mengelompokkan aplikasi dan rilis.',
      count_one: 'Label {{count}}',
      count_other: 'Label {{count}}',
      system: 'Label ditambahkan oleh sistem',
      systemHint: 'Ditambahkan oleh sistem; itu tidak dapat diubah di sini.',
      errors: {
        keyRequired: 'Masukkan nama untuk nilai ini.',
        keyInvalid:
          'Gunakan huruf, angka, ".", "_", "/" atau "-", dimulai dengan huruf atau angka (maksimal 63).',
        keyDuplicate: 'Nama ini sudah digunakan.',
        valueTooLong: 'Paling banyak karakter {{max}}.',
        tooMany: 'Paling banyak label {{max}}.',
      },
    },
    policy: {
      title: 'Lingkungan runtime',
      activationLabel: 'Mulai',
      activation: {
        eager: 'Selalu berjalan',
        onDemand: 'Dimulai pada kunjungan',
      },
      activationHint: {
        eager: 'Dimulai saat diterapkan dan setiap kali runtime dimulai ulang.',
        onDemand:
          'Dimulai dengan kunjungan pertamanya setelah penerapan atau restart runtime.',
      },
      idleLabel: 'Berhenti jika belum dikunjungi',
      dormantLabel: 'Hibernasi saat tidak dikunjungi',
      idleModeLabel: 'Perilaku timer tidak aktif',
      dormantModeLabel: 'Perilaku timer hibernasi',
      minutes: 'menit',
      hours: 'jam',
      neverIdle: 'Tidak pernah',
      neverDormant: 'Tidak pernah',
      timerMode: {
        inherit: 'Gunakan nilai default lingkungan',
        custom: 'Tetapkan nilai kustom',
      },
      customTimerHint:
        'Nilai kustom yang kosong menonaktifkan timer ini; nilai default lingkungan tidak digunakan.',
      idleSummary: 'berhenti setelah {{minutes}} menit belum dikunjungi',
      dormantSummary: 'berhibernasi setelah {{hours}} h',
      timersHint:
        'Aplikasi yang dihentikan akan mengosongkan memorinya dan memulai lagi pada kunjungan berikutnya. Aplikasi yang berhibernasi juga menghapus file yang belum dibongkar; konfigurasi dan data disimpan, dan kunjungan berikutnya menyiapkannya lagi, yang membutuhkan waktu lebih lama.',
      unsupported:
        'Lingkungan ini tidak mendukung dimulainya kunjungan; aplikasi terus berjalan.',
      errors: {
        idleInvalid:
          'Masukkan seluruh menit dari 1 hingga {{max}}, atau biarkan kosong.',
        dormantInvalid:
          'Masukkan jam dari 0,02 (satu menit) hingga {{max}}, atau biarkan kosong.',
        dormantBeforeIdle: 'Hibernasi harus terjadi setelah perhentian.',
      },
    },
    state: {
      pending: 'Dimulai',
      starting: 'Dimulai',
      running: 'Sedang berjalan',
      stopped: 'Berhenti',
      stoppedOnDemand: 'Berhenti (mulai berkunjung)',
      dormant: 'Hibernasi (disiapkan saat berkunjung)',
      failed: 'Gagal',
      unknown: 'Tidak diketahui',
      deploying: 'Penyebaran',
    },
    operate: {
      refreshFailed:
        'Tidak dapat menyegarkan status aplikasi. Operasi tidak tersedia hingga status disegarkan. Periksa koneksi dan akses Anda, lalu coba lagi.',
      disabled: {
        busy: 'Sebuah operasi sedang berlangsung.',
        unavailable:
          'Status aplikasi tidak tersedia. Segarkan status sebelum mengoperasikan aplikasi.',
        deploying: 'Penerapan sedang berlangsung.',
        starting: 'Aplikasi dimulai.',
        notDeployed: 'Terapkan rilis terlebih dahulu.',
        alreadyRunning: 'Aplikasi sudah berjalan.',
        notRunning: 'Aplikasi tidak berjalan.',
      },
      start: 'Mulai',
      stop: 'Hentikan',
      restart: 'Mulai ulang',
      done: {
        start: 'Aplikasi dimulai.',
        stop: 'Aplikasi berhenti.',
        restart: 'Aplikasi dimulai ulang.',
      },
    },
    releases: {
      title: 'Rilis',
      upload: 'Unggah rilis',
      uploadAction: 'Unggah',
      commit: 'Commit',
      commitHint:
        'Opsional: komit dari mana arsip ini dibuat, disimpan sebagai label sha.',
      uploaded: 'Rilis diunggah.',
      checksum: 'Jumlah pemeriksaan',
      size: 'Ukuran',
      created: 'Dibuat',
      empty:
        'Belum ada rilis. Unggah paket .tar.gz yang dibuat untuk aplikasi ini.',
      loadFailed: 'Tidak dapat memuat rilis.',
    },
    deploy: {
      deploy: 'Sebarkan',
      started: 'Menerapkan {{version}}.',
      confirmProtected:
        'Lingkungan ini dilindungi. Ketik {{appId}} untuk diterapkan.',
    },
    deployments: {
      title: 'Penerapan',
      kind: 'Baik hati',
      status: 'Status',
      by: 'Oleh',
      current: 'Saat ini',
      logs: 'Catatan',
      rollback: 'Putar kembali',
      rollbackStarted: 'Kembali.',
      confirmRollbackTitle: 'Kembalikan {{name}}?',
      confirmRollback:
        'Aplikasi kembali ke rilis penerapan itu; apa yang dikerahkan sejak itu diambil kembali.',
      loadFailed: 'Tidak dapat memuat penerapan.',
      empty: 'Belum diterapkan.',
      hideLogs: 'Sembunyikan log',
      noLogs: 'Tidak ada garis log.',
      statuses: {
        queued: 'Mengantri',
        deploying: 'Penyebaran',
        succeeded: 'Berhasil',
        failed: 'Gagal',
      },
    },
    actors: {
      human: 'orang',
      agent: 'agen',
      key: 'kunci',
      rule: 'aturan',
      system: 'sistem',
    },
    requests: {
      title: 'Permintaan penerapan',
      pendingApproval: 'Menunggu persetujuan',
      notice: {
        deploy: 'meminta untuk menyebarkan {{version}} ke {{environment}}',
        rollback: 'meminta untuk mengembalikan {{environment}} ke {{version}}',
      },
      someone: 'Seseorang',
      review: 'Tinjauan',
      view: 'Lihat',
      comment: 'Komentar (opsional)',
      decideFailed: 'Keputusannya tidak berhasil',
      request: 'Minta penerapan',
      created: 'Penerapan diminta.',
      approve: 'Setujui',
      confirmApproveTitle: 'Menyetujui penerapan {{appId}}?',
      reject: 'Tolak',
      cancel: 'Tarik kembali',
      requestedBy: 'Diminta oleh',
      decidedBy: 'Diputuskan oleh',
      note: 'Catatan',
      approvedToast: 'Menyetujui penerapan {{appId}}.',
      rejectedToast: 'Menolak penerapan {{appId}}.',
      app: 'Aplikasi',
      commit: 'Commit',
      build: 'Bangun',
      ciLog: 'Catatan CI',
      requestedAt: 'Diminta',
      decisionNote: 'Catatan keputusan',
      pinned: 'checksum {{checksum}}; menyetujui penerapan hal ini',
      loadFailed: 'Tidak dapat memuat permintaan penerapan.',
      detailTitle: {
        deploy: 'Permintaan penerapan untuk {{appId}}',
        rollback: 'Permintaan pengembalian untuk {{appId}}',
      },
      reviewTitle: {
        deploy: 'Tinjau permintaan penerapan untuk {{appId}}',
        rollback: 'Tinjau permintaan rollback untuk {{appId}}',
      },
      done: {
        approve: 'Permintaan disetujui.',
        reject: 'Permintaan ditolak.',
        cancel: 'Permintaan ditarik.',
      },
      kind: {
        deploy: 'Sebarkan',
        rollback: 'Kembalikan',
      },
      status: {
        pending: 'Tertunda',
        approved: 'Disetujui',
        rejected: 'Ditolak',
        cancelled: 'Ditarik kembali',
        deployed: 'Dikerahkan',
        failed: 'Gagal',
      },
    },
    variables: {
      title: 'Variabel',
      description:
        'Variabel lingkungan yang dijalankan aplikasi ini. Setiap perubahan disimpan sekaligus dan mencapai aplikasi pada penerapan berikutnya.',
      environmentDescription:
        'Setiap aplikasi di lingkungan ini, termasuk pratinjau permintaan tarik, mendapatkan ini kecuali aplikasi tersebut menyetelnya sendiri. Tercantum dengan versi terbaru setiap aplikasi yang dinyatakan. Perubahan disimpan sekaligus dan menjangkau aplikasi pada penerapan berikutnya.',
      add: 'Tambahkan variabel',
      name: 'Nama',
      value: 'Nilai',
      source: 'Sumber',
      secret: 'Rahasia',
      secretHint:
        'Sebuah rahasia tidak akan pernah ditampilkan lagi setelah disimpan.',
      nameHint: 'Huruf besar, angka, dan garis bawah, dimulai dengan huruf.',
      invalidName:
        'Gunakan huruf besar, angka, dan garis bawah, dimulai dengan huruf.',
      valueOf: 'Nilai {{name}}',
      set: 'Tetapkan',
      notSet: 'Tidak disetel',
      sources: {
        app: 'Aplikasi',
        environment: 'Dari lingkungan',
        configFile: 'config.yml',
        generated: 'Dihasilkan',
        default: 'Default',
        unset: 'Tidak disetel',
      },
      tags: {
        required: 'Diperlukan',
        secret: 'Rahasia',
        firstStartOnly: 'Hanya permulaan pertama',
        changed: 'Berubah — perlu dimulai ulang',
        missing: 'Hilang',
        undeclared: 'Tidak diumumkan',
      },
      setValue: 'Tetapkan nilai',
      replace: 'Ganti',
      override: 'Timpa',
      overrideOf: 'Ganti {{name}}',
      overrideTitle: 'Ganti {{name}}',
      overrideHint:
        'Aplikasi ini mengambil nilai ini dan bukan nilai lingkungannya. Disimpan sekaligus; aplikasi mendapatkannya pada penerapan berikutnya.',
      savedAtOnce:
        'Disimpan sekaligus; aplikasi mendapatkannya pada penerapan berikutnya.',
      updated: 'Diperbarui',
      clear: 'Bersihkan',
      addTitle: 'Tambahkan variabel',
      setTitle: 'Tetapkan {{name}}',
      save: 'Simpan',
      cancel: 'Batal',
      saved: '{{name}} disimpan.',
      cleared: '{{name}} dibersihkan.',
      loadFailed: 'Tidak dapat memuat variabel.',
      emptyTitle: 'Tidak ada variabel',
      emptyDescription:
        'Rilis ini menyatakan tidak ada dan tidak ada yang disetel. Tambahkan satu untuk meneruskannya ke aplikasi.',
      emptyEnvironmentTitle: 'Belum ada variabel',
      emptyEnvironment:
        'Tambahkan satu untuk meneruskannya ke setiap aplikasi di lingkungan ini.',
      emptyEnvironmentReadOnly: 'Minta administrator untuk menambahkannya.',
      noManifest:
        'Rilis ini tidak mendeklarasikan variabelnya, jadi tidak ada yang diperiksa sebelum penerapan.',
      basis:
        'Terdaftar sebagai versi terbaru ({{version}}) mendeklarasikannya. Nilai aplikasi itu sendiri lebih diutamakan daripada nilai lingkungannya.',
      noBuildTitle: 'Belum ada pembangunan',
      noBuildDescription:
        'Variabel muncul di sini setelah versi pertama aplikasi diunggah. Anda dapat menambahkannya dengan tangan sekarang.',
      noBuild:
        'Belum ada pembangunan: ini adalah nilai-nilai yang ditetapkan secara manual.',
      undeclaredTitle: 'Tidak diumumkan',
      undeclaredDescription:
        'Versi terbaru tidak menyatakan hal ini. Mereka masih menjangkau aplikasi; hapus nilai aplikasi itu sendiri jika tidak diperlukan.',
      setOnEnvironment: 'Atur pada lingkungan',
      setOnApp: 'Atur di aplikasi ini',
      declaredBy: 'Dideklarasikan oleh',
      status: 'Status',
      noApps: 'Tidak ada aplikasi yang menyatakannya',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: 'Hilang di aplikasi {{count}}',
      missingIn_other: 'Hilang di aplikasi {{count}}',
      missingInTitle: 'Wajib, dan tidak ada nilai untuk: {{apps}}',
      environmentSet: 'Tetapkan di sini',
      environmentNotSet: 'Tidak disetel di sini',
      missingTitle: 'Variabel yang diperlukan tidak disetel',
      missingDescription:
        '{{names}} harus disetel sebelum build terbaru dapat diterapkan: pada lingkungan untuk setiap aplikasi di sana, atau pada aplikasi ini saja.',
      review: 'Tinjau variabel',
      changedTitle: 'Perubahan variabel tidak diterapkan',
      changedDescription:
        'Variabel berubah sejak aplikasi diterapkan. Ini akan berlaku ketika aplikasi disebarkan lagi.',
      apply: 'Terapkan & mulai ulang',
      applied: 'Menerapkan lagi dengan variabel baru.',
      needs_one: 'Membutuhkan variabel {{count}}',
      needs_other: 'Membutuhkan variabel {{count}}',
      missing: '{{count}} hilang',
      bulk: {
        edit: 'Pengeditan massal',
        title: 'Edit variabel secara massal',
        reviewTitle: 'Tinjau perubahan',
        description:
          'Tempel atau edit baris KEY=value, seperti pada file .env. Baris yang dimulai dengan # diabaikan.',
        appHint:
          'Mencantumkan nilai yang ditetapkan aplikasi ini sendiri. Nilai dari lingkungannya dan Rahasia tidak ditampilkan: tambahkan baris untuk mengganti atau menggantinya. Menghapus garis akan menghapus nilai itu.',
        environmentHint:
          'Mencantumkan nilai-nilai lingkungan ini. Rahasia tidak ditampilkan: tambahkan baris untuk menggantikannya. Menghapus garis akan menghapus nilai itu.',
        label: 'Variabel (.env)',
        review: 'Tinjau perubahan',
        back: 'Kembali',
        changes: 'Perubahan',
        noChanges: 'Teks mengatur apa yang sudah ada.',
        nothing: 'Tidak ada yang perlu disimpan',
        unchanged_one: 'Variabel {{count}} tetap apa adanya.',
        unchanged_other: 'Variabel {{count}} tetap apa adanya.',
        save_one: 'Simpan {{count}} perubahan',
        save_other: 'Simpan {{count}} perubahan',
        saved_one: 'Perubahan {{count}} disimpan.',
        saved_other: 'Perubahan {{count}} disimpan.',
        secretOf: '{{name}} adalah Rahasia',
        failedTitle: 'Beberapa perubahan tidak disimpan',
        kinds: {
          add: 'Tambah',
          change: 'Perubahan',
          remove: 'Hapus',
        },
        problems: {
          syntax: 'Baris {{line}}: tulis sebagai KEY=value.',
          name: 'Baris {{line}}: {{name}} bukan nama yang valid. Gunakan huruf besar, angka, dan garis bawah, dimulai dengan huruf.',
          reserved:
            'Baris {{line}}: {{name}} diatur oleh runtime dan tidak dapat berupa variabel.',
          duplicate:
            'Baris {{line}}: {{name}} sudah disetel pada baris sebelumnya.',
          unterminated:
            'Baris {{line}}: kutipan di sekitar nilai {{name}} tidak ditutup.',
        },
      },
    },
    tabs: {
      label: 'Bagian {{name}}',
      overview: 'Ikhtisar',
      deployments: 'Penerapan',
      variables: 'Variabel',
      settings: 'Pengaturan',
    },
    overview: {
      currentRelease: 'Rilis saat ini',
      recent: 'Penerapan terkini',
      viewAll: 'Lihat semua',
    },
    initialAdmin: {
      title: 'Administrator pertama',
      expires:
        'Dihasilkan untuk penerapan pertama. Simpan sekarang: dihapus di {{hours}} h.',
      kept: 'Dihasilkan untuk penerapan pertama; itu disimpan sampai aplikasi dihapus.',
      username: 'Nama Pengguna',
      email: 'Email',
      password: 'Kata sandi',
      show: 'Tampilkan kata sandi',
      hide: 'Sembunyikan kata sandi',
      copy: 'Salin kata sandi',
      copied: 'Kata sandi disalin.',
      dismiss: 'Saya sudah menyimpannya',
      dismissed: 'Administrator pertama telah dihapus dari manajer rilis.',
    },
    config: {
      title: 'Lanjutan',
      description:
        'config.yml aplikasi yang diterapkan; menyimpan memuat ulang aplikasi. Lebih memilih variabel untuk nilai yang berbeda per lingkungan dan rahasia.',
      loadFailed: 'Tidak dapat memuat konfigurasi.',
      discard: 'Buang perubahan',
      save: 'Simpan dan muat ulang',
      saved: 'Konfigurasi disimpan.',
      external:
        'Aplikasi ini membaca konfigurasinya dari manajemen rilis luar, jadi tidak ada config.yml yang perlu diedit di sini. Tetapkan nilai yang berbeda untuk setiap lingkungan sebagai variabel.',
      externalTitle: 'Tidak ada config.yml yang perlu diedit',
      noFileTitle: 'Belum ada config.yml',
      noFile:
        'config.yml dibuat saat penerapan pertama. Sebelum itu, konfigurasikan aplikasi menggunakan variabel.',
      toVariables: 'Pergi ke variabel',
      maskedHint:
        'Nilai rahasia ditampilkan sebagai {{mask}}. Biarkan masker di tempatnya untuk mempertahankan nilai yang disimpan, atau ketikkan nilai baru di atasnya.',
      secrets: 'Rahasia',
      secretsHint:
        'Nilai yang disimpan tidak pernah ditampilkan. Ganti atau hapus satu di sini; itu berlaku saat Anda menyimpan.',
      newValue: 'Nilai baru untuk {{path}}',
      replace: 'Ganti {{path}}',
      clear: 'Hapus {{path}}',
    },
    settings: {
      edit: 'Waktu proses dan label',
      editShort: 'Edit',
      editDescription:
        'Kapan aplikasi berjalan dan cara pemberian labelnya. Perubahan berlaku tanpa memulai ulang.',
      save: 'Simpan',
      saved: 'Pengaturan disimpan.',
      danger: 'Hapus aplikasi',
      delete: 'Hapus beserta datanya',
      deleteDescription:
        'Menghapus aplikasi, rilis, penerapan, dan datanya. Hal ini tidak dapat dibatalkan.',
      deleted: '{{name}} dihapus.',
      confirmDeleteTitle: 'Hapus {{name}}?',
      confirmDelete:
        'Ini menghapus {{appId}} dan semua datanya. Ketik {{appId}} untuk mengonfirmasi.',
    },
    common: {
      retry: 'Coba lagi',
      refresh: 'Segarkan',
      actions: 'Tindakan',
      rowActions: 'Tindakan untuk {{name}}',
    },
    errors: {
      requestFailed: 'Permintaan gagal.',
      reasons: {
        IMAGE_REQUIRED:
          'Lingkungan ini menjalankan gambar rilis, dan rilis tidak memiliki gambar di sana. Daftarkan gambar yang didorong CI Anda (`release image`), lalu terapkan.',
        ARCHIVE_REQUIRED:
          'Lingkungan ini menjalankan arsip rilis yang sedang diproses; unggah arsip (`release upload`).',
        IMAGE_CONFLICT:
          'Rilis ini sudah memiliki gambar lain untuk platform ini; gambar rilis tidak pernah berubah.',
        INVALID_IMAGE: 'Itu bukan referensi gambar dengan intisari sha256.',
        REGISTRY_EXISTS: 'Registri dengan ID ini sudah ada.',
        REGISTRY_IN_USE:
          'Lingkungan diambil dari registri ini; pilih registri lain untuk mereka terlebih dahulu.',
        UNKNOWN_REGISTRY: 'Registri itu tidak ada.',
        INVALID_REGISTRY_URL:
          'Masukkan asal registri, seperti https://ghcr.io atau localhost:5000.',
        INVALID_REGISTRY_NAMESPACE:
          'Namespace adalah komponen jalur huruf kecil, seperti acme.',
        APP_EXISTS: 'Aplikasi dengan ID ini sudah ada.',
        APP_NOT_DEPLOYED: 'Aplikasi belum diterapkan.',
        APP_NOT_FOUND:
          'Aplikasi tidak ada, atau Anda mungkin tidak melihatnya.',
        APPROVAL_REQUIRED: 'Lingkungan ini dilindungi: minta penerapan saja.',
        ARTIFACT_TOO_LARGE: 'Paket rilis terlalu besar.',
        BASE_PATH_MISMATCH: 'Rilis ini dibuat untuk jalur dasar yang berbeda.',
        CHECKSUM_MISMATCH: 'Paket tidak cocok dengan checksumnya.',
        CONFIG_NOT_EDITABLE:
          'Konfigurasi aplikasi ini tidak dapat diedit di sini.',
        CONFIG_SECRET_NOT_STORED:
          'Nilai bertopeng tidak memiliki rahasia tersimpan di tempatnya. Ketikkan nilainya alih-alih topeng.',
        CONFIG_RELOAD_FAILED:
          'Konfigurasi telah disimpan, tetapi aplikasi tidak dapat memuat ulang.',
        CONFIG_TOO_LARGE: 'Konfigurasinya terlalu besar.',
        CONFIRMATION_REQUIRED: 'Ketikkan ID aplikasi untuk mengonfirmasi.',
        DEPLOYMENT_IN_PROGRESS: 'Penerapan aplikasi ini sedang berlangsung.',
        DEPLOYMENT_NOT_FOUND: 'Penerapannya tidak ada.',
        DRIVER_UNAVAILABLE: 'Driver lingkungan tidak tersedia.',
        ENVIRONMENT_DRIVER_FIXED:
          'Penggerak suatu lingkungan tidak dapat diubah.',
        ENVIRONMENT_VARIANT_FIXED:
          'Mode pengoperasian suatu lingkungan tidak dapat diubah; buat lingkungan lain sebagai gantinya.',
        ENVIRONMENT_EXISTS: 'Lingkungan dengan ID ini sudah ada.',
        ENVIRONMENT_FULL: 'Lingkungan telah mencapai batas aplikasinya.',
        ENVIRONMENT_IN_USE: 'Aplikasi masih diterapkan ke lingkungan ini.',
        ENVIRONMENT_NOT_FOUND: 'Lingkungan tidak ada.',
        FORBIDDEN: 'Anda tidak mempunyai izin untuk melakukan ini.',
        IDEMPOTENCY_CONFLICT:
          'Permintaan yang sama dikirim dengan konten berbeda.',
        INVALID_ACTIVATION_POLICY: 'Kebijakan aktivasi tidak valid.',
        INVALID_IDLE_STOP: 'Penghentian idle tidak valid.',
        INVALID_DORMANCY: 'Waktu hibernasi tidak valid.',
        INVALID_APP_ID:
          'Gunakan huruf, angka, garis bawah, dan tanda hubung untuk ID aplikasi, tidak dimulai dengan "__" dan bukan "baru".',
        INVALID_APPROVERS: 'Pemberi persetujuan tidak sah.',
        INVALID_ARTIFACT_SIZE: 'Ukuran paket tidak valid.',
        INVALID_ARTIFACT_VERSION: 'Versi rilis tidak valid.',
        INVALID_ARTIFACT: 'File tersebut bukan paket rilis yang valid.',
        INVALID_CHECKSUM: 'Checksumnya tidak valid.',
        INVALID_CONFIG_FILE: 'Konfigurasi YAML tidak valid.',
        INVALID_CONFIG_MODE: 'Mode konfigurasi tidak valid.',
        INVALID_CONFIG_SECRET: 'Perubahan rahasia tidak valid.',
        INVALID_CONTENT_TYPE: 'Unggah paket .tar.gz.',
        INVALID_DEPLOYMENT_INPUT: 'Permintaan penerapan tidak valid.',
        INVALID_DRIVER: 'Pengemudi tidak valid.',
        INVALID_ENVIRONMENT_CONFIG:
          'Pengaturan lingkungan tidak valid untuk drivernya.',
        INVALID_ENVIRONMENT_ID:
          'Gunakan huruf kecil, angka, garis bawah, dan tanda hubung untuk ID lingkungan.',
        INVALID_ENVIRONMENT_SETTINGS: 'Pengaturan lingkungan tidak valid.',
        INVALID_IDEMPOTENCY_KEY: 'Kunci permintaan tidak valid.',
        INVALID_INPUT: 'Beberapa kolom permintaan tidak valid.',
        INVALID_LABELS:
          'Tulis label sebagai kunci=nilai, dipisahkan dengan koma.',
        INVALID_LOG_CURSOR: 'Posisi log tidak valid.',
        INVALID_LOG_ID: 'Lognya tidak ada.',
        INVALID_NOTE: 'Catatannya terlalu panjang.',
        INVALID_PUBLIC_URL: 'Pola URL publik tidak valid.',
        INVALID_REQUEST: 'Permintaan tersebut tidak valid.',
        INVALID_ROLLBACK_TARGET: 'Penerapan ini tidak dapat dibatalkan.',
        INVALID_SEARCH: 'Pencarian tidak valid.',
        INVALID_TICKET: 'Tiket tidak berlaku.',
        RELEASE_EXISTS: 'Versi ini telah diunggah.',
        RELEASE_NOT_FOUND: 'Rilisnya tidak ada.',
        REQUEST_DECIDED: 'Permintaan telah diputuskan.',
        REQUEST_NOT_FOUND: 'Permintaan tidak ada.',
        REQUEST_PENDING:
          'Permintaan untuk aplikasi ini sudah menunggu persetujuan.',
        RESTART_FAILED: 'Aplikasi tidak dapat dimulai ulang.',
        SESSION_REQUIRED: 'Masuk lagi untuk melanjutkan.',
        START_FAILED: 'Aplikasi tidak dapat dimulai.',
        STOP_FAILED: 'Aplikasi tidak dapat dihentikan.',
        TICKET_DEPLOY_REFUSED: 'Tiket tidak mengizinkan penerapan ini.',
        TICKET_FORBIDDEN: 'Tiket tidak mengizinkan hal ini.',
        UNSAFE_ARTIFACT: 'Paket berisi jalur yang tidak aman.',
        VARIABLES_MISSING:
          'Variabel yang diperlukan tidak disetel: {{names}}. Tetapkan variabel tersebut di variabel aplikasi atau lingkungannya, lalu terapkan kembali.',
        VARIABLE_RESERVED:
          'Nama ini ditetapkan oleh runtime dan tidak dapat berupa variabel.',
        INVALID_VARIABLE_NAME:
          'Nama variabel berupa huruf besar, angka, dan garis bawah, dimulai dengan huruf.',
        INVALID_VARIABLE_VALUE: 'Nilainya terlalu panjang.',
        VARIABLE_NOT_FOUND: 'Variabel tidak disetel.',
        INVALID_VARIABLES_MANIFEST:
          'Manifes variabel rilis (dist/variables.json) tidak valid.',
        INITIAL_ADMIN_UNAVAILABLE:
          'Tidak ada administrator pertama yang ditampilkan.',
      },
      messages: {
        hostExited: 'Proses aplikasi dihentikan sebelum siap.',
        hostDisabled: 'Host aplikasi dimatikan.',
        hostShutDown: 'Host aplikasi telah dimatikan.',
        hostEntryMissing: 'File entri host aplikasi tidak ada.',
        cannotRestart: 'Host ini tidak dapat dimulai ulang dari sini.',
        selfDeploy: 'Host tidak dapat menyebarkan aplikasi yang dijalankannya.',
        noStatus: 'Tuan rumah tidak melaporkan bagaimana penerapannya.',
        interrupted: 'Penerapan terhenti karena restart.',
        notReported: 'Runtime tidak melaporkan aplikasi.',
        notRunning: 'Aplikasi tidak berjalan setelah restart.',
        deploymentNotReported: 'Runtime tidak melaporkan penerapan.',
        notReady: 'Ia belum siap; coba lagi sebentar lagi.',
        checkTimeout: 'Tes tidak selesai dalam 20 detik.',
        hostNoSettings: 'Runtime lokal tidak memerlukan pengaturan koneksi.',
      },
      prefixed: {
        startFailed: 'Mulai gagal: {{detail}}',
        stopFailed: 'Penghentian gagal: {{detail}}',
        restartFailed: 'Gagal memulai ulang: {{detail}}',
        outcomeUnreadable: 'Hasilnya tidak dapat terbaca: {{detail}}',
      },
    },
    confirm: {
      cancel: 'Batal',
      typeLabel: 'Ketik {{text}} untuk konfirmasi',
    },
    environments: {
      title: 'Menyebarkan lingkungan',
      description:
        'Di mana aplikasi disebarkan, dan siapa yang boleh disebarkan di sana.',
      open: 'Buka',
      loadOneFailed: 'Tidak dapat memuat lingkungan.',
      settingsTitle: 'Pengaturan lingkungan',
      readOnly:
        'Anda dapat melihat pengaturan lingkungan ini tetapi tidak dapat mengubahnya.',
      danger: 'Hapus lingkungan',
      deleteDescription:
        'Menghapus lingkungan dan variabelnya. Aplikasi yang diterapkan di sini harus dihapus terlebih dahulu.',
      discard: 'Buang perubahan',
      anyone: 'Siapa pun yang boleh mengerahkan',
      unlimited: 'Tidak ada batasan',
      apps: 'Aplikasi',
      appsDescription: 'Aplikasi disebarkan ke lingkungan ini.',
      appsEmpty: 'Belum ada aplikasi yang diterapkan di sini.',
      sampleData: 'Memuat data sampel pada penerapan pertama',
      sampleDataHint:
        'Penerapan pertama aplikasi di sini menginstal data sampelnya (APP_SAMPLE_DATA=true). Gunakan untuk pratinjau, bukan untuk produksi.',
      add: 'Tambahkan lingkungan',
      edit: 'Edit',
      delete: 'Hapus',
      save: 'Simpan',
      cancel: 'Batal',
      check: 'Periksa',
      reachable: '{{name}} dapat dijangkau.',
      unreachable: '{{name}} tidak dapat dijangkau.',
      deleted: 'Lingkungan {{name}} dihapus.',
      saved: 'Lingkungan {{name}} disimpan.',
      added: 'Lingkungan {{name}} ditambahkan.',
      loadFailed: 'Tidak dapat memuat lingkungan.',
      emptyTitle: 'Belum ada lingkungan',
      emptyNoAccess: 'Minta administrator untuk menambahkan lingkungan.',
      emptyDescription:
        'Tambahkan lingkungan untuk aplikasi yang akan di-deploy.',
      editTitle: 'Sunting {{name}}',
      formDescription:
        'Di mana aplikasi diterapkan, bagaimana aplikasi tersebut dijangkau, dan siapa yang dapat menerapkannya di sana.',
      configHint: 'Pengaturan pengemudi, sebagai objek JSON.',
      secretHint:
        'Tersimpan terenkripsi dan tidak pernah ditampilkan lagi; biarkan kosong untuk disimpan.',
      invalidJson: 'Masukkan objek JSON, seperti {}.',
      protectedHint:
        'Setiap penerapan, oleh seseorang atau CI, menunggu pemberi persetujuan, yang mengetikkan ID aplikasi lagi untuk menyetujuinya.',
      approversColumn: 'Yang memberi persetujuan',
      approversPlaceholder: 'Pilih pemberi persetujuan',
      approversHint:
        'Siapa pun di antara mereka boleh menyetujui, termasuk permintaan mereka sendiri. Jika tidak ada yang dipilih, orang yang diizinkan untuk menyetujui penerapan yang dilindungi akan memutuskan.',
      confirmDelete: 'Hapus lingkungan {{id}}?',
      id: 'ID Lingkungan',
      name: 'Nama',
      driver: 'Sopir',
      runsOn: 'Berjalan terus',
      policy: 'Kebijakan',
      publicUrl: 'Pola URL publik',
      config: 'Pengaturan (JSON)',
      secret: 'Kredensial (JSON, hanya tulis)',
      secretStored:
        'Kredensial disimpan; masukkan yang baru untuk menggantikannya.',
      protected: 'Dilindungi',
      approvers: 'Yang memberi persetujuan',
      pickDriver:
        'Pilih bagaimana aplikasi di lingkungan ini dijalankan. Suatu lingkungan mempertahankan penggeraknya.',
      next: 'Lanjutkan',
      addWith: 'Tambahkan lingkungan {{driver}}',
      changeDriver: 'Perubahan',
      basics: 'Lingkungan',
      namePlaceholder: 'Pementasan',
      idHint:
        'Huruf kecil, angka, garis bawah dan garis; tidak dapat diubah nanti.',
      policyDescription: 'Siapa yang boleh ditempatkan di sini.',
      appDefaults: 'Aplikasi',
      appDefaultsDescription:
        'Aplikasi paling banyak sebanyak ini, dan ketika Aplikasi yang dibuat tanpa kebijakan runtime-nya sendiri berhenti dan menjadi tidak aktif. Kosong: tidak ada batasan, tidak pernah.',
      maxApps: 'Kebanyakan Aplikasi',
      defaultIdle: 'Berhenti setelahnya (menit belum dikunjungi)',
      defaultDormant: 'Tidak aktif setelahnya (berjam-jam tidak dikunjungi)',
      noForm:
        'Tidak ada formulir pengaturan; pengaturan dimasukkan sebagai JSON ({{kind}}).',
      imageSource: 'Rilis gambar',
      imageSourceDescription:
        'Tarik setiap gambar rilis dari registri dengan intisari, dengan kredensial penarikannya, sehingga lingkungan ini menjalankan gambar yang sama yang didorong oleh CI dan menjalankan lingkungan lainnya.',
      registry: 'Registri',
      noRegistry: 'Tidak ada: menarik gambar publik secara anonim',
      newRegistry: 'Registri baru',
      editRegistry: 'Edit',
      cancelRegistryEdit: 'Batalkan pengeditan',
      registryShared:
        'Perubahan berlaku untuk setiap lingkungan yang diambil dari registri ini.',
    },
    registries: {
      check: 'Uji koneksi',
      url: 'Alamat',
      urlHint:
        'Asalnya, seperti https://ghcr.io;, alamat localhost dicapai melalui HTTP.',
      namespace: 'Namespace',
      namespaceHint: 'Gambar rilis jalur berada di bawah, seperti acme.',
      pull: 'Tarik kredensial',
      pullHint:
        'Untuk lingkungan yang mengambil dari registri ini; tinggalkan mereka di tempat yang memungkinkan penarikan anonim.',
      username: 'Nama Pengguna',
      password: 'Kata sandi atau token',
      checkOk: 'Terhubung',
      checkFailed: 'Tes koneksi gagal.',
      checkFailedTitle: 'Tidak dapat menggunakan registri',
      anonymous:
        'Registri menjawab tanpa kredensial: siapa pun yang mencapainya dapat menariknya.',
      status: {
        ok: 'diterima',
        failed: 'menolak',
        notSet: 'tidak disetel',
      },
    },
    artifacts: {
      title: 'Artefak',
      tarball: 'Arsipkan',
      image: 'Gambar',
      ran: 'Berlari',
      ranTarball: 'Arsip, dalam proses',
    },
    driverForm: {
      advanced: 'Pengaturan lanjutan',
      advancedHint:
        'Defaultnya sesuai dengan sebagian besar lingkungan; buka grup untuk mengubahnya.',
      on: 'Aktif',
      off: 'Mati',
      noLimit: 'Tidak ada batasan',
      writeOnly: '(hanya tulis)',
      secretSet: 'Tetapkan',
      secretCleared: 'Dihapus saat Anda menyimpan',
      replace: 'Ganti',
      clear: 'Hapus',
      undo: 'Batalkan',
      keepStored: 'Simpan yang tersimpan',
      jsonTitle: 'Pengaturan pengemudi',
      jsonDescription:
        'Driver ini tidak memiliki formulir pengaturan; masukkan pengaturannya sebagai JSON.',
      check: 'Uji koneksi',
      checkOk: 'Terhubung',
      checkFailed: 'Tes koneksi gagal.',
      checkFailedTitle: 'Tidak dapat terhubung',
      fixErrors:
        'Beberapa pengaturan perlu diperbaiki; mereka ditandai di atas.',
      errors: {
        required: 'Diperlukan.',
        number: 'Masukkan nomor.',
        integer: 'Masukkan bilangan bulat.',
        range: 'Di luar jangkauan yang diperbolehkan.',
        mapLine: 'Tulis satu NAME=nilai per baris.',
        mapName:
          'Nama berupa huruf, angka, dan garis bawah, tidak dimulai dengan angka.',
      },
    },
    driverForms: {
      host: {
        description:
          'Menjalankan aplikasi di server ini: dalam proses anak App Host, aplikasi ini dimulai, atau masing-masing dalam wadah Docker.',
        runtime: 'Mode Jalankan',
        backend: 'Mode Jalankan',
        backendInProcess: 'Sedang dalam proses',
        backendInProcessHint:
          'Berjalan dalam proses anak App Host yang dimulai server ini, dibagikan oleh semua aplikasi tersebut. Cocok untuk pratinjau.',
        backendDocker: 'Docker',
        backendDockerHint:
          'Satu kontainer per aplikasi, diisolasi satu sama lain. Cocok untuk pengujian dan produksi.',
        dockerConnection: 'Koneksi Docker',
        dockerConnectionDescription:
          'Menggunakan Docker di server ini, ditemukan dari DOCKER_HOST atau konteks Docker saat ini, dengan pengaturan wadah yang disarankan. Uji koneksi untuk melihat Docker mana yang ditemukan.',
        access: 'Alamat akses',
        publicUrl: 'Pola URL publik',
        publicUrlHint:
          'Saat orang membuka aplikasi, dengan {appId} di jalur atau nama host; kosong menggunakan alamat server itu sendiri.',
        check: {
          url: 'Alamat',
          apps: 'Aplikasi berjalan',
          endpoint: 'Docker',
          version: 'Versi Docker',
          platform: 'Peron',
          errors: {
            unsupported:
              'Hanya Docker di server ini yang didukung: DOCKER_HOST harus berupa soket unix:// atau proxy soket tcp://.',
            socketMissing:
              'Tidak ada soket Docker di sana. Apakah Docker terinstal dan berjalan di server ini?',
            permission:
              'Docker menolak akses. Pengguna yang menjalankan aplikasi ini mungkin tidak menggunakan soket Docker.',
            refused:
              'Tidak ada yang menerima koneksi di alamat itu. Periksa apakah Docker sedang berjalan.',
            timeout: 'Docker tidak menjawab tepat waktu.',
          },
        },
      },
    },
  },
  actions: {
    close: 'Tutup',
  },
  status: {
    loading: 'Memuat',
  },
};

export default idID;
