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
    busyHelp: 'Tunggu hingga operasi data saat ini selesai.',
    disabled: {
      title: 'Aplikasi ini bukan demo',
      help: 'Mode demo nonaktif. Deployment mengaktifkannya dengan NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'Permintaan tidak selesai. Coba lagi.',
      demoModeRequired: 'Hanya bisa dilakukan saat mode demo aktif.',
      signedOut: 'Sesi Anda telah berakhir. Masuk lagi.',
      denied: 'Anda tidak memiliki izin untuk melihat pengaturan demo.',
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
      absentSummary: 'Belum ada data demo yang dibuat.',
      failed: 'Proses terakhir tidak selesai',
      unavailable: 'Tidak ada data demo',
      unavailableHelp: 'Aplikasi ini tidak mendaftarkan kumpulan data demo.',
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
