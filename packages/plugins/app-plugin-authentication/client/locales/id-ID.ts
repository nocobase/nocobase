import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Ada yang tidak beres. Silakan coba lagi.',
    network:
      'Tidak dapat menjangkau server. Periksa koneksi Anda dan coba lagi.',
    rateLimited:
      'Terlalu banyak percobaan. Harap tunggu sebentar dan coba lagi.',
    INVALID_EMAIL_OR_PASSWORD: 'Email atau kata sandi salah.',
    INVALID_USERNAME_OR_PASSWORD: 'Nama pengguna atau kata sandi salah.',
    INVALID_PASSWORD: 'Kata sandi salah.',
    INVALID_EMAIL: 'Masukkan alamat email yang valid.',
    INVALID_USERNAME:
      'Nama pengguna hanya boleh berisi huruf, angka, garis bawah, dan titik.',
    USERNAME_TOO_SHORT: 'Nama pengguna ini terlalu pendek.',
    USERNAME_TOO_LONG: 'Nama pengguna ini terlalu panjang.',
    USERNAME_IS_ALREADY_TAKEN: 'Nama pengguna ini sudah dipakai.',
    USER_ALREADY_EXISTS: 'Akun dengan email ini sudah ada.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Akun dengan email ini sudah ada. Gunakan email lain.',
    PASSWORD_TOO_SHORT: 'Kata sandi ini terlalu pendek.',
    RESET_PASSWORD_DISABLED:
      'Reset kata sandi layanan mandiri tidak diaktifkan. Hubungi administrator untuk mengatur ulang kata sandi Anda.',
    PASSWORD_TOO_LONG: 'Kata sandi ini terlalu panjang.',
    EMAIL_NOT_VERIFIED: 'Verifikasi alamat email Anda sebelum masuk.',
    INVALID_TOKEN: 'Tautan ini tidak valid atau telah kedaluwarsa.',
    TOKEN_EXPIRED: 'Tautan ini telah kedaluwarsa.',
    ACCOUNT_DISABLED: 'Akun ini dinonaktifkan. Hubungi administrator Anda.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Akun layanan tidak dapat masuk; itu hanya bekerja melalui kunci API.',
    invalidOriginWithAddress:
      'Asal ini tidak dipercaya. Atur app.publicOrigin di config.yml ke {{origin}}, mulai ulang aplikasi, dan coba lagi.',
    INVALID_ORIGIN:
      'Asal ini tidak dipercaya. Centang app.publicOrigin di config.yml, mulai ulang aplikasi, dan coba lagi.',
    INVALID_CSRF_ORIGIN:
      'Permintaan ini datang dari situs lain dan ditolak. Muat ulang halaman dan coba lagi.',
  },
};

export default idID;
