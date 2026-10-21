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
};
export default resource;
