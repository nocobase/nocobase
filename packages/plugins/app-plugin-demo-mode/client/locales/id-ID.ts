import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Data demo',
    read: 'Lihat',
    manage: 'Buat dan hapus',
    configuration: 'Konfigurasi demo',
    configure: 'Konfigurasi',
  },
  accounts: {
    menu: 'Akun demo: {{name}}',
    title: 'Akun demo',
    description:
      'Masuk ke demo dengan salah satu akun ini untuk melihat apa yang dilihat masing-masing.',
    enter: 'Masuk',
    signedInAs: 'Masuk sebagai {{name}} · Ganti',
    current: 'Saat ini',
    entering: 'Sedang masuk…',
    failed: 'Tidak dapat masuk dengan akun demo ini.',
    unavailable: 'Belum ada akun demo yang bisa dimasuki.',
    password: 'Masuk dengan kata sandi',
  },
  refused: {
    title: 'Ini adalah demo. Perubahan tidak dapat disimpan.',
    description: 'Fungsi lainnya berjalan seperti biasa.',
  },
  settings: {
    title: 'Lingkungan demo',
    refresh: 'Muat ulang',
    retry: 'Coba lagi',
    busy: 'Data demo sedang dibuat atau dihapus',
    busyHelp: 'Setelan bisa disimpan lagi setelah selesai.',
    disabled: {
      title: 'Aplikasi ini bukan demo',
      help: 'Mode demo nonaktif. Deployment mengaktifkannya dengan NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Batal',
    save: 'Simpan',
    apply: 'Terapkan perubahan',
    unsaved: 'Ada perubahan yang belum disimpan',
    discardAndReload: 'Buang perubahan saya dan muat ulang',
    switch: {
      on: 'Aktif',
      off: 'Nonaktif',
    },
    tabs: {
      overview: 'Ringkasan',
      schedule: 'Reset harian',
      writes: 'Penulisan pengunjung',
      simulation: 'Simulasi & AI',
    },
    leave: {
      title: 'Keluar tanpa menyimpan?',
      description: 'Perubahan yang belum disimpan di halaman ini akan hilang.',
      stay: 'Lanjutkan mengedit',
      discard: 'Buang perubahan',
    },
    errors: {
      failed: 'Permintaan tidak selesai. Coba lagi.',
      conflict: 'Administrator lain menyimpan setelan ini lebih dulu.',
      busy: 'Data demo sedang dibuat atau dihapus. Coba lagi setelah selesai.',
      exists: 'Data demo sudah dibuat. Reset sebagai gantinya.',
      demoModeRequired: 'Hanya bisa dilakukan saat mode demo aktif.',
      accountConflict:
        'Sebuah nama pengguna demo milik akun yang bukan milik demo.',
      unavailable: 'Aplikasi ini tidak menyediakan data demo.',
      signedOut: 'Sesi Anda telah berakhir. Masuk lagi.',
      denied: 'Anda tidak berizin mengelola demo.',
    },
    data: {
      title: 'Data demo',
      state: {
        importing: 'Sedang dibuat',
        clearing: 'Sedang dihapus',
        resetting: 'Sedang diatur ulang',
        failed: 'Gagal',
        ready: 'Siap',
        none: 'Belum dibuat',
      },
      presentSummary: 'Dibuat dalam {{language}} · {{time}}',
      resettingSummary:
        'Menghapus data saat ini, lalu membuatnya lagi dalam {{language}}.',
      phase: {
        clearing: 'Sedang dihapus',
        generating: 'Membuat ulang',
      },
      absentSummary:
        'Buat data demo agar pengunjung bisa menjelajahi aplikasi lewat cerita yang lengkap.',
      language: 'Bahasa',
      clear: 'Hapus',
      reset: 'Reset',
      generate: 'Buat',
      failed: 'Proses terakhir tidak selesai',
      readOnly:
        'Anda bisa melihat data demo; membuat, mereset, dan menghapus memerlukan izin kelola.',
      unavailable: 'Tidak ada data demo',
      unavailableHelp: 'Aplikasi ini tidak mendaftarkan kumpulan data demo.',
      cleared: 'Data demo dihapus',
      resetStarted: 'Mereset data demo',
      importStarted: 'Membuat data demo',
      confirm: {
        import: {
          title: 'Buat data demo?',
          description:
            'Data demo dibuat dalam {{language}} dan akun demonya diaktifkan.',
        },
        reset: {
          title: 'Reset data demo?',
          description:
            'Semua data bisnis di instans ini dihapus, termasuk yang ditambahkan pengunjung, lalu dibuat ulang dalam {{language}}.',
        },
        clear: {
          title: 'Hapus data demo?',
          description:
            'Semua data bisnis di instans ini dihapus, termasuk yang ditambahkan pengunjung, dan akun demo dinonaktifkan. Setelan dan administrator tetap ada.',
        },
      },
    },
    visitors: {
      title: 'Akun demo',
      off: 'Masuk cepat dinonaktifkan untuk deployment ini.',
      pending: 'Akun akan muncul di sini setelah data demo siap.',
      noData: 'Buat data demo terlebih dahulu; akunnya akan muncul di sini.',
      credentials: 'Nama pengguna {{username}} · kata sandi {{password}}',
      copyLink: 'Salin tautan',
      copyLinkFor: 'Salin tautan masuk {{name}}',
      openFor: 'Buka demo sebagai {{name}}',
      copied: 'Disalin',
      copyFailed: 'Gagal menyalin. Salin tautan dari bilah alamat.',
    },
    schedule: {
      confirmTitle: 'Simpan reset harian?',
      confirmDescription:
        'Pada waktu di bawah, semua data bisnis di instans ini dihapus dan dibuat ulang.',
      summary: 'Setiap hari pukul {{time}} ({{timezone}}), dalam {{language}}',
      off: 'Belum dijadwalkan',
      enabled: 'Reset setiap hari',
      enabledHelp: 'Menggunakan administrator yang terakhir membuat data demo.',
      time: 'Waktu',
      hour: 'Jam',
      minute: 'Menit',
      language: 'Bahasa',
      timezone: 'Zona waktu',
      noTimezone: 'Tidak ada zona waktu yang cocok',
      invalidTimezone: 'Pilih zona waktu dari daftar.',
      next: 'Reset berikutnya: {{time}}',
    },
    writes: {
      intro:
        'Saat demo aktif, penulisan ditolak secara default. Pilih koleksi yang perlu ditulis pengunjung; izin aplikasi mengontrol operasi dan akses catatan.',
      allow: 'Izinkan',
      revoke: 'Tolak lagi',
      confirmTitle: 'Ubah apa yang boleh ditulis pengunjung?',
      confirmDescription:
        'Perubahan pengunjung pada hal ini benar-benar tersimpan sampai reset berikutnya.',
      collections: {
        title: 'Koleksi',
        description:
          'Permintaan yang diizinkan aplikasi dapat menulis ke koleksi ini.',
        label: 'Koleksi yang boleh ditulis pengunjung',
        placeholder: 'Cari koleksi',
        noMatch: 'Tidak ada koleksi yang cocok',
        fixed: 'Selalu bisa ditulis',
      },
    },
    simulation: {
      kind: {
        model: 'Model',
        tool: 'Alat',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulasi',
        description: 'Yang menjawab menggantikan layanan luar di demo ini.',
        confirmTitle: 'Ubah simulasi?',
        confirmDescription:
          'Simulasi yang dinonaktifkan membuat pekerjaan itu gagal; tidak pernah dikirim ke layanan sungguhan.',
        empty: 'Tidak ada simulasi terdaftar',
        emptyHelp: 'Aplikasi belum mendaftarkan layanan simulasi.',
        onHelp: 'Menjawab dengan hasil simulasi.',
        offHelp: 'Nonaktif: pekerjaan ditolak.',
      },
      chat: {
        title: 'Obrolan daring',
        description: 'Memungkinkan pengunjung berbicara dengan AI aplikasi.',
        confirmTitle: 'Simpan setelan obrolan daring?',
        confirmDescription:
          'Percakapan pengunjung mengikuti setelan ini mulai pesan berikutnya.',
        enabled: 'Pengunjung bisa mengobrol',
        enabledHelp: 'Nonaktif: obrolan menolak pesan pengunjung.',
        tools: 'Alat',
        noTools: 'Aplikasi tidak mendeklarasikan alat obrolan.',
        policy: {
          deny: 'Tolak',
          read: 'Baca data',
          mock: 'Simulasikan',
        },
      },
    },
  },
};
export default resource;
