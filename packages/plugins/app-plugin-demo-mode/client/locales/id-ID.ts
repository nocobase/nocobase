import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Data demo',
    read: 'Lihat',
    manage: 'Buat dan hapus',
    configuration: 'Konfigurasi demo',
    configure: 'Konfigurasi',
  },
  menu: {
    label: 'Mode demo',
    switchAccount: 'Ganti akun',
    title: 'Ini adalah lingkungan demo',
    description:
      'Data diatur ulang secara otomatis setiap hari. Perubahan tidak disimpan.',
    accountsDescription:
      'Beralih ke salah satu akun di bawah untuk melihat apa yang dapat diakses setiap peran.',
    loading: 'Memuat akun…',
  },
  accounts: {
    title: 'Akun',
    description:
      'Masuk ke demo dengan salah satu akun ini untuk melihat apa yang dilihat masing-masing.',
    enter: 'Masuk',
    current: 'Saat ini',
    entering: 'Sedang masuk…',
    failed: 'Tidak dapat masuk ke akun ini.',
    unavailable: 'Tidak ada akun yang tersedia saat ini.',
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
    busyHelp:
      'Tunggu hingga operasi data saat ini selesai sebelum memulai operasi lain.',
    disabled: {
      title: 'Aplikasi ini bukan demo',
      help: 'Mode demo nonaktif. Deployment mengaktifkannya dengan NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Batal',
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
      unavailable: 'Tidak ada akun yang tersedia saat ini.',
      title: 'Akun',
      username: 'Nama pengguna {{username}}',
      copyLink: 'Salin tautan',
      copyLinkFor: 'Salin tautan masuk {{name}}',
      openFor: 'Buka demo sebagai {{name}}',
      copied: 'Disalin',
      copyFailed: 'Gagal menyalin. Salin tautan dari bilah alamat.',
    },
    schedule: {
      title: 'Reset harian',
      description:
        'Data demo direset secara otomatis setiap hari. Jadwal dikonfigurasi melalui variabel lingkungan.',
      time: 'Waktu',
      language: 'Bahasa',
      timezone: 'Zona waktu',
      next: 'Reset berikutnya: {{time}}',
    },
  },
};
export default resource;
